"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import RichTextEditor from "@/components/rich-text-editor/Editor";
import { Uploader } from "@/components/file-uploader/Uploader";
import { VideoUploader } from "@/components/file-uploader/VideoUploader";
import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateLesson } from "@/app/admin/courses/[courseId]/[chapterId]/[lessonId]/action";
import {
  LessonEditSchema,
  LessonEditSchemaInput,
  LessonEditSchemaType,
} from "@/schemas/zodSchemas";
import type { AdminLesson } from "@/app/data/admin/admin-get-lesson";

interface LessonFormProps {
  lesson: AdminLesson;
  courseId: string;
  chapterId: string;
}

export function LessonForm({ lesson, courseId, chapterId }: LessonFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = useForm<LessonEditSchemaInput, unknown, LessonEditSchemaType>({
    resolver: zodResolver(LessonEditSchema),
    defaultValues: {
      title: lesson.title,
      description: lesson.description ?? "",
      thumbnailKey: lesson.thumbnailKey ?? "",
      videoKey: lesson.videoKey ?? "",
    },
  });

  function onSubmit(values: LessonEditSchemaType) {
    startTransition(async () => {
      const res = await updateLesson(courseId, chapterId, lesson.id, values);
      if (res.status === "success") {
        toast.success(res.message);
        router.push(`/admin/courses/${courseId}/edit`);
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Lesson Details</CardTitle>
          <CardDescription>
            Update the content and media for this lesson.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Lesson Title</Label>
            <Input
              id="title"
              placeholder="e.g. Introduction to React Hooks"
              {...register("title")}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Rich Text Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Describe what students will learn in this lesson..."
                  className={
                    errors.description
                      ? "border-destructive ring-3 ring-destructive/20"
                      : ""
                  }
                />
              )}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Thumbnail — 5 MB limit */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="thumbnailKey">
              Lesson Thumbnail
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                (max. 5 MB)
              </span>
            </Label>
            <Controller
              control={control}
              name="thumbnailKey"
              render={({ field }) => (
                <Uploader
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onRemove={() => field.onChange("")}
                  maxSizeMb={5}
                />
              )}
            />
            {errors.thumbnailKey && (
              <p className="text-sm text-destructive">
                {errors.thumbnailKey.message}
              </p>
            )}
          </div>

          {/* Video — 5 GB limit */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="videoKey">
              Lesson Video
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                (max. 5 GB)
              </span>
            </Label>
            <Controller
              control={control}
              name="videoKey"
              render={({ field }) => (
                <VideoUploader
                  value={field.value ?? ""}
                  initialUrl={lesson.videoUrl}
                  onChange={field.onChange}
                  onRemove={() => field.onChange("")}
                />
              )}
            />
            {errors.videoKey && (
              <p className="text-sm text-destructive">
                {errors.videoKey.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 pt-6 border-t">
          <Link
            href={`/admin/courses/${courseId}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            Cancel
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
