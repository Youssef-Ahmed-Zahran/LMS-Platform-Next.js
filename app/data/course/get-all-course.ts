import "server-only";
import { tryCatch } from "@/hooks/try-catch";
import { prisma } from "@/lib/db";
import { getImageUrl } from "@/lib/get-image-url";
import { cacheTag, cacheLife } from "next/cache";

export type PublicLesson = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  videoKey: string | null;
  videoUrl: string | null;
  thumbnailKey: string | null;
  thumbnailUrl: string | null;
};

export type PublicChapter = {
  id: string;
  title: string;
  position: number;
  lessons: PublicLesson[];
};

export type PublicCourseWithChapters = {
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
  createdAt: Date;
  chapters: PublicChapter[];
};

// ── Cached DB + presigned-URL fetch ──────────────────────────────────────────
// Only returns a PUBLISHED course by its unique slug.
// Invalidated by revalidateTag(`public-course:${slug}`) from Server Actions.
// cacheLife "minutes": revalidate=60s, expire=3600s — safe for presigned URLs (1-hour expiry).
async function fetchPublicCourseBySlug(
  slug: string
): Promise<PublicCourseWithChapters | null> {
  "use cache";
  cacheTag(`public-course:${slug}`);
  cacheLife("minutes");

  const { data: course, error } = await tryCatch(
    prisma.course.findUnique({
      where: { slug, status: "PUBLISHED" },
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
        createdAt: true,
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
                position: true,
                videoKey: true,
                thumbnailKey: true,
              },
            },
          },
        },
      },
    })
  );

  if (error || !course) return null;

  const [imageUrl, chapters] = await Promise.all([
    course.fileKey ? getImageUrl(course.fileKey) : null,
    Promise.all(
      course.chapters.map(async (chapter) => ({
        ...chapter,
        lessons: await Promise.all(
          chapter.lessons.map(async (lesson) => ({
            ...lesson,
            videoUrl: lesson.videoKey ? await getImageUrl(lesson.videoKey) : null,
            thumbnailUrl: lesson.thumbnailKey
              ? await getImageUrl(lesson.thumbnailKey)
              : null,
          }))
        ),
      }))
    ),
  ]);

  return { ...course, imageUrl, chapters };
}

export async function getCourseBySlug(
  slug: string
): Promise<PublicCourseWithChapters | null> {
  return fetchPublicCourseBySlug(slug);
}
