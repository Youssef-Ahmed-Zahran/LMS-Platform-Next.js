"use server";

import { requireAdminAction } from "@/app/data/admin/require-admin";
import arcjet, { detectBot, request, slidingWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { tryCatch } from "@/hooks/try-catch";
import { CourseSchema, CourseSchemaInput } from "@/schemas/zodSchemas";
import { ApiResponse } from "@/types";
import { revalidatePath, updateTag } from "next/cache";

const courseArcjet = arcjet
  .withRule(detectBot({ mode: "LIVE", allow: [] }))
  .withRule(slidingWindow({ mode: "LIVE", interval: "1m", max: 20 }));

// ── Update Course ──────────────────────────────────────────────────────────
export async function updateCourse(
  courseId: string,
  data: CourseSchemaInput
): Promise<ApiResponse<{ id: string }>> {
  const adminCheck = await requireAdminAction();
  if (!adminCheck.authorized) return adminCheck.error;
  const { session } = adminCheck;

  const req = await request();
  const decision = await courseArcjet.protect(req, { fingerprint: session.user.id });
  if (decision.isDenied()) {
    return { status: "error", message: decision.reason.isRateLimit() ? "Rate limit exceeded." : "Request denied." };
  }

  const validation = CourseSchema.safeParse(data);
  if (!validation.success) {
    return { status: "error", message: validation.error.issues[0]?.message ?? "Invalid data." };
  }

  const { data: existing } = await tryCatch(
    prisma.course.findUnique({ where: { id: courseId, userId: session.user.id }, select: { id: true, slug: true } })
  );
  if (!existing) return { status: "error", message: "Course not found." };

  const { data: slugConflict } = await tryCatch(
    prisma.course.findFirst({ where: { slug: validation.data.slug, NOT: { id: courseId } }, select: { id: true } })
  );
  if (slugConflict) return { status: "error", message: "A course with this slug already exists." };

  const { error } = await tryCatch(
    prisma.course.update({ where: { id: courseId }, data: { ...validation.data } })
  );
  if (error) return { status: "error", message: "Failed to update course." };

  // updateTag: immediate cache invalidation inside Server Actions (read-your-own-writes)
  updateTag(`course:${courseId}`);
  updateTag(`courses-list:${session.user.id}`);
  updateTag("public-courses-list");
  updateTag(`public-course:${existing.slug}`);
  updateTag(`public-course:${validation.data.slug}`);
  revalidatePath(`/admin/courses`);
  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath("/courses");
  return { status: "success", message: "Course updated successfully!", data: { id: courseId } };
}

// ── Delete Course ──────────────────────────────────────────────────────────
export async function deleteCourse(courseId: string): Promise<ApiResponse<null>> {
  const adminCheck = await requireAdminAction();
  if (!adminCheck.authorized) return adminCheck.error;
  const { session } = adminCheck;

  const { data: existing } = await tryCatch(
    prisma.course.findUnique({ where: { id: courseId, userId: session.user.id }, select: { id: true, slug: true } })
  );
  if (!existing) return { status: "error", message: "Course not found." };

  const { error } = await tryCatch(prisma.course.delete({ where: { id: courseId } }));
  if (error) return { status: "error", message: "Failed to delete course." };

  updateTag(`course:${courseId}`);
  updateTag(`courses-list:${session.user.id}`);
  updateTag("public-courses-list");
  updateTag(`public-course:${existing.slug}`);
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return { status: "success", message: "Course deleted successfully!", data: null };
}

// ── Create Chapter ─────────────────────────────────────────────────────────
export async function createChapter(courseId: string, title: string): Promise<ApiResponse<{ id: string }>> {
  const adminCheck = await requireAdminAction();
  if (!adminCheck.authorized) return adminCheck.error;
  const { session } = adminCheck;

  if (!title || title.trim().length < 1) return { status: "error", message: "Chapter title is required." };

  const { data: course } = await tryCatch(
    prisma.course.findUnique({ where: { id: courseId, userId: session.user.id }, select: { id: true } })
  );
  if (!course) return { status: "error", message: "Course not found." };

  const { data: lastChapter } = await tryCatch(
    prisma.chapter.findFirst({ where: { courseId }, orderBy: { position: "desc" }, select: { position: true } })
  );
  const position = (lastChapter?.position ?? -1) + 1;

  const { data: chapter, error } = await tryCatch(
    prisma.chapter.create({ data: { title: title.trim(), courseId, position }, select: { id: true } })
  );
  if (error || !chapter) return { status: "error", message: "Failed to create chapter." };

  updateTag(`course:${courseId}`);
  revalidatePath(`/admin/courses/${courseId}/edit`);
  return { status: "success", message: "Chapter created!", data: { id: chapter.id } };
}

// ── Reorder Chapters ───────────────────────────────────────────────────────
export async function reorderChapters(
  courseId: string,
  items: { id: string; position: number }[]
): Promise<ApiResponse<null>> {
  const adminCheck = await requireAdminAction();
  if (!adminCheck.authorized) return adminCheck.error;
  const { session } = adminCheck;

  const { data: course } = await tryCatch(
    prisma.course.findUnique({ where: { id: courseId, userId: session.user.id }, select: { id: true } })
  );
  if (!course) return { status: "error", message: "Course not found." };

  const { error } = await tryCatch(
    prisma.$transaction(items.map((item) => prisma.chapter.update({ where: { id: item.id }, data: { position: item.position } })))
  );
  if (error) return { status: "error", message: "Failed to reorder chapters." };

  updateTag(`course:${courseId}`);
  revalidatePath(`/admin/courses/${courseId}/edit`);
  return { status: "success", message: "Chapters reordered!", data: null };
}

// ── Delete Chapter ─────────────────────────────────────────────────────────
export async function deleteChapter(courseId: string, chapterId: string): Promise<ApiResponse<null>> {
  const adminCheck = await requireAdminAction();
  if (!adminCheck.authorized) return adminCheck.error;

  const { error } = await tryCatch(prisma.chapter.delete({ where: { id: chapterId } }));
  if (error) return { status: "error", message: "Failed to delete chapter." };

  updateTag(`course:${courseId}`);
  revalidatePath(`/admin/courses/${courseId}/edit`);
  return { status: "success", message: "Chapter deleted!", data: null };
}

// ── Create Lesson ──────────────────────────────────────────────────────────
export async function createLesson(
  courseId: string,
  chapterId: string,
  title: string
): Promise<ApiResponse<{ id: string }>> {
  const adminCheck = await requireAdminAction();
  if (!adminCheck.authorized) return adminCheck.error;

  if (!title || title.trim().length < 1) return { status: "error", message: "Lesson title is required." };

  const { data: lastLesson } = await tryCatch(
    prisma.lesson.findFirst({ where: { chapterId }, orderBy: { position: "desc" }, select: { position: true } })
  );
  const position = (lastLesson?.position ?? -1) + 1;

  const { data: lesson, error } = await tryCatch(
    prisma.lesson.create({ data: { title: title.trim(), chapterId, position }, select: { id: true } })
  );
  if (error || !lesson) return { status: "error", message: "Failed to create lesson." };

  updateTag(`course:${courseId}`);
  revalidatePath(`/admin/courses/${courseId}/edit`);
  return { status: "success", message: "Lesson created!", data: { id: lesson.id } };
}

// ── Reorder Lessons ────────────────────────────────────────────────────────
export async function reorderLessons(
  courseId: string,
  chapterId: string,
  items: { id: string; position: number }[]
): Promise<ApiResponse<null>> {
  const adminCheck = await requireAdminAction();
  if (!adminCheck.authorized) return adminCheck.error;

  const { error } = await tryCatch(
    prisma.$transaction(items.map((item) => prisma.lesson.update({ where: { id: item.id }, data: { position: item.position } })))
  );
  if (error) return { status: "error", message: "Failed to reorder lessons." };

  updateTag(`course:${courseId}`);
  revalidatePath(`/admin/courses/${courseId}/edit`);
  return { status: "success", message: "Lessons reordered!", data: null };
}

// ── Delete Lesson ──────────────────────────────────────────────────────────
export async function deleteLesson(
  courseId: string,
  lessonId: string
): Promise<ApiResponse<null>> {
  const adminCheck = await requireAdminAction();
  if (!adminCheck.authorized) return adminCheck.error;

  const { error } = await tryCatch(prisma.lesson.delete({ where: { id: lessonId } }));
  if (error) return { status: "error", message: "Failed to delete lesson." };

  updateTag(`course:${courseId}`);
  revalidatePath(`/admin/courses/${courseId}/edit`);
  return { status: "success", message: "Lesson deleted!", data: null };
}
