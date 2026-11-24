import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";
import { getImageUrl } from "@/lib/get-image-url";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export type AdminLesson = NonNullable<Awaited<ReturnType<typeof adminGetLesson>>>;

export async function adminGetLesson(id: string) {
  const reqHeaders = await headers();
  const result = await requireAdmin({ headers: reqHeaders } as never);
  if (result instanceof NextResponse) return null;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailKey: true,
      videoKey: true,
      position: true,
      chapterId: true,
      chapter: {
        select: {
          id: true,
          title: true,
          courseId: true,
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!lesson) return null;

  const videoUrl = await getImageUrl(lesson.videoKey);

  return {
    ...lesson,
    videoUrl,
  };
}