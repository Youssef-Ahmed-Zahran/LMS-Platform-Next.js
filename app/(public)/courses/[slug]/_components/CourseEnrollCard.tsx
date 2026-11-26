"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { EnrollmentButton } from "./EnrollmentButton";

interface CourseEnrollCardProps {
  courseId: string;
  slug: string;
  title: string;
  price: number;
  duration: number;
  level: string;
  category: string;
  chaptersCount: number;
  lessonsCount: number;
  isEnrolled: boolean;
}

const INCLUSIONS = [
  { icon: CheckCircle2, label: "Full lifetime access" },
  { icon: CheckCircle2, label: "Certificate of completion" },
  { icon: ShieldCheck, label: "30-day money-back guarantee" },
];

export function CourseEnrollCard({
  courseId,
  slug,
  title,
  price,
  duration,
  level,
  category,
  chaptersCount,
  lessonsCount,
  isEnrolled,
}: CourseEnrollCardProps) {
  const formattedPrice = price === 0 ? "Free" : `$${price.toFixed(2)}`;

  return (
    <Card className="sticky top-24 border shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-3xl font-bold tracking-tight">
            {formattedPrice}
          </span>
          {isEnrolled && (
            <Badge variant="secondary" className="capitalize">
              Enrolled
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Full lifetime access · Certificate of completion
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <EnrollmentButton
          courseId={courseId}
          slug={slug}
          price={price}
          isEnrolled={isEnrolled}
        />

        <Separator />

        {/* What's included */}
        <div className="space-y-3 text-sm">
          <h4 className="font-semibold">What&apos;s included:</h4>
          <ul className="space-y-2.5 text-muted-foreground">
            <li className="flex items-center gap-2.5">
              <Clock className="size-4 text-primary shrink-0" />
              <span>{duration} hours of on-demand video</span>
            </li>
            <li className="flex items-center gap-2.5">
              <BookOpen className="size-4 text-primary shrink-0" />
              <span>
                {chaptersCount} {chaptersCount === 1 ? "chapter" : "chapters"} ·{" "}
                {lessonsCount} {lessonsCount === 1 ? "lesson" : "lessons"}
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <GraduationCap className="size-4 text-primary shrink-0" />
              <span className="capitalize">
                {level.toLowerCase()} level · {category}
              </span>
            </li>
            {INCLUSIONS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5">
                <Icon className="size-4 text-primary shrink-0" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="pt-0 text-xs text-muted-foreground justify-center">
        {isEnrolled
          ? `You are enrolled in "${title}"`
          : "Secure checkout powered by Stripe"}
      </CardFooter>
    </Card>
  );
}
