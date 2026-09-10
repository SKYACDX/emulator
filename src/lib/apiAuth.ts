import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Issues a new long-lived bearer token for the emulator app. Shown once. */
export async function issueApiToken(userId: string, label?: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.apiToken.create({
    data: { userId, tokenHash: hashToken(token), label },
  });
  return token;
}

/** Resolves the user for an `Authorization: Bearer <token>` request header. */
export async function getUserFromBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;

  const apiToken = await prisma.apiToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!apiToken) return null;

  await prisma.apiToken.update({
    where: { id: apiToken.id },
    data: { lastUsedAt: new Date() },
  });

  return apiToken.user;
}

/** For endpoints reachable from both the website (session cookie) and the
 * native app (Bearer token) — checks the cookie first since it's free
 * (no DB round-trip needed to fail), falls back to the token. */
export async function getUserFromRequest(request: Request) {
  const cookieUser = await getCurrentUser();
  if (cookieUser) return cookieUser;
  return getUserFromBearerToken(request);
}

/** Like getUserFromBearerToken, but only for admin-managed content (the
 * app listing) that isn't a regular user's own data — any logged-in
 * account can get a token, but only ADMIN can edit this. */
export async function getAdminFromBearerToken(request: Request) {
  const user = await getUserFromBearerToken(request);
  if (!user || user.role !== "ADMIN") return null;
  return user;
}
