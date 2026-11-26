import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCourseBySlug } from "@/app/data/course/get-all-course";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen, Clock, GraduationCap } from "lucide-react";
import { CourseCurriculum } from "./_components/CourseCurriculum";
import { CourseEnrollCard } from "./_components/CourseEnrollCard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connection } from "next/server";
import { checkIfCourseBought } from "@/app/data/user/user-is-enrolled";

interface SingleCoursePageProps {
  params: Promise<{ slug: string }>;
}

const levelLabelMap: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

function SingleCourseSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-8">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <Separator />
        <div className="space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
      <div className="lg:col-span-1">
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  );
}

async function SingleCourseContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  // Check whether the current user has already purchased this course
  await connection(); // opts into dynamic rendering — prevents Date.now() prerender error
  const session = await auth.api.getSession({ headers: await headers() });
  const isEnrolled = session?.user
    ? await checkIfCourseBought(session.user.id, course.id)
    : false;

  const totalLessons = course.chapters.reduce(
    (sum, chapter) => sum + chapter.lessons.length,
    0,
  );
  const levelLabel = levelLabelMap[course.level] ?? course.level;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Left Column: Course Details & Curriculum */}
      <div className="lg:col-span-2 space-y-8">
        {/* Hero Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted shadow-sm">
          <Image
            src={course.imageUrl || "/placeholder.png"}
            alt={course.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover"
          />
        </div>

        {/* Title & Metadata */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {course.category}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <GraduationCap className="size-3.5" />
              {levelLabel}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="size-3.5" />
              {course.duration}h
            </Badge>
            <Badge variant="outline" className="gap-1">
              <BookOpen className="size-3.5" />
              {course.chapters.length}{" "}
              {course.chapters.length === 1 ? "chapter" : "chapters"} ·{" "}
              {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}
            </Badge>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {course.title}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            {course.smallDescription}
          </p>
        </div>

        <Separator />

        {/* Rich Text Description */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Course Description
          </h2>
          <RenderDescription content={course.description} />
        </section>

        <Separator />

        {/* Chapters & Lessons */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Course Content
            </h2>
            <span className="text-sm text-muted-foreground">
              {course.chapters.length}{" "}
              {course.chapters.length === 1 ? "chapter" : "chapters"} ·{" "}
              {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}
            </span>
          </div>

          <CourseCurriculum chapters={course.chapters} />
        </section>
      </div>

      {/* Right Column: Sticky Demo Payment Card */}
      <div className="lg:col-span-1">
        <CourseEnrollCard
          courseId={course.id}
          slug={course.slug}
          title={course.title}
          price={course.price}
          duration={course.duration}
          level={course.level}
          category={course.category}
          chaptersCount={course.chapters.length}
          lessonsCount={totalLessons}
          isEnrolled={isEnrolled}
        />
      </div>
    </div>
  );
}

export default function SingleCoursePage({ params }: SingleCoursePageProps) {
  return (
    <main className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-4" />
        Back to courses
      </Link>

      <Suspense fallback={<SingleCourseSkeleton />}>
        <SingleCourseContent params={params} />
      </Suspense>
    </main>
  );
}
