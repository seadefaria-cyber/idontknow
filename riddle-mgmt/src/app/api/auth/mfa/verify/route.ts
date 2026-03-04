import { NextRequest, NextResponse } from "next/server";
import { TOTP, Secret } from "otpauth";
import bcrypt from "bcryptjs";
import { getMfaPendingSession, createToken, sessionCookieOptions, clearMfaPendingCookie } from "@/lib/auth";
import { decryptSecret, encryptSecret } from "@/lib/mfa-crypto";
import { dbGet, dbRun } from "@/lib/db";
import { brand } from "@/lib/brand";

export async function POST(req: NextRequest) {
  const pending = await getMfaPendingSession();
  if (!pending) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const user = await dbGet<{ mfa_secret: string | null; mfa_backup_codes: string | null }>(
    "SELECT mfa_secret, mfa_backup_codes FROM users WHERE id = ?",
    [pending.userId]
  );

  if (!user?.mfa_secret) {
    return NextResponse.json({ error: "MFA not configured" }, { status: 400 });
  }

  const trimmedCode = code.trim();
  const secretBase32 = decryptSecret(user.mfa_secret);

  // Try TOTP first
  const totp = new TOTP({
    issuer: brand.portalName,
    label: pending.username,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });

  const delta = totp.validate({ token: trimmedCode, window: 1 });

  if (delta !== null) {
    // TOTP code valid — issue full session
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

  // Try backup code (8-char hex)
  if (trimmedCode.length === 8 && user.mfa_backup_codes) {
    const hashedCodes: string[] = JSON.parse(decryptSecret(user.mfa_backup_codes));

    for (let i = 0; i < hashedCodes.length; i++) {
      if (hashedCodes[i] && bcrypt.compareSync(trimmedCode, hashedCodes[i])) {
        // Consume the backup code
        hashedCodes[i] = "";
        const encryptedCodes = encryptSecret(JSON.stringify(hashedCodes));
        await dbRun("UPDATE users SET mfa_backup_codes = ? WHERE id = ?", [encryptedCodes, pending.userId]);

        const token = createToken({
          userId: pending.userId,
          username: pending.username,
          role: pending.role,
          mfaVerified: true,
        });

        const response = NextResponse.json({ success: true, backupCodeUsed: true });
        response.cookies.set(sessionCookieOptions(token));
        response.cookies.set(clearMfaPendingCookie());
        return response;
      }
    }
  }

  return NextResponse.json({ error: "Invalid code" }, { status: 400 });
}
