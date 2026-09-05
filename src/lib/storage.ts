import { createHash, randomUUID } from "crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
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
