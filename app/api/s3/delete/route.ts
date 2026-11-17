import arcjet, { detectBot, slidingWindow } from "@/lib/arcjet";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { s3 } from "@/lib/S3Client";
import ip from "@arcjet/ip";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const deleteRequestSchema = z.object({
  key: z.string().min(1, "File key is required"),
});

// Configure Arcjet protection rules for delete operations:
// 1. Base shield (DDoS / attacks) from lib/arcjet.ts
// 2. Bot detection: block automated scrapers/bots from deleting files
// 3. Sliding window rate limit: max 2 deletions per minute per user/IP
const deleteArcjet = arcjet
  .withRule(
    detectBot({
      mode: "LIVE",
      allow: [],
    })
  )
  .withRule(
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
    const decision = await deleteArcjet.protect(req, { fingerprint: userId });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          { error: "Too many delete requests. Please slow down and try again later." },
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
        { error: "Delete request denied by security shield." },
        { status: 403 }
      );
    }

    // ── 3. Validate request payload ────────────────────────────────────────
    const body = await req.json();
    const validation = deleteRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { key } = validation.data;
    const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;

    if (!bucketName) {
      return NextResponse.json(
        { error: "S3 bucket name is not configured on the server." },
        { status: 500 }
      );
    }

    // ── 4. Delete object from S3 Bucket ────────────────────────────────────
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3.send(command);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully from S3",
      key,
    });
  } catch (error) {
    console.error("[S3_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to delete file from S3. Please try again." },
      { status: 500 }
    );
  }
}

// Support DELETE method as well for REST conventions
export { POST as DELETE };
