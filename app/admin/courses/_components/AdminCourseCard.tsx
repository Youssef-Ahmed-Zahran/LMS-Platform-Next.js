"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  BookOpen,
  MoreHorizontal,
  Pencil,
  Eye,
  Trash2,
  Loader2,
  DollarSign,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { deleteCourse } from "@/app/admin/courses/[courseId]/action";
import type { AdminCourse } from "@/app/data/admin/admin-get-courses";
import { cn } from "@/lib/utils";

const statusConfig = {
  DRAFT: { label: "Draft", variant: "secondary" as const },
  PUBLISHED: { label: "Published", variant: "default" as const },
  ARCHIVED: { label: "Archived", variant: "outline" as const },
};

const levelConfig = {
  BEGINNER: { label: "Beginner", color: "text-green-600" },
  INTERMEDIATE: { label: "Intermediate", color: "text-yellow-600" },
  ADVANCED: { label: "Advanced", color: "text-red-600" },
};

interface AdminCourseCardProps {
  course: AdminCourse;
  priority?: boolean;
}

export function AdminCourseCard({ course, priority = false }: AdminCourseCardProps) {
  const [isPending, startTransition] = useTransition();
  const [alertOpen, setAlertOpen] = useState(false);

  const statusInfo =
    statusConfig[course.status as keyof typeof statusConfig] ??
    statusConfig.DRAFT;
  const levelInfo =
    levelConfig[course.level as keyof typeof levelConfig] ??
    levelConfig.BEGINNER;

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteCourse(course.id);
      if (res.status === "success") {
        toast.success(res.message);
        setAlertOpen(false);
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <Card className="group overflow-hidden flex flex-col h-full border hover:shadow-md transition-shadow duration-200">
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
            variant={statusInfo.variant}
            className="text-xs font-medium shadow-sm"
          >
            {statusInfo.label}
          </Badge>
        </div>
        <div className="absolute top-2 right-2">
          <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-8 bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm"
                  >
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Course options</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  render={
                    <Link
                      href={`/admin/courses/${course.id}/edit`}
                      className="flex items-center gap-2"
                    />
                  }
                >
                  <Pencil className="size-4" />
                  Edit Course
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={
                    <Link
                      href={`/courses/${course.slug}`}
                      target="_blank"
                      className="flex items-center gap-2"
                    />
                  }
                >
                  <Eye className="size-4" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger
                  nativeButton={false}
                  render={
                    <DropdownMenuItem
                      variant="destructive"
                      className="flex items-center gap-2 cursor-pointer"
                    />
                  }
                >
                  <Trash2 className="size-4" />
                  Delete Course
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Course</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{course.title}&quot;?
                  This action cannot be undone and will remove all chapters and
                  lessons.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <CardContent className="flex flex-col gap-2 flex-1 pt-4 pb-2">
        <h3 className="font-semibold text-sm leading-tight line-clamp-1">
          {course.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {course.smallDescription}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-2 pb-4 px-4 border-t">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-semibold text-foreground">
            <DollarSign className="size-3.5" />
            {course.price}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {course.duration}h
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="size-3.5" />
            {course._count.chapters}
          </span>
        </div>
        <span className={cn("text-xs font-medium", levelInfo.color)}>
          {levelInfo.label}
        </span>
      </CardFooter>
    </Card>
  );
}
