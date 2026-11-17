import { z } from "zod";

export const courseLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

export const courseStatus = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const courseCategory = [
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Machine Learning",
  "AI",
  "UI/UX",
  "Digital Marketing",
  "Business",
  "Other",
] as const;

export const CourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(1, "Price is required"),
  fileKey: z.string().min(1, "File is required") ,
  duration: z.coerce.number().min(1, "Duration is required").max(500, "Duration is too long"),
  level: z.enum(courseLevels, {message: "Level is required"}),
  category: z.enum(courseCategory, {message: "Category is required"}) ,
  smallDescription: z.string().min(5, "Small description is too short").max(200, "Small description is too long"),
  slug: z.string().min(3, "Slug is required"),
  status: z.enum(courseStatus, {message: "Status is required"}),
});

export type CourseSchemaType = z.infer<typeof CourseSchema>;
export type CourseSchemaInput = z.input<typeof CourseSchema>;

export const ChapterSchema = z.object({
  title: z
    .string()
    .min(1, "Chapter title is required")
    .max(100, "Chapter title is too long"),
});

export type ChapterSchemaType = z.infer<typeof ChapterSchema>;

export const LessonSchema = z.object({
  title: z
    .string()
    .min(1, "Lesson title is required")
    .max(100, "Lesson title is too long"),
});

export type LessonSchemaType = z.infer<typeof LessonSchema>;

