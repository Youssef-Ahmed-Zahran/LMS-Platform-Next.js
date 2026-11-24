import { requireAdmin } from "@/app/data/admin/require-admin";
import { s3 } from "@/lib/S3Client";
import { CompleteMultipartUploadCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const completeSchema = z.object({
  fileKey: z.string().min(1, "File key is required"),
  uploadId: z.string().min(1, "Upload ID is required"),
  parts: z
    .array(
      z.object({
        PartNumber: z.number().int().min(1),
        ETag: z.string().min(1),
      })
    )
    .min(1, "At least one part is required"),
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
    const validation = completeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { fileKey, uploadId, parts } = validation.data;

    // S3 requires parts to be sorted in ascending order by PartNumber
    const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);

    await s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucketName,
        Key: fileKey,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: sortedParts,
        },
      })
    );

    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
      }),
      { expiresIn: 3600 }
    );

    return NextResponse.json({
      fileKey,
      url: signedUrl,
    });
  } catch (error) {
    console.error("[S3_MULTIPART_COMPLETE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to complete multipart upload." },
      { status: 500 }
    );
  }
}
