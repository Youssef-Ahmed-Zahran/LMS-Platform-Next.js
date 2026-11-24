"use client";

import { useTransition } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
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
import { GripVertical, Trash2, Loader2, FileVideo, Pencil } from "lucide-react";
import { toast } from "sonner";
import { deleteLesson } from "@/app/admin/courses/[courseId]/action";
import type { AdminCourseWithChapters } from "@/app/data/admin/admin-get-course";
import { cn } from "cn";
import Link from "next/link";

export type Lesson = AdminCourseWithChapters["chapters"][number]["lessons"][number];

export interface LessonItemProps {
  lesson: Lesson;
  courseId: string;
  chapterId?: string;
  onDeleted: (lessonId: string) => void;
}

export function LessonItem({
  lesson,
  courseId,
  chapterId,
  onDeleted,
}: LessonItemProps) {
  const [isPending, startTransition] = useTransition();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteLesson(courseId, lesson.id);
      if (res.status === "success") {
        toast.success(res.message);
        onDeleted(lesson.id);
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm",
        isDragging && "opacity-50 shadow-lg",
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        aria-label="Drag to reorder lesson"
      >
        <GripVertical className="size-4" />
      </button>

      <FileVideo className="size-4 shrink-0 text-muted-foreground" />

      <span className="flex-1 truncate">{lesson.title}</span>

      {/* Edit lesson */}
      {chapterId && (
        <Link
          href={`/admin/courses/${courseId}/${chapterId}/${lesson.id}`}
          aria-label={`Edit lesson "${lesson.title}"`}
          className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
        >
          <Pencil className="size-3.5" />
        </Link>
      )}

      {/* Delete lesson */}
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{lesson.title}&quot;? This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
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
  );
}

export { LessonItem as SortableLessonRow, LessonItem as LessonRow };
