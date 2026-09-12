import { prisma } from "@/lib/prisma";

export async function recordLoginAttempt(data: {
  email: string;
  success: boolean;
  method: "password" | "totp" | "passkey" | "app-token";
  ip: string;
  userAgent: string | null;
  userId?: string;
}) {
  // Best-effort — a logging failure should never block an actual login.
  await prisma.loginAttempt.create({ data }).catch(() => {});
}
