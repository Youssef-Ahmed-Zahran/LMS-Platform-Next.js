"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { enrollInCourseAction } from "../action";

interface EnrollmentButtonProps {
  courseId: string;
  slug: string;
  price: number;
  isEnrolled: boolean;
}

export function EnrollmentButton({
  courseId,
  slug,
  price,
  isEnrolled,
}: EnrollmentButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const label = isEnrolled
    ? "Go to Course"
    : price === 0
      ? "Enroll for Free"
      : `Enroll Now · $${price.toFixed(2)}`;

  function handleEnroll() {
    if (isEnrolled) {
      window.location.href = `/dashboard/courses/${slug}`;
      return;
    }

    setIsRedirecting(true);

    startTransition(async () => {
      try {
        await enrollInCourseAction(courseId, slug);
        // redirect() inside the action throws a Next.js NEXT_REDIRECT — that's expected
      } catch (err: unknown) {
        setIsRedirecting(false);

        // Filter out Next.js internal redirect "errors"
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")
        ) {
          return;
        }

        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        toast.error(message);
      }
    });
  }

  const busy = isPending || isRedirecting;

  return (
    <Button
      size="lg"
      className="w-full font-semibold"
      onClick={handleEnroll}
      disabled={busy}
    >
      {busy ? (
        <>
          <Loader2 className="size-4 mr-2 animate-spin" />
          {isEnrolled ? "Redirecting…" : "Redirecting to checkout…"}
        </>
      ) : (
        <>
          <CreditCard className="size-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );
}
