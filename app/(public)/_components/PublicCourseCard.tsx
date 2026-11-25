import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, DollarSign } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { PublicCourse } from "@/app/data/course/get-all-courses";
import { cn } from "@/lib/utils";

const levelConfig = {
  BEGINNER: { label: "Beginner", color: "text-green-600 dark:text-green-400" },
  INTERMEDIATE: {
    label: "Intermediate",
    color: "text-yellow-600 dark:text-yellow-400",
  },
  ADVANCED: { label: "Advanced", color: "text-red-600 dark:text-red-400" },
};

interface PublicCourseCardProps {
  course: PublicCourse;
  priority?: boolean;
}

export function PublicCourseCard({
  course,
  priority = false,
}: PublicCourseCardProps) {
  const levelInfo =
    levelConfig[course.level as keyof typeof levelConfig] ??
    levelConfig.BEGINNER;

  return (
    <Link href={`/courses/${course.slug}`} className="group block h-full">
      <Card className="overflow-hidden flex flex-col h-full border hover:shadow-lg transition-all duration-200 hover:border-primary/40">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          <Image
            src={course.imageUrl || "/placeholder.png"}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute top-2 left-2">
            <Badge
              variant="secondary"
              className="text-xs font-medium shadow-sm capitalize"
            >
              {course.category}
            </Badge>
          </div>
        </div>

        {/* Body */}
        <CardContent className="flex flex-col gap-2 flex-1 pt-4 pb-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {course.smallDescription}
          </p>
        </CardContent>

        {/* Footer */}
        <CardFooter className="flex items-center justify-between pt-2 pb-4 px-4 border-t">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <DollarSign className="size-3.5" />
              {course.price === 0 ? "Free" : course.price.toFixed(2)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {course.duration}h
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="size-3.5" />
              {course._count.chapters}{" "}
              {course._count.chapters === 1 ? "chapter" : "chapters"}
            </span>
          </div>
          <span className={cn("text-xs font-medium", levelInfo.color)}>
            {levelInfo.label}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
