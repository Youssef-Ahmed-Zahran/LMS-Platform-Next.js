"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LessonSchema, type LessonSchemaType } from "@/schemas/zodSchemas";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  GripVertical,
  ChevronDown,
  Plus,
  Trash2,
  Loader2,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteChapter,
  createLesson,
  reorderLessons,
} from "@/app/admin/courses/[courseId]/action";
import type { AdminCourseWithChapters } from "@/app/data/admin/admin-get-course";
import { cn } from "cn";
import { LessonItem, type Lesson } from "./LessonItem";

export type Chapter = AdminCourseWithChapters["chapters"][number] & {
  lessons: Lesson[];
};

export interface ChapterCardProps {
  chapter: Chapter;
  courseId: string;
  onChapterDeleted: (chapterId: string) => void;
}

export function ChapterCard({
  chapter,
  courseId,
  onChapterDeleted,
}: ChapterCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>(chapter.lessons);
  const [isCreatingLesson, startCreateLesson] = useTransition();
  const [isDeletingChapter, startDeleteChapter] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor));

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LessonSchemaType>({
    resolver: zodResolver(LessonSchema),
    defaultValues: {
      title: "",
    },
  });

  // ── Create Lesson via React Hook Form + Zod ──────────────────────────────
  const handleCreateLesson = (data: LessonSchemaType) => {
    startCreateLesson(async () => {
      const res = await createLesson(
        courseId,
        chapter.id,
        data.title.trim(),
      );
      if (res.status === "success") {
        toast.success(res.message);
        setLessons((prev) => [
          ...prev,
          {
            id: res.data.id,
            title: data.title.trim(),
            description: null,
            thumbnailKey: null,
            videoKey: null,
            position: prev.length,
          },
        ]);
        reset();
        setIsAddLessonOpen(false);
      } else {
        toast.error(res.message);
      }
    });
  };

  // ── Reorder Lessons via DnD ────────────────────────────────────────────────
  const handleLessonDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = lessons.findIndex((l) => l.id === active.id);
    const newIdx = lessons.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(lessons, oldIdx, newIdx).map((l, idx) => ({
      ...l,
      position: idx,
    }));

    setLessons(reordered);

    reorderLessons(
      courseId,
      chapter.id,
      reordered.map((l) => ({ id: l.id, position: l.position })),
    ).then((res) => {
      if (res.status !== "success") toast.error(res.message);
    });
  };

  // ── Delete Chapter ─────────────────────────────────────────────────────────
  const handleDeleteChapter = () => {
    startDeleteChapter(async () => {
      const res = await deleteChapter(courseId, chapter.id);
      if (res.status === "success") {
        toast.success(res.message);
        onChapterDeleted(chapter.id);
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
        "rounded-lg border bg-card",
        isDragging && "opacity-50 shadow-xl",
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* ── Chapter header ── */}
        <div className="flex items-center gap-2 px-4 py-3">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
            aria-label="Drag to reorder chapter"
          >
            <GripVertical className="size-4" />
          </button>

          <BookOpen className="size-4 shrink-0 text-muted-foreground" />

          <span className="flex-1 font-medium text-sm truncate">
            {chapter.title}
          </span>

          <Badge variant="secondary" className="text-xs mr-1">
            {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
          </Badge>

          {/* Delete chapter */}
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  disabled={isDeletingChapter}
                >
                  {isDeletingChapter ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
                <AlertDialogDescription>
                  Deleting &quot;{chapter.title}&quot; will also remove all its
                  lessons. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingChapter}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteChapter}
                  disabled={isDeletingChapter}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeletingChapter ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Chapter"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Collapsible trigger */}
          <CollapsibleTrigger
            render={
              <Button variant="ghost" size="icon" className="size-7">
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                />
              </Button>
            }
          />
        </div>

        {/* ── Lessons list ── */}
        <CollapsibleContent>
          <div className="border-t px-4 py-3 flex flex-col gap-2">
            {lessons.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                No lessons yet — add one below.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleLessonDragEnd}
              >
                <SortableContext
                  items={lessons.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {lessons.map((lesson) => (
                    <LessonItem
                      key={lesson.id}
                      lesson={lesson}
                      courseId={courseId}
                      chapterId={chapter.id}
                      onDeleted={(id) =>
                        setLessons((prev) => prev.filter((l) => l.id !== id))
                      }
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}

            {/* Add Lesson Modal Trigger */}
            <div className="mt-1">
              <Dialog
                open={isAddLessonOpen}
                onOpenChange={(open) => {
                  setIsAddLessonOpen(open);
                  if (!open) reset();
                }}
              >
                <DialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed gap-1.5 text-xs h-8"
                    >
                      <Plus className="size-3.5" />
                      Add Lesson
                    </Button>
                  }
                />
                <DialogContent>
                  <form
                    onSubmit={handleSubmit(handleCreateLesson)}
                    className="space-y-4"
                  >
                    <DialogHeader>
                      <DialogTitle>Add New Lesson</DialogTitle>
                      <DialogDescription>
                        Add a new lesson to chapter &quot;{chapter.title}&quot;.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                      <Label htmlFor={`lesson-title-${chapter.id}`}>
                        Lesson Title
                      </Label>
                      <Input
                        id={`lesson-title-${chapter.id}`}
                        placeholder="e.g. Installing Dependencies"
                        disabled={isCreatingLesson}
                        autoFocus
                        {...register("title")}
                      />
                      {errors.title && (
                        <p className="text-xs text-destructive">
                          {errors.title.message}
                        </p>
                      )}
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isCreatingLesson}
                        onClick={() => {
                          setIsAddLessonOpen(false);
                          reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isCreatingLesson}>
                        {isCreatingLesson ? (
                          <>
                            <Loader2 className="size-4 animate-spin mr-2" />
                            Creating...
                          </>
                        ) : (
                          "Create Lesson"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export { ChapterCard as SortableChapterCard, ChapterCard as ChapterItem };
