import { dbGet, dbRun } from "@/lib/db";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

interface GoogleDriveConnection {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string;
  email: string | null;
  connected_at: string;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink: string;
  parents?: string[];
  driveFolder?: string;
  thumbnailLink?: string;
}

export function getAuthUrl(state: string, loginHint?: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    response_type: "code",
    scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email",
    redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
    state,
    access_type: "offline",
    prompt: "consent",
  });
  if (loginHint) {
    params.set("login_hint", loginHint);
  }
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<GoogleTokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }
  return res.json();
}

export async function getUserEmail(accessToken: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to get user email");
  const data = await res.json();
  return data.email;
}

export async function getConnection(userId: string): Promise<GoogleDriveConnection | null> {
  const row = await dbGet<GoogleDriveConnection>(
    "SELECT * FROM google_drive_connections WHERE user_id = ? ORDER BY connected_at DESC LIMIT 1",
    [userId]
  );
  return row ?? null;
}

export async function refreshTokenIfNeeded(conn: GoogleDriveConnection): Promise<GoogleDriveConnection> {
  const expiresAt = new Date(conn.access_token_expires_at + "Z").getTime();
  const now = Date.now();

  if (expiresAt - now > 5 * 60 * 1000) {
    return conn;
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: conn.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to refresh Google token");
  }

  const tokens: GoogleTokenResponse = await res.json();
  const accessExpires = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await dbRun(
    "UPDATE google_drive_connections SET access_token = ?, access_token_expires_at = ? WHERE id = ?",
    [tokens.access_token, accessExpires, conn.id]
  );

  return { ...conn, access_token: tokens.access_token, access_token_expires_at: accessExpires };
}

export async function listFiles(accessToken: string, query?: string): Promise<DriveFile[]> {
  const params = new URLSearchParams({
    pageSize: "100",
    fields: "files(id,name,mimeType,size,modifiedTime,webViewLink,parents,thumbnailLink)",
    orderBy: "modifiedTime desc",
  });
  if (query) {
    params.set("q", query);
  } else {
    params.set("q", "trashed = false");
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive API error: ${text}`);
  }
  const data = await res.json();
  return data.files || [];
}

/**
 * Get a map of folder ID → folder name for the user's top-level folders.
 */
export async function getFolderMap(accessToken: string): Promise<Record<string, string>> {
  const params = new URLSearchParams({
    pageSize: "50",
    fields: "files(id,name)",
    q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return {};
  const data = await res.json();
  const map: Record<string, string> = {};
  for (const f of data.files || []) {
    map[f.id] = f.name;
  }
  return map;
}

/**
 * List files with folder-based categorization.
 * Files in a "Legal" folder → driveFolder: "legal"
 * Files in a "Creative" folder → driveFolder: "creative"
 * Everything else → driveFolder: "other"
 */
export async function listFilesWithFolders(accessToken: string): Promise<DriveFile[]> {
  const [files, folderMap] = await Promise.all([
    listFiles(accessToken),
    getFolderMap(accessToken),
  ]);

  // Build reverse lookup: folder ID → normalized category
  const folderCategory: Record<string, string> = {};
  for (const [id, name] of Object.entries(folderMap)) {
    const lower = name.toLowerCase();
    if (lower === "legal" || lower === "legal documents" || lower === "contracts") {
      folderCategory[id] = "legal";
    } else if (lower === "creative" || lower === "creative assets" || lower === "assets" || lower === "media") {
      folderCategory[id] = "creative";
    } else if (lower === "distribution" || lower === "royalties" || lower === "royalty statements") {
      folderCategory[id] = "royalties";
    } else if (lower === "publishing") {
      folderCategory[id] = "royalties";
    }
  }

  return files.map((f) => {
    let driveFolder = "other";
    if (f.parents) {
      for (const parentId of f.parents) {
        if (folderCategory[parentId]) {
          driveFolder = folderCategory[parentId];
          break;
        }
      }
    }
    return { ...f, driveFolder };
  });
}

export async function listDocs(accessToken: string): Promise<DriveFile[]> {
  return listFiles(accessToken, "mimeType = 'application/vnd.google-apps.document' and trashed = false");
}

/**
 * Get or create a folder in Google Drive by name.
 * Caches folder IDs in a module-level map to avoid repeated lookups within the same process.
 */
const folderIdCache = new Map<string, string>();

export async function getOrCreateFolder(accessToken: string, folderName: string): Promise<string> {
  const cacheKey = `${accessToken.slice(-8)}_${folderName}`;
  const cached = folderIdCache.get(cacheKey);
  if (cached) return cached;

  // Search for existing folder
  const q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  const params = new URLSearchParams({ q, fields: "files(id)", pageSize: "1" });
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files?.length > 0) {
      folderIdCache.set(cacheKey, data.files[0].id);
      return data.files[0].id;
    }
  }

  // Create new folder
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Failed to create Drive folder: ${text}`);
  }

  const folder = await createRes.json();
  folderIdCache.set(cacheKey, folder.id);
  return folder.id;
}

export async function uploadFileToDrive(
  accessToken: string,
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer,
  parentFolderId?: string
): Promise<DriveFile> {
  const boundary = "-------drive_upload_boundary";
  const metadataObj: Record<string, unknown> = { name: fileName, mimeType };
  if (parentFolderId) {
    metadataObj.parents = [parentFolderId];
  }
  const metadata = JSON.stringify(metadataObj);

  const bodyParts = [
    `--${boundary}\r\n`,
    "Content-Type: application/json; charset=UTF-8\r\n\r\n",
    metadata + "\r\n",
    `--${boundary}\r\n`,
    `Content-Type: ${mimeType}\r\n\r\n`,
  ];

  const headerBuffer = Buffer.from(bodyParts.join(""));
  const footerBuffer = Buffer.from(`\r\n--${boundary}--`);
  const body = Buffer.concat([headerBuffer, fileBuffer, footerBuffer]);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive upload failed: ${text}`);
  }

  return res.json();
}
