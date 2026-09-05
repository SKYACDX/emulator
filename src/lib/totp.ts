import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

function getEncryptionKey(): Buffer {
  const key = process.env.TOTP_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error("TOTP_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(key, "hex");
}

/** AES-256-GCM encrypt, output as base64(iv):base64(authTag):base64(ciphertext). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decryptSecret(encrypted: string): string {
  const [ivB64, authTagB64, ciphertextB64] = encrypted.split(":");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function generateTotpSecret(): string {
  return generateSecret();
}

export async function verifyTotpToken(token: string, secret: string): Promise<boolean> {
  try {
    // epochTolerance allows one 30s step of clock drift either side.
    const result = await verify({ secret, token, epochTolerance: 30 });
    return result.valid;
  } catch {
    return false;
  }
}

export async function buildTotpQrCodeDataUrl(
  email: string,
  secret: string
): Promise<{ otpauthUrl: string; qrCodeDataUrl: string }> {
  const otpauthUrl = generateURI({ issuer: "RomHack Hub", label: email, secret });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { otpauthUrl, qrCodeDataUrl };
}
