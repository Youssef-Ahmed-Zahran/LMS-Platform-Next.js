import arcjet, { detectBot, slidingWindow } from "@/lib/arcjet";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { s3 } from "@/lib/S3Client";
import ip from "@arcjet/ip";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

const presignedSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  contentType: z.string().min(1, "Content type is required"),
  size: z.number().max(MAX_SIZE, "File size exceeds the 5 GB limit"),
});

const uploadArcjet = arcjet
  .withRule(detectBot({ mode: "LIVE", allow: [] }))
  .withRule(slidingWindow({ mode: "LIVE", interval: "1m", max: 5 }));

export async function POST(req: NextRequest) {
  try {
    const adminResult = await requireAdmin(req);
    if (adminResult instanceof NextResponse) return adminResult;

    const { userId: adminId } = adminResult;
    const userId = adminId || ip(req) || "127.0.0.1";

    const decision = await uploadArcjet.protect(req, { fingerprint: userId });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          { error: "Too many upload requests. Please slow down and try again later." },
          { status: 429 }
        );
      }
      if (decision.reason.isBot()) {
        return NextResponse.json(
          { error: "Automated bot traffic is not allowed." },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "Upload request denied by security shield." },
        { status: 403 }
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
    const validation = presignedSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { fileName, contentType } = validation.data;

    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: `Content type "${contentType}" is not allowed. Use MP4, WebM, OGG, MOV, AVI, or MKV.` },
        { status: 400 }
      );
    }

    const sanitizedName = fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-");
    const uniqueKey = `videos/${uuidv4()}-${sanitizedName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueKey,
      ContentType: contentType,
    });

    // Generate presigned PUT URL valid for 2 hours (large file uploads take time)
    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: 7200,
      unhoistableHeaders: new Set([
        "x-amz-checksum-crc32",
        "x-amz-sdk-checksum-algorithm",
      ]),
    });

    const publicUrl = `https://${bucketName}.t3.storage.dev/${uniqueKey}`;

    return NextResponse.json({
      presignedUrl,
      fileKey: uniqueKey,
      key: uniqueKey,
      url: publicUrl,
    });
  } catch (error) {
    console.error("[S3_VIDEO_UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: "Video upload failed. Please try again." },
      { status: 500 }
    );
  }
}
