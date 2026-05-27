import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export type R2Folder = "images" | "audio" | "infographics" | "pdfs" | "videos";

/**
 * Upload a buffer or stream to R2.
 * Returns the public URL of the uploaded file.
 */
export async function uploadToR2(
  buffer: Buffer,
  folder: R2Folder,
  mimeType: string,
  filename?: string
): Promise<string> {
  const ext = mimeType.split("/")[1] ?? "bin";
  const key = `${folder}/${filename ?? randomUUID()}.${ext}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return `${PUBLIC_URL}/${key}`;
}

/**
 * Delete a file from R2 by its public URL.
 */
export async function deleteFromR2(publicUrl: string): Promise<void> {
  const key = publicUrl.replace(`${PUBLIC_URL}/`, "");
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * Generate a pre-signed URL for private access (e.g., temporary audio links).
 */
export async function getPresignedUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(r2, command, { expiresIn: expiresInSeconds });
}
