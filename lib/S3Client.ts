import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.AWS_REGION || "auto",
  endpoint: process.env.AWS_ENDPOINT_URL_S3 || "https://t3.storage.dev",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  // Tigris requires virtual-hosted style URLs (not path-style)
  forcePathStyle: false,
  // Disable automatic checksum calculation — Tigris doesn't support
  // the x-amz-checksum-crc32 header that AWS SDK v3 injects by default,
  // which causes 403 errors on presigned PUT requests.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export const s3Client = s3;
export default s3;
