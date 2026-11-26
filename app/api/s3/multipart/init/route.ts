import arcjet, { slidingWindow } from "@/lib/arcjet";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { s3 } from "@/lib/S3Client";
import ip from "@arcjet/ip";
import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB

const ALLOWED_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
]);

const initSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  contentType: z.string().min(1, "Content type is required"),
  size: z.number().positive().max(MAX_SIZE, "File size exceeds the 5 GB limit"),
});

const initArcjet = arcjet
  .withRule(slidingWindow({ mode: "LIVE", interval: "1m", max: 10 }));

export async function POST(req: NextRequest) {
  try {
    const adminResult = await requireAdmin(req);
    if (adminResult instanceof NextResponse) return adminResult;

    const { userId: adminId } = adminResult;
    const userId = adminId || ip(req) || "127.0.0.1";

    const decision = await initArcjet.protect(req, { fingerprint: userId });
    if (decision.isDenied()) {
      return NextResponse.json(
        {
          error: decision.reason.isRateLimit()
            ? "Too many upload requests. Please slow down."
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
    const validation = initSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { fileName, contentType } = validation.data;

    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json(
        {
          error: `Content type "${contentType}" is not allowed. Use MP4, WebM, OGG, MOV, AVI, or MKV.`,
        },
        { status: 400 }
      );
    }

    const sanitizedName = fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-");
    const uniqueKey = `videos/${uuidv4()}-${sanitizedName}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: uniqueKey,
      ContentType: contentType,
    });

    const response = await s3.send(command);

    if (!response.UploadId) {
      throw new Error("S3 did not return an UploadId");
    }

    return NextResponse.json({
      uploadId: response.UploadId,
      fileKey: uniqueKey,
    });
  } catch (error) {
    console.error("[S3_MULTIPART_INIT_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to initialize multipart upload." },
      { status: 500 }
    );
  }
}
