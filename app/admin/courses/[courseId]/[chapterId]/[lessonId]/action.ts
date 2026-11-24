"use server";

import { requireAdminAction } from "@/app/data/admin/require-admin";
import arcjet, { detectBot, slidingWindow, request } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { tryCatch } from "@/hooks/try-catch";
import { LessonEditSchema, LessonEditSchemaInput } from "@/schemas/zodSchemas";
import { ApiResponse } from "@/types";
import { revalidatePath, updateTag } from "next/cache";

const lessonArcjet = arcjet
  .withRule(detectBot({ mode: "LIVE", allow: [] }))
  .withRule(slidingWindow({ mode: "LIVE", interval: "1m", max: 20 }));

// ── Update Lesson ──────────────────────────────────────────────────────────
export async function updateLesson(
  courseId: string,
  chapterId: string,
  lessonId: string,
  data: LessonEditSchemaInput,
): Promise<ApiResponse<{ id: string }>> {
  const adminCheck = await requireAdminAction();
  if (!adminCheck.authorized) return adminCheck.error;
  const { session } = adminCheck;

  const req = await request();
  const decision = await lessonArcjet.protect(req, { fingerprint: session.user.id });
  if (decision.isDenied()) {
    return {
      status: "error",
      message: decision.reason.isRateLimit()
        ? "Rate limit exceeded."
        : "Request denied.",
    };
  }

  const validation = LessonEditSchema.safeParse(data);
  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  // Verify lesson belongs to this chapter/course (ownership check)
  const { data: existing } = await tryCatch(
    prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, chapter: { select: { courseId: true } } },
    }),
  );
  if (!existing || existing.chapter.courseId !== courseId) {
    return { status: "error", message: "Lesson not found." };
  }

  const { error } = await tryCatch(
    prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: validation.data.title,
        description: validation.data.description ?? null,
        thumbnailKey: validation.data.thumbnailKey ?? null,
        videoKey: validation.data.videoKey ?? null,
      },
    }),
  );
  if (error) return { status: "error", message: "Failed to update lesson." };

  updateTag(`course:${courseId}`);
  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/admin/courses/${courseId}/${chapterId}/${lessonId}`);
  return {
    status: "success",
    message: "Lesson updated successfully!",
    data: { id: lessonId },
  };
}
