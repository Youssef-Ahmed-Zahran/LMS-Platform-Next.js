import { requireAdmin } from "@/app/data/admin/require-admin";
import { s3 } from "@/lib/S3Client";
import { AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const abortSchema = z.object({
  fileKey: z.string().min(1, "File key is required"),
  uploadId: z.string().min(1, "Upload ID is required"),
});

export async function POST(req: NextRequest) {
  try {
    const adminResult = await requireAdmin(req);
    if (adminResult instanceof NextResponse) return adminResult;

    const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
    if (!bucketName) {
      return NextResponse.json(
        { error: "S3 bucket name is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const validation = abortSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { fileKey, uploadId } = validation.data;

    await s3.send(
      new AbortMultipartUploadCommand({
        Bucket: bucketName,
        Key: fileKey,
        UploadId: uploadId,
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[S3_MULTIPART_ABORT_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to abort multipart upload." },
      { status: 500 }
    );
  }
}
