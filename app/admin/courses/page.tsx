import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { adminGetCourses } from "@/app/data/admin/admin-get-courses";
import { AdminCourseCard } from "./_components/AdminCourseCard";
import { BookOpen, Plus } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

function CoursesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden flex flex-col h-full border">
          <Skeleton className="aspect-video w-full rounded-none" />
          <CardContent className="flex flex-col gap-2 flex-1 pt-4 pb-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
          <CardFooter className="flex items-center justify-between pt-2 pb-4 px-4 border-t">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

async function CourseList() {
  const courses = await adminGetCourses();

  if (!courses || courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="rounded-full bg-muted p-4">
          <BookOpen className="size-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">No courses yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first course to get started
          </p>
        </div>
        <Link className={buttonVariants()} href="/admin/courses/create">
          <Plus className="size-4 mr-2" />
          Create Your First Course
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course, index) => (
        <AdminCourseCard key={course.id} course={course} priority={index === 0} />
      ))}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Courses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and organize your course catalog
          </p>
        </div>
        <Link className={buttonVariants()} href="/admin/courses/create">
          <Plus className="size-4 mr-2" />
          Create Course
        </Link>
      </div>

      <Suspense fallback={<CoursesSkeleton />}>
        <CourseList />
      </Suspense>
    </>
  );
}
