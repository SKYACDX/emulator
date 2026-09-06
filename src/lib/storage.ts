import { createHash, randomUUID } from "crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | null = null;

function s3Client(): S3Client {
  if (client) return client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set"
    );
  }

  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

function bucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME is not set");
  }
  return bucket;
}

export function maxPatchSizeBytes(): number {
  // Vercel's default serverless request body limit is ~4.5 MB on the Hobby
  // plan; keep the default comfortably under that.
  return Number(process.env.MAX_PATCH_SIZE_BYTES ?? 4_000_000);
}

export async function savePatchFile(
  buffer: Buffer,
  originalName: string
): Promise<{ storedName: string; sha256: string }> {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "bin";
  const storedName = `patches/${randomUUID()}.${ext}`;
  const sha256 = createHash("sha256").update(buffer).digest("hex");

  await s3Client().send(
    new PutObjectCommand({
      Bucket: bucketName(),
      Key: storedName,
      Body: buffer,
      ContentType: "application/octet-stream",
    })
  );

  return { storedName, sha256 };
}

/**
 * A short-lived signed URL the browser can download the patch from directly,
 * bypassing our serverless function's response body entirely.
 */
export async function getPatchDownloadUrl(
  storedName: string,
  downloadFilename: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName(),
    Key: storedName,
    ResponseContentDisposition: `attachment; filename="${downloadFilename}"`,
  });
  return getSignedUrl(s3Client(), command, { expiresIn: 300 });
}

export async function deletePatchFile(storedName: string): Promise<void> {
  await s3Client().send(
    new DeleteObjectCommand({ Bucket: bucketName(), Key: storedName })
  );
}

export function maxSharedFileSizeBytes(): number {
  // Direct-to-R2 uploads bypass Vercel's serverless body limit entirely, so
  // this can be much larger than MAX_PATCH_SIZE_BYTES. Still capped to keep
  // R2's free tier (10 GB storage) from disappearing into a few uploads.
  return Number(process.env.MAX_SHARED_FILE_SIZE_BYTES ?? 200_000_000); // 200 MB
}

/**
 * A short-lived signed URL the browser can PUT the file to directly — the
 * bytes never pass through our serverless function.
 */
export async function createFileUploadUrl(
  storedName: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName(),
    Key: storedName,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client(), command, { expiresIn: 600 });
}

export function newStoredFileName(originalName: string, prefix: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase();
  return ext ? `${prefix}/${randomUUID()}.${ext}` : `${prefix}/${randomUUID()}`;
}

/**
 * Confirms an object actually landed in R2 (after a client-side direct
 * upload) and returns its real size, so we never trust client-reported
 * metadata for what gets stored in the database.
 */
export async function headObject(
  storedName: string
): Promise<{ size: number; contentType?: string } | null> {
  try {
    const result = await s3Client().send(
      new HeadObjectCommand({ Bucket: bucketName(), Key: storedName })
    );
    return { size: result.ContentLength ?? 0, contentType: result.ContentType };
  } catch {
    return null;
  }
}

/** Signed URL for an inline <img>, not a download — no attachment header,
 * longer expiry since it's regenerated fresh on every render anyway. */
export async function getAvatarUrl(storedName: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucketName(), Key: storedName });
  return getSignedUrl(s3Client(), command, { expiresIn: 3600 });
}

export async function getFileDownloadUrl(
  storedName: string,
  downloadFilename: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName(),
    Key: storedName,
    ResponseContentDisposition: `attachment; filename="${downloadFilename}"`,
  });
  return getSignedUrl(s3Client(), command, { expiresIn: 300 });
}

export async function deleteSharedFile(storedName: string): Promise<void> {
  await s3Client().send(
    new DeleteObjectCommand({ Bucket: bucketName(), Key: storedName })
  );
}

export function maxSaveFileSizeBytes(): number {
  // Save states/SRAM saves are usually small, but a savestate with an
  // embedded screenshot can run a few MB — direct-to-R2 upload either way.
  return Number(process.env.MAX_SAVE_FILE_SIZE_BYTES ?? 20_000_000); // 20 MB
}

/**
 * Reads an object back out of R2 into memory — used to hand a
 * direct-to-R2-uploaded file to VirusTotal for scanning, since our server
 * never sees the bytes during the upload itself. Only call this for files
 * already confirmed to be under a scanning-appropriate size.
 */
export async function getObjectBuffer(storedName: string): Promise<Buffer> {
  const result = await s3Client().send(
    new GetObjectCommand({ Bucket: bucketName(), Key: storedName })
  );
  const bytes = await result.Body!.transformToByteArray();
  return Buffer.from(bytes);
}
