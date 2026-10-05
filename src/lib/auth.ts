import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const TOTP_PENDING_MAX_AGE_SECONDS = 60 * 5; // 5 minutes

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

// `sv` is the user's sessionVersion at signing time; getCurrentUser rejects
// the token once the DB value moves on.
type SessionPayload = { userId: string; sv: number };

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: SESSION_MAX_AGE_SECONDS,
  });
}

export async function createSessionCookie(userId: string): Promise<void> {
  const { sessionVersion } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { sessionVersion: true },
  });
  const token = signSession({ userId, sv: sessionVersion });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let payload: SessionPayload;
  try {
    payload = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as SessionPayload;
  } catch {
    return null;
  }

  const found = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      sessionVersion: true,
      id: true,
      email: true,
      username: true,
      role: true,
      avatarKey: true,
      totpEnabled: true,
      theme: true,
      customThemeBg: true,
      customThemeSurface: true,
      customThemeAccent: true,
      customThemeText: true,
      createdAt: true,
    },
  });
  if (!found) return null;

  // Tokens minted before sessionVersion existed have no `sv` and fail here too.
  const { sessionVersion, ...user } = found;
  if (payload.sv !== sessionVersion) return null;
  return user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export async function getCurrentAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

/** ADMIN or MODERATOR — anyone allowed to handle file reports. */
export async function getCurrentStaff() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) return null;
  return user;
}

type TotpPendingPayload = { userId: string; purpose: "totp-pending" };

/** Short-lived token issued after password check when 2FA is still required. */
export function signTotpPendingToken(userId: string): string {
  const payload: TotpPendingPayload = { userId, purpose: "totp-pending" };
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: TOTP_PENDING_MAX_AGE_SECONDS,
  });
}

export function verifyTotpPendingToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    }) as TotpPendingPayload;
    if (payload.purpose !== "totp-pending") return null;
    return payload.userId;
  } catch {
    return null;
  }
}
