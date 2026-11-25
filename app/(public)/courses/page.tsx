import { Suspense } from "react";
import { getAllCourses } from "@/app/data/course/get-all-courses";
import { PublicCourseCard } from "../_components/PublicCourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";

// ── Skeleton shown while courses are loading ─────────────────────────────────
function CoursesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border overflow-hidden flex flex-col"
        >
          <Skeleton className="aspect-video w-full" />
          <div className="p-4 flex flex-col gap-3 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="flex gap-3 mt-auto pt-3 border-t">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Async server component that fetches and renders courses ───────────────────
async function CoursesList() {
  const courses = await getAllCourses();

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="rounded-full bg-muted p-6">
          <BookOpen className="size-10 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">No courses yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Check back soon — new courses are on their way!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course, index) => (
        <PublicCourseCard
          key={course.id}
          course={course}
          priority={index < 3}
        />
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PublicCoursesPage() {
  return (
    <main className="container mx-auto px-4 py-10 md:py-16 max-w-7xl">
      {/* Header */}
      <div className="mb-10 max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          All Courses
        </h1>
        <p className="mt-3 text-muted-foreground text-base leading-relaxed">
          Explore our library of expert-led courses and start learning at your
          own pace.
        </p>
      </div>

      {/* Grid with Suspense + Skeleton */}
      <Suspense fallback={<CoursesGridSkeleton />}>
        <CoursesList />
      </Suspense>
    </main>
  );
}
