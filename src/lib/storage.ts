import { createHash, randomUUID } from "crypto";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

function storageDir(): string {
  return path.resolve(process.cwd(), process.env.PATCH_STORAGE_DIR ?? "./storage/patches");
}

export function maxPatchSizeBytes(): number {
  return Number(process.env.MAX_PATCH_SIZE_BYTES ?? 26_214_400);
}

export async function savePatchFile(
  buffer: Buffer,
  originalName: string
): Promise<{ storedName: string; sha256: string }> {
  const dir = storageDir();
  await mkdir(dir, { recursive: true });

  const ext = originalName.split(".").pop()?.toLowerCase() ?? "bin";
  const storedName = `${randomUUID()}.${ext}`;
  const sha256 = createHash("sha256").update(buffer).digest("hex");

  await writeFile(path.join(dir, storedName), buffer);

  return { storedName, sha256 };
}

export async function readPatchFile(storedName: string): Promise<Buffer> {
  const safeName = path.basename(storedName);
  return readFile(path.join(storageDir(), safeName));
}
