import arcjet, { slidingWindow } from "@/lib/arcjet";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { s3 } from "@/lib/S3Client";
import ip from "@arcjet/ip";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const presignedSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  contentType: z.string().min(1, "Content type is required"),
  size: z.number().max(MAX_SIZE, "File size exceeds the 10 MB limit"),
});

// Configure Arcjet protection rules for uploads:
// 1. Base shield (DDoS / attacks) from lib/arcjet.ts
// 2. Sliding window rate limit: max 2 upload requests per minute per user/IP
const uploadArcjet = arcjet.withRule(
  slidingWindow({
    mode: "LIVE",
    interval: "1m",
    max: 2,
  })
);

export async function POST(req: NextRequest) {
  try {
    // ── 1. Admin-only guard (auth + role check) ────────────────────────────
    const adminResult = await requireAdmin(req);
    if (adminResult instanceof NextResponse) return adminResult;

    const { userId: adminId } = adminResult;
    const userId = adminId || ip(req) || "127.0.0.1";

    // ── 2. Arcjet Security Protection ──────────────────────────────────────
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

    const contentTypeHeader = req.headers.get("content-type") || "";

    // ── 3A. Multipart FormData (Server-side upload) ────────────────────────
    if (contentTypeHeader.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "No file provided in form data." },
          { status: 400 }
        );
      }

      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: `File type "${file.type}" is not allowed. Use JPEG, PNG, WebP, or GIF.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: "File size exceeds the 10 MB limit." },
          { status: 400 }
        );
      }

      const sanitizedName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, "-")
        .replace(/-+/g, "-");
      const uniqueKey = `${uuidv4()}-${sanitizedName}`;

      const bytes = await file.arrayBuffer();

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: uniqueKey,
          Body: Buffer.from(bytes),
          ContentType: file.type,
          ContentLength: file.size,
        })
      );

return NextResponse.json({
  fileKey: uniqueKey,
  key: uniqueKey,
});
  }

    // ── 3B. JSON Payload (Presigned URL request) ───────────────────────────
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
        { error: `Content type "${contentType}" is not allowed.` },
        { status: 400 }
      );
    }

    const sanitizedName = fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-");
    const uniqueKey = `${uuidv4()}-${sanitizedName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueKey,
      ContentType: contentType,
    });

    // Generate presigned PUT URL valid for 3 minutes (180s)
    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: 180,
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
    console.error("[S3_UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
