"use client";
// Catches unhandled throws in the entire /admin segment (all admin pages).
// The root layout above is still alive — header/nav stay visible.
// Use this as a fallback when a page under /admin doesn't have its own error.tsx.

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface ErrorProps {
  error: unknown;
  retry: () => void;
}

export default function AdminError({ error, retry }: ErrorProps) {
  useEffect(() => {
    console.error("[AdminError]", error);
  }, [error]);

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <div className="p-4 rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-10" />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-semibold tracking-tight">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
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
