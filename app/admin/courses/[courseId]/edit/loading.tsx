import { Skeleton } from "@/components/ui/skeleton";

export default function EditCourseLoading() {
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
