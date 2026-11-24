import { adminGetLesson } from "@/app/data/admin/admin-get-lesson";
import { notFound } from "next/navigation";
import { LessonForm } from "./_components/LessonForm";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowLeft, FileVideo } from "lucide-react";
import { Suspense } from "react";

interface LessonIdPageProps {
  params: Promise<{ courseId: string; chapterId: string; lessonId: string }>;
}

function LessonEditSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-9 w-36" />
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-lg shrink-0" />
        <Skeleton className="h-7 w-64" />
      </div>
      <Skeleton className="h-[520px] w-full rounded-xl" />
    </div>
  );
}

async function LessonEditContent({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string; lessonId: string }>;
}) {
  const { courseId, chapterId, lessonId } = await params;
  const lesson = await adminGetLesson(lessonId);

  if (!lesson || lesson.chapter.courseId !== courseId) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Back button ── */}
      <Link
        href={`/admin/courses/${courseId}/edit`}
        className={
          buttonVariants({ variant: "outline", size: "sm" }) + " self-start"
        }
      >
        <ArrowLeft className="size-4 mr-2" />
        Back to Course
      </Link>

      {/* ── Page Header ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 shrink-0">
          <FileVideo className="size-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {lesson.chapter.course.title} &rsaquo; {lesson.chapter.title}
          </p>
          <h1 className="text-2xl font-bold truncate">{lesson.title}</h1>
        </div>
      </div>

      {/* ── Lesson Form ── */}
      <LessonForm lesson={lesson} courseId={courseId} chapterId={chapterId} />
    </div>
  );
}

export default function LessonIdPage({ params }: LessonIdPageProps) {
  return (
    <Suspense fallback={<LessonEditSkeleton />}>
      <LessonEditContent params={params} />
    </Suspense>
  );
}
