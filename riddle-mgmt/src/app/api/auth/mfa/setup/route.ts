import { NextRequest, NextResponse } from "next/server";
import { TOTP, Secret } from "otpauth";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { getMfaPendingSession, createToken, sessionCookieOptions, clearMfaPendingCookie } from "@/lib/auth";
import { encryptSecret } from "@/lib/mfa-crypto";
import { dbGet, dbRun } from "@/lib/db";
import { brand } from "@/lib/brand";

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    codes.push(randomBytes(4).toString("hex")); // 8-char hex codes
  }
  return codes;
}

// GET: Generate QR code + backup codes for MFA setup
export async function GET() {
  const pending = await getMfaPendingSession();
  if (!pending) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Generate TOTP secret
  const secret = new Secret();
  const totp = new TOTP({
    issuer: brand.portalName,
    label: pending.username,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  const otpauthUrl = totp.toString();
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  // Store encrypted secret + hashed backup codes temporarily
  // We'll finalize on POST (when user confirms with a code)
  const encryptedSecret = encryptSecret(secret.base32);
  const hashedCodes = backupCodes.map((code) => bcrypt.hashSync(code, 10));
  const encryptedCodes = encryptSecret(JSON.stringify(hashedCodes));

  await dbRun(
    "UPDATE users SET mfa_secret = ?, mfa_backup_codes = ? WHERE id = ?",
    [encryptedSecret, encryptedCodes, pending.userId]
  );

  return NextResponse.json({
    qrCode: qrDataUrl,
    secret: secret.base32,
    backupCodes,
  });
}

// POST: Verify first TOTP code to complete MFA setup
export async function POST(req: NextRequest) {
  const pending = await getMfaPendingSession();
  if (!pending) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const user = await dbGet<{ mfa_secret: string | null }>(
    "SELECT mfa_secret FROM users WHERE id = ?",
    [pending.userId]
  );

  if (!user?.mfa_secret) {
    return NextResponse.json({ error: "MFA not initialized. Start setup first." }, { status: 400 });
  }

  // Decrypt and verify
  const { decryptSecret } = await import("@/lib/mfa-crypto");
  const secretBase32 = decryptSecret(user.mfa_secret);

  const totp = new TOTP({
    issuer: brand.portalName,
    label: pending.username,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });

  const delta = totp.validate({ token: code.trim(), window: 1 });
  if (delta === null) {
    return NextResponse.json({ error: "Invalid code. Try again." }, { status: 400 });
  }

  // Mark MFA as complete
  await dbRun("UPDATE users SET mfa_setup_complete = 1 WHERE id = ?", [pending.userId]);

  // Issue full session token
  const token = createToken({
    userId: pending.userId,
    username: pending.username,
    role: pending.role,
    mfaVerified: true,
  });

  const response = NextResponse.json({ success: true });
  response.cookies.set(sessionCookieOptions(token));
  response.cookies.set(clearMfaPendingCookie());

  return response;
}
