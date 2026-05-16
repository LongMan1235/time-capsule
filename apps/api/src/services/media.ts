import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";

export const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: Boolean(env.S3_ENDPOINT),
  credentials:
    env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
      ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
      : undefined
});

export async function createPresignedUpload(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ServerSideEncryption: "AES256"
  });

  return getSignedUrl(s3, command, { expiresIn: 60 * 10 });
}

export function publicMediaUrl(key: string) {
  return env.S3_PUBLIC_CDN_URL ? `${env.S3_PUBLIC_CDN_URL}/${key}` : key;
}
