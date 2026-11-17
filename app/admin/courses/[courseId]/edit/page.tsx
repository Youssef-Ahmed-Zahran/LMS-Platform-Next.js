import { adminGetCourse } from "@/app/data/admin/admin-get-course";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditCourseForm } from "../_components/EditCourseForm";
import { CourseStructure } from "../_components/CourseStructure";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpen, LayoutList } from "lucide-react";
import { Suspense } from "react";

interface EditCoursePageProps {
  params: Promise<{ courseId: string }>;
}

function EditCourseSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Back btn skeleton */}
      <Skeleton className="h-9 w-36" />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Skeleton className="size-20 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-96 max-w-full" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[420px] w-full rounded-xl" />
      </div>
    </div>
  );
}

async function EditCourseContent({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await adminGetCourse(courseId);

  if (!course) notFound();

  const statusVariant =
    course.status === "PUBLISHED"
      ? "default"
      : course.status === "ARCHIVED"
        ? "outline"
        : "secondary";

  return (
    <div className="flex flex-col gap-6">
      {/* ── Back button ── */}
      <Link
        href="/admin/courses"
        className={
          buttonVariants({ variant: "outline", size: "sm" }) + " self-start"
        }
      >
        <ArrowLeft className="size-4 mr-2" />
        Back to Courses
      </Link>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative size-20 rounded-lg overflow-hidden border shrink-0 bg-muted">
          <Image
            src={course.imageUrl || "/placeholder.png"}
            alt={course.title}
            fill
            className="object-cover"
            sizes="80px"
            priority
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{course.title}</h1>
            <Badge variant={statusVariant}>{course.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
            {course.smallDescription}
          </p>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="size-3.5" />
              {course.chapters.length}{" "}
              {course.chapters.length === 1 ? "chapter" : "chapters"}
            </span>
            <span>
              {course.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0)}{" "}
              lessons
            </span>
            <span className="capitalize">{course.level.toLowerCase()}</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <LayoutList className="size-4" />
            Course Details
          </TabsTrigger>
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <BookOpen className="size-4" />
            Course Structure
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <EditCourseForm course={course} />
        </TabsContent>

        <TabsContent value="structure">
          <CourseStructure course={course} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function EditCoursePage({ params }: EditCoursePageProps) {
  return (
    <Suspense fallback={<EditCourseSkeleton />}>
      <EditCourseContent params={params} />
    </Suspense>
  );
}
