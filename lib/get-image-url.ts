import "server-only";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/S3Client";

export async function getImageUrl(
  fileKey: string | null | undefined
): Promise<string | null> {
  if (!fileKey) return null;

  if (fileKey.startsWith("http://") || fileKey.startsWith("https://")) {
    return fileKey;
  }

  const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;

  if (!bucketName) {
    console.error("[getImageUrl] S3 bucket name is not configured");
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });

    return await getSignedUrl(s3, command, {
      expiresIn: 3600, // 1 hour
    });
  } catch (error) {
    console.error(
      "[getImageUrl] Failed to generate signed URL for key:",
      fileKey,
      error
    );
    return null;
  }
}
