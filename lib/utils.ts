export { cn } from "cn";

/**
 * Returns a fully-qualified public URL for a file stored in Tigris S3.
 * If fileKey is already an absolute URL or begins with a leading slash, returns it as-is.
 */
export function getStorageUrl(fileKey?: string | null): string {
  if (!fileKey) return "/placeholder-course.png";

  if (
    fileKey.startsWith("http://") ||
    fileKey.startsWith("https://") ||
    fileKey.startsWith("/")
  ) {
    return fileKey;
  }

  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
  if (!bucket) return `/${fileKey}`;

  return `https://${bucket}.t3.storage.dev/${fileKey}`;
}
