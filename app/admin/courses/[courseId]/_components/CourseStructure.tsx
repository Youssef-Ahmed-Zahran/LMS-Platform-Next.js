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
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChapterSchema, type ChapterSchemaType } from "@/schemas/zodSchemas";
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
import { BookOpen, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createChapter,
  reorderChapters,
} from "@/app/admin/courses/[courseId]/action";
import type { AdminCourseWithChapters } from "@/app/data/admin/admin-get-course";
import { ChapterCard, type Chapter } from "./ChapterCard";

// ─── Main CourseStructure Component ──────────────────────────────────────────

interface CourseStructureProps {
  course: AdminCourseWithChapters;
}

export function CourseStructure({ course }: CourseStructureProps) {
  const [chapters, setChapters] = useState<Chapter[]>(course.chapters);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingChapter, startCreateChapter] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChapterSchemaType>({
    resolver: zodResolver(ChapterSchema),
    defaultValues: {
      title: "",
    },
  });

  // ── Create Chapter via React Hook Form + Zod ──────────────────────────────
  const onSubmit = (data: ChapterSchemaType) => {
    startCreateChapter(async () => {
      const res = await createChapter(course.id, data.title.trim());
      if (res.status === "success") {
        toast.success(res.message);
        setChapters((prev) => [
          ...prev,
          {
            id: res.data.id,
            title: data.title.trim(),
            position: prev.length,
            lessons: [],
          },
        ]);
        reset();
        setIsModalOpen(false);
      } else {
        toast.error(res.message);
      }
    });
  };

  // ── Reorder Chapters via DnD ───────────────────────────────────────────────
  const handleChapterDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = chapters.findIndex((c) => c.id === active.id);
    const newIdx = chapters.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(chapters, oldIdx, newIdx).map((c, idx) => ({
      ...c,
      position: idx,
    }));

    setChapters(reordered);

    reorderChapters(
      course.id,
      reordered.map((c) => ({ id: c.id, position: c.position })),
    ).then((res) => {
      if (res.status !== "success") toast.error(res.message);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header and Add Chapter Modal */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Course Curriculum</h2>
          <p className="text-xs text-muted-foreground">
            Manage and reorder chapters and lessons in this course.
          </p>
        </div>

        <Dialog
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) reset();
          }}
        >
          <DialogTrigger
            render={
              <Button type="button" size="sm" className="gap-1.5">
                <Plus className="size-4" />
                Add Chapter
              </Button>
            }
          />
          <DialogContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Add New Chapter</DialogTitle>
                <DialogDescription>
                  Enter a title for this chapter. You can reorder chapters and add lessons afterwards.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <Label htmlFor="chapter-title">Chapter Title</Label>
                <Input
                  id="chapter-title"
                  placeholder="e.g. Introduction & Setup"
                  disabled={isCreatingChapter}
                  autoFocus
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isCreatingChapter}
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingChapter}>
                  {isCreatingChapter ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Chapter"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chapter list */}
      {chapters.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center gap-2">
          <BookOpen className="size-8 text-muted-foreground" />
          <p className="font-medium">No chapters yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first chapter to get started.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="mt-2"
          >
            <Plus className="size-4 mr-2" />
            Add Chapter
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleChapterDragEnd}
        >
          <SortableContext
            items={chapters.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {chapters.map((chapter) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                courseId={course.id}
                onChapterDeleted={(id) =>
                  setChapters((prev) => prev.filter((c) => c.id !== id))
                }
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* Add Chapter Button at Bottom */}
      {chapters.length > 0 && (
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed gap-1.5"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="size-4" />
          Add Another Chapter
        </Button>
      )}
    </div>
  );
}
