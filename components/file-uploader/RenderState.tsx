"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import React from "react";

export interface RenderStateProps {
  isDragActive: boolean;
  isUploading: boolean;
  isDeleting?: boolean;
  progress: number;
  fileUrl?: string | null;
  fileKey?: string | null;
  fileName?: string | null;
  error?: string | null;
  onRemove?: (e: React.MouseEvent) => void;
}

export function RenderState({
  isDragActive,
  isUploading,
  isDeleting = false,
  progress,
  fileUrl,
  fileKey,
  fileName,
  error,
  onRemove,
}: RenderStateProps) {
  // Store the URL that failed to load. If displayUrl changes to a new file,
  // the error resets automatically during render without needing a useEffect!
  const [failedUrl, setFailedUrl] = React.useState<string | null>(null);

  // Determine preview URL (virtual-hosted style for Tigris / S3)
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
  const displayUrl =
    fileUrl ||
    (fileKey
      ? fileKey.startsWith("http")
        ? fileKey
        : bucket
          ? `https://${bucket}.t3.storage.dev/${fileKey}`
          : null
      : null);

  const isImageError = Boolean(displayUrl && failedUrl === displayUrl);

  // 1. Uploading State
  if (isUploading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center w-full gap-3">
        <Loader2 className="size-10 text-primary animate-spin" />
        <div className="space-y-1 w-full max-w-xs">
          <p className="text-sm font-medium text-foreground">
            Uploading {fileName ? `"${fileName}"` : "file"}...
          </p>
          <Progress value={progress} className="h-2 w-full" />
          <p className="text-xs text-muted-foreground">{progress}% completed</p>
        </div>
      </div>
    );
  }

  // 2. Error State — Priority over preview so users see why upload failed
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center gap-2">
        <div className="p-3 bg-destructive/10 text-destructive rounded-full">
          <AlertCircle className="size-7" />
        </div>
        <div className="space-y-1 max-w-md">
          <p className="text-sm font-semibold text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground">
            Click anywhere or drag and drop a new image to try again
          </p>
        </div>
      </div>
    );
  }

  // 3. Uploaded / Preview State
  if (displayUrl && !isImageError) {
    return (
      <div className="relative group w-full h-full min-h-[220px] flex items-center justify-center overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayUrl}
          alt={fileName || "Uploaded thumbnail"}
          className="w-full h-56 object-cover rounded-md"
          onError={() => setFailedUrl(displayUrl)}
        />

        {/* Overlay with info and delete button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 rounded-md">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium backdrop-blur-xs">
              <CheckCircle2 className="size-3.5 text-green-400" />
              Uploaded
            </span>

            {onRemove && (
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                disabled={isDeleting}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(e);
                }}
                className="size-8 rounded-full shadow-md"
                aria-label="Remove image"
              >
                {isDeleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            )}
          </div>

          <p className="text-xs text-white/90 truncate bg-black/50 px-2 py-1 rounded self-start max-w-[80%]">
            {fileName || fileKey || "Current thumbnail"}
          </p>
        </div>
      </div>
    );
  }

  // 4. Image Failed to Load
  if (displayUrl && isImageError) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center gap-2">
        <div className="p-3 bg-muted rounded-full text-muted-foreground">
          <AlertCircle className="size-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          Thumbnail could not be loaded
        </p>
        <p className="text-xs text-muted-foreground">
          Click or drag & drop to replace the image
        </p>
      </div>
    );
  }

  // 4. Dragging State
  if (isDragActive) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-primary">
        <UploadCloud className="size-12 animate-bounce mb-2" />
        <p className="text-sm font-semibold">Drop your file here...</p>
        <p className="text-xs opacity-80 mt-1">Release to start uploading</p>
      </div>
    );
  }

  // 5. Default / Empty State
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="p-3 bg-muted rounded-full mb-3 text-muted-foreground">
        <UploadCloud className="size-6" />
      </div>
      <p className="text-sm font-medium text-foreground">
        <span className="text-primary font-semibold">Click to upload</span> or
        drag and drop
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        PNG, JPG, JPEG, WEBP or GIF (max. 10MB)
      </p>
    </div>
  );
}

export default RenderState;
