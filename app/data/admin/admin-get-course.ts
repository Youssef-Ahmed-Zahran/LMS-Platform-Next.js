import "server-only";
import { requireAdminAction } from "@/app/data/admin/require-admin";
import { tryCatch } from "@/hooks/try-catch";
import { prisma } from "@/lib/db";
import { getImageUrl } from "@/lib/get-image-url";
import { cacheTag, cacheLife } from "next/cache";

export type AdminCourseWithChapters = {
  id: string;
  title: string;
  description: string;
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
  updatedAt: Date;
  chapters: {
    id: string;
    title: string;
    position: number;
    lessons: {
      id: string;
      title: string;
      description: string | null;
      thumbnailKey: string | null;
      videoKey: string | null;
      position: number;
    }[];
  }[];
};

// ── Cached DB + presigned-URL fetch ──────────────────────────────────────────
// Runs on the server and caches per (courseId, userId) pair.
// Invalidated by updateTag(`course:${courseId}`) from Server Actions.
// cacheLife "minutes" profile: revalidate=60s, expire=3600s — safe for presigned URLs (1-hour expiry).
async function fetchCourseWithImage(
  courseId: string,
  userId: string
): Promise<AdminCourseWithChapters | null> {
  "use cache";
  cacheTag(`course:${courseId}`);
  cacheLife("minutes");

  const { data: course, error } = await tryCatch(
    prisma.course.findUnique({
      where: { id: courseId, userId },
      select: {
        id: true,
        title: true,
        description: true,
        smallDescription: true,
        fileKey: true,
        price: true,
        duration: true,
        level: true,
        category: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        chapters: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            position: true,
            lessons: {
              orderBy: { position: "asc" },
              select: {
                id: true,
                title: true,
                description: true,
                thumbnailKey: true,
                videoKey: true,
                position: true,
              },
            },
          },
        },
      },
    })
  );

  if (error || !course) return null;

  const imageUrl = course.fileKey ? await getImageUrl(course.fileKey) : null;
  return { ...course, imageUrl };
}

// ── Public API (dynamic — reads headers for auth, then hits cache) ────────────
export async function adminGetCourse(
  courseId: string
): Promise<AdminCourseWithChapters | null> {
  const adminCheck = await requireAdminAction();
  if (!adminCheck.authorized) return null;

  return fetchCourseWithImage(courseId, adminCheck.session.user.id);
}
