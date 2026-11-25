import "server-only";
import { tryCatch } from "@/hooks/try-catch";
import { prisma } from "@/lib/db";
import { getImageUrl } from "@/lib/get-image-url";
import { cacheTag, cacheLife } from "next/cache";

export type PublicCourse = {
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
  _count: { chapters: number };
};

// ── Cached DB + presigned-URL fetch ──────────────────────────────────────────
// Only returns PUBLISHED courses for the public listing page.
// cacheLife "minutes": revalidate=60s, expire=3600s — safe for presigned URLs (1-hour expiry).
async function fetchPublicCoursesWithImages(): Promise<PublicCourse[]> {
  "use cache";
  cacheTag("public-courses-list");
  cacheLife("minutes");

  const { data: courses, error } = await tryCatch(
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
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

export async function getAllCourses(): Promise<PublicCourse[]> {
  return fetchPublicCoursesWithImages();
}
