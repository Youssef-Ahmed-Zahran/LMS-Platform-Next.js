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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import RichTextEditor from "@/components/rich-text-editor/Editor";
import { Uploader } from "@/components/file-uploader/Uploader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useConfetti } from "@/hooks/use-confetti";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "slugify";
import { toast } from "sonner";
import { CreateCourse } from "../actions";
import {
  CourseSchema,
  CourseSchemaInput,
  CourseSchemaType,
  courseCategory,
  courseLevels,
  courseStatus,
} from "@/schemas/zodSchemas";

export function CreateCourseForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { triggerConfetti } = useConfetti();

  const {
    handleSubmit,
    register,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CourseSchemaInput, unknown, CourseSchemaType>({
    resolver: zodResolver(CourseSchema),
    defaultValues: {
      title: "",
      description: "",
      fileKey: "",
      price: 0,
      duration: 0,
      level: "BEGINNER",
      category: "" as unknown as (typeof courseCategory)[number],
      slug: "",
      status: "DRAFT",
      smallDescription: "",
    },
  });

  const handleGenerateSlug = () => {
    const title = getValues("title");
    if (!title) {
      toast.error("Please enter a title first to generate a slug");
      return;
    }
    const generatedSlug = slugify(title, { lower: true, strict: true });
    setValue("slug", generatedSlug, { shouldValidate: true });
    toast.success("Slug generated from title");
  };

  function onSubmit(values: CourseSchemaType) {
    startTransition(async () => {
      const res = await CreateCourse(values);

      if (res.status === "success") {
        triggerConfetti();
        toast.success(res.message);
        router.push("/admin/courses");
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
          <CardDescription>
            Enter the basic information for the course.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Next.js 15 Masterclass"
                {...register("title")}
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  placeholder="e.g. nextjs-15-masterclass"
                  {...register("slug")}
                  aria-invalid={!!errors.slug}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateSlug}
                  className="shrink-0"
                >
                  <Sparkles className="size-4 mr-1.5" />
                  Generate Slug
                </Button>
              </div>
              {errors.slug && (
                <p className="text-sm text-destructive">
                  {errors.slug.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="smallDescription">Short Description</Label>
            <Textarea
              id="smallDescription"
              placeholder="A brief summary of the course (5–200 characters)"
              rows={2}
              {...register("smallDescription")}
              aria-invalid={!!errors.smallDescription}
            />
            {errors.smallDescription && (
              <p className="text-sm text-destructive">
                {errors.smallDescription.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Detailed description of what students will learn..."
                  className={errors.description ? "border-destructive ring-3 ring-destructive/20" : ""}
                />
              )}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    value={field.value || null}
                    onValueChange={(val) => field.onChange(val ?? "")}
                  >
                    <SelectTrigger
                      id="category"
                      className="w-full"
                      aria-invalid={!!errors.category}
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseCategory.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-sm text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="level">Level</Label>
              <Controller
                control={control}
                name="level"
                render={({ field }) => (
                  <Select
                    value={field.value || "BEGINNER"}
                    onValueChange={(val) => field.onChange(val ?? "BEGINNER")}
                  >
                    <SelectTrigger
                      id="level"
                      className="w-full"
                      aria-invalid={!!errors.level}
                    >
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseLevels.map((lvl) => (
                        <SelectItem key={lvl} value={lvl}>
                          {lvl.charAt(0) + lvl.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.level && (
                <p className="text-sm text-destructive">
                  {errors.level.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value || "DRAFT"}
                    onValueChange={(val) => field.onChange(val ?? "DRAFT")}
                  >
                    <SelectTrigger
                      id="status"
                      className="w-full"
                      aria-invalid={!!errors.status}
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseStatus.map((st) => (
                        <SelectItem key={st} value={st}>
                          {st.charAt(0) + st.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <p className="text-sm text-destructive">
                  {errors.status.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="29.99"
                {...register("price")}
                aria-invalid={!!errors.price}
              />
              {errors.price && (
                <p className="text-sm text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="500"
                placeholder="10"
                {...register("duration")}
                aria-invalid={!!errors.duration}
              />
              {errors.duration && (
                <p className="text-sm text-destructive">
                  {errors.duration.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="fileKey">Course Thumbnail</Label>
            <Controller
              control={control}
              name="fileKey"
              render={({ field }) => (
                <Uploader
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.fileKey && (
              <p className="text-sm text-destructive">
                {errors.fileKey.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 pt-6 border-t">
          <Link
            href="/admin/courses"
            className={buttonVariants({ variant: "outline" })}
          >
            Cancel
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Creating Course...
              </>
            ) : (
              "Create Course"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
