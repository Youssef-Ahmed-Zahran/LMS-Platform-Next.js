"use client";
// Error boundaries must be Client Components.
// This file catches any unhandled throw inside the /admin/courses/create
// route segment (page + its children). The layout above it is unaffected,
// so the sidebar / nav remain visible — only this page's content is replaced.

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface ErrorProps {
  error: unknown;
  retry: () => void;
}

export default function CreateCourseError({ error, retry }: ErrorProps) {
  useEffect(() => {
    // Surface the error in the console for debugging.
    // In production Next.js strips the message on the client side — only
    // error.digest (a hash) is available, matchable in server logs.
    console.error("[CreateCourseError]", error);
  }, [error]);

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      {/* Icon */}
      <div className="p-4 rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-10" />
      </div>

      {/* Heading */}
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-semibold tracking-tight">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground">
          {/* Show full message in dev; in production Next.js shows a generic one */}
          {message}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* retry() re-fetches & re-renders this boundary's children */}
        <Button onClick={retry} variant="default" className="gap-2">
          <RefreshCcw className="size-4" />
          Try again
        </Button>

        <Button variant="outline" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    </div>
  );
}
