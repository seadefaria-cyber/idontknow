import { OAuth2Client } from "google-auth-library";

interface GoogleIdentity {
  email: string;
  name: string;
  googleId: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID environment variable is required");

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new Error("Invalid Google ID token");

  return {
    email: payload.email || "",
    name: payload.name || payload.email || "",
    googleId: payload.sub,
  };
}
