import "server-only";
import { requireAdminAction } from "@/app/data/admin/require-admin";
import { tryCatch } from "@/hooks/try-catch";
import { prisma } from "@/lib/db";
import { getImageUrl } from "@/lib/get-image-url";
import { cacheTag, cacheLife } from "next/cache";

export type AdminCourse = {
  id: string;
  title: string;
  smallDescription: string;
  fileKey: string;
  imageUrl?: string | null;
  price: number;
  duration: number;
  level: string;
  category: string;
  slug: string;
  status: string;
  createdAt: Date;
  _count: { chapters: number };
};

// ── Cached DB + presigned-URL fetch ──────────────────────────────────────────
// Runs on the server and caches per userId.
// Invalidated by updateTag(`courses-list:${userId}`) from Server Actions.
// cacheLife "minutes" profile: revalidate=60s, expire=3600s — safe for presigned URLs (1-hour expiry).
async function fetchCoursesWithImages(userId: string): Promise<AdminCourse[]> {
  "use cache";
  cacheTag(`courses-list:${userId}`);
  cacheLife("minutes");

  const { data: courses, error } = await tryCatch(
    prisma.course.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        smallDescription: true,
        fileKey: true,
        price: true,
        duration: true,
        level: true,
        category: true,
        slug: true,
        status: true,
        createdAt: true,
        _count: { select: { chapters: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  );

  if (error || !courses) return [];

  return Promise.all(
    courses.map(async (course) => ({
      ...course,
      imageUrl: course.fileKey ? await getImageUrl(course.fileKey) : null,
    }))
  );
}

// ── Public API (dynamic — reads headers for auth, then hits cache) ────────────
export async function adminGetCourses(): Promise<AdminCourse[] | null> {
  const adminCheck = await requireAdminAction();
  if (!adminCheck.authorized) return null;

  return fetchCoursesWithImages(adminCheck.session.user.id);
}
