import arcjet, { slidingWindow } from "@/lib/arcjet";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { s3 } from "@/lib/S3Client";
import ip from "@arcjet/ip";
import { UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const partsSchema = z.object({
  fileKey: z.string().min(1, "File key is required"),
  uploadId: z.string().min(1, "Upload ID is required"),
  partNumbers: z
    .array(z.number().int().min(1).max(10000))
    .min(1)
    .max(500, "Maximum 500 parts per request"),
});

const partsArcjet = arcjet
  .withRule(slidingWindow({ mode: "LIVE", interval: "1m", max: 60 }));

export async function POST(req: NextRequest) {
  try {
    const adminResult = await requireAdmin(req);
    if (adminResult instanceof NextResponse) return adminResult;

    const { userId: adminId } = adminResult;
    const userId = adminId || ip(req) || "127.0.0.1";

    const decision = await partsArcjet.protect(req, { fingerprint: userId });
    if (decision.isDenied()) {
      return NextResponse.json(
        {
          error: decision.reason.isRateLimit()
            ? "Too many part requests. Please slow down."
            : "Request denied by security shield.",
        },
        { status: decision.reason.isRateLimit() ? 429 : 403 }
      );
    }

    const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
    if (!bucketName) {
      return NextResponse.json(
        { error: "S3 bucket name is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const validation = partsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { fileKey, uploadId, partNumbers } = validation.data;

    const parts = await Promise.all(
      partNumbers.map(async (partNumber) => {
        const command = new UploadPartCommand({
          Bucket: bucketName,
          Key: fileKey,
          UploadId: uploadId,
          PartNumber: partNumber,
        });

        const presignedUrl = await getSignedUrl(s3, command, {
          expiresIn: 7200, // 2 hours
          unhoistableHeaders: new Set([
            "x-amz-checksum-crc32",
            "x-amz-sdk-checksum-algorithm",
          ]),
        });

        return { partNumber, presignedUrl };
      })
    );

    return NextResponse.json({ parts });
  } catch (error) {
    console.error("[S3_MULTIPART_PARTS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to generate part upload URLs." },
      { status: 500 }
    );
  }
}
