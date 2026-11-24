"use client";

import { cn } from "cn";
import React, { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB
const CONCURRENCY = 8; // 8 parallel upload streams over HTTP/2
const MAX_RETRIES = 3; // Auto-retry each chunk up to 3 times on network hiccup

function getChunkSize(fileSize: number): number {
  if (fileSize <= 500 * 1024 * 1024) return 5 * 1024 * 1024; // 5 MB (S3 min) for <= 500 MB
  if (fileSize <= 2 * 1024 * 1024 * 1024) return 10 * 1024 * 1024; // 10 MB for <= 2 GB
  return 16 * 1024 * 1024; // 16 MB for > 2 GB
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  if (seconds < 60) return `${Math.ceil(seconds)}s left`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return `${mins}m ${secs}s left`;
}

const ALLOWED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i >= 2 ? 2 : 0)} ${units[i]}`;
}

export interface VideoUploaderProps {
  value?: string | null;
  initialUrl?: string | null;
  onChange?: (fileKey: string) => void;
  onRemove?: () => void;
  className?: string;
}

export function VideoUploader({
  value,
  initialUrl,
  onChange,
  onRemove,
  className,
}: VideoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [speedBps, setSpeedBps] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef(false);
  const uploadStartRef = useRef<number>(0);
  const activeXhrsRef = useRef<Set<XMLHttpRequest>>(new Set());
  const activeUploadRef = useRef<{ uploadId: string; fileKey: string } | null>(null);

  const uploadPartWithRetry = useCallback(
    async (
      chunk: Blob,
      presignedUrl: string,
      partNumber: number,
      onPartProgress: (loaded: number) => void,
    ): Promise<string> => {
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (cancelledRef.current) {
          throw new Error("Upload cancelled");
        }

        try {
          const eTag = await new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            activeXhrsRef.current.add(xhr);

            xhr.open("PUT", presignedUrl, true);

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                onPartProgress(event.loaded);
              }
            };

            xhr.onload = () => {
              activeXhrsRef.current.delete(xhr);
              if (xhr.status >= 200 && xhr.status < 300) {
                const rawEtag = xhr.getResponseHeader("ETag");
                if (!rawEtag) {
                  reject(
                    new Error(
                      'Missing ETag header in S3 response. Ensure bucket CORS ExposeHeaders includes "ETag".',
                    ),
                  );
                  return;
                }
                resolve(rawEtag);
              } else {
                reject(new Error(`Part ${partNumber} failed with status ${xhr.status}`));
              }
            };

            xhr.onerror = () => {
              activeXhrsRef.current.delete(xhr);
              reject(new Error(`Network error uploading part ${partNumber}`));
            };

            xhr.onabort = () => {
              activeXhrsRef.current.delete(xhr);
              reject(new Error("Upload cancelled"));
            };

            xhr.send(chunk);
          });

          return eTag;
        } catch (err) {
          if (cancelledRef.current) throw err;
          lastError = err instanceof Error ? err : new Error("Part upload failed");
          onPartProgress(0);
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 1000 * attempt));
          }
        }
      }

      throw lastError ?? new Error(`Part ${partNumber} failed after ${MAX_RETRIES} attempts`);
    },
    [],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        const msg =
          "Invalid file type. Please upload a video file (MP4, WebM, OGG, MOV, AVI, MKV).";
        setError(msg);
        toast.error(msg);
        return;
      }

      if (file.size > MAX_SIZE) {
        const msg = "File size exceeds the 5 GB limit.";
        setError(msg);
        toast.error(msg);
        return;
      }

      cancelledRef.current = false;
      activeXhrsRef.current.clear();
      activeUploadRef.current = null;

      setIsUploading(true);
      setProgress(0);
      setUploadedBytes(0);
      setTotalBytes(file.size);
      setSpeedBps(0);
      setError(null);
      setFileName(file.name);
      uploadStartRef.current = Date.now();

      try {
        // 1. Initialize multipart upload
        const initRes = await fetch("/api/s3/multipart/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type || "video/mp4",
            size: file.size,
          }),
        });

        const initData = (await initRes.json()) as {
          uploadId?: string;
          fileKey?: string;
          error?: string;
        };

        if (!initRes.ok || !initData.uploadId || !initData.fileKey) {
          throw new Error(initData.error || "Failed to initialize video upload");
        }

        const { uploadId, fileKey } = initData;
        activeUploadRef.current = { uploadId, fileKey };

        // 2. Calculate chunks and fetch presigned part URLs (in batches of 500 if huge)
        const chunkSize = getChunkSize(file.size);
        const totalParts = Math.max(1, Math.ceil(file.size / chunkSize));
        const allPartNumbers = Array.from({ length: totalParts }, (_, i) => i + 1);
        const presignedParts: { partNumber: number; presignedUrl: string }[] = [];

        for (let i = 0; i < allPartNumbers.length; i += 500) {
          if (cancelledRef.current) throw new Error("Upload cancelled");
          const batch = allPartNumbers.slice(i, i + 500);
          const partsRes = await fetch("/api/s3/multipart/parts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey, uploadId, partNumbers: batch }),
          });
          const partsData = (await partsRes.json()) as {
            parts?: { partNumber: number; presignedUrl: string }[];
            error?: string;
          };
          if (!partsRes.ok || !partsData.parts) {
            throw new Error(partsData.error || "Failed to get part upload URLs");
          }
          presignedParts.push(...partsData.parts);
        }

        // 3. Upload chunks in parallel with a worker pool + live aggregated progress
        const partProgress = new Array<number>(totalParts).fill(0);
        const completedParts: { PartNumber: number; ETag: string }[] = [];
        let nextIndex = 0;

        const updateTotalProgress = () => {
          const loaded = partProgress.reduce((sum, bytes) => sum + bytes, 0);
          const elapsedSec = Math.max(0.2, (Date.now() - uploadStartRef.current) / 1000);
          setSpeedBps(loaded / elapsedSec);
          setUploadedBytes(loaded);
          setProgress(Math.min(99, Math.round((loaded / file.size) * 100)));
        };

        const runWorker = async () => {
          while (nextIndex < presignedParts.length) {
            if (cancelledRef.current) return;
            const current = presignedParts[nextIndex++];
            const start = (current.partNumber - 1) * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);

            const eTag = await uploadPartWithRetry(
              chunk,
              current.presignedUrl,
              current.partNumber,
              (loaded) => {
                partProgress[current.partNumber - 1] = loaded;
                updateTotalProgress();
              },
            );

            partProgress[current.partNumber - 1] = chunk.size;
            updateTotalProgress();
            completedParts.push({ PartNumber: current.partNumber, ETag: eTag });
          }
        };

        const workerCount = Math.min(CONCURRENCY, presignedParts.length);
        await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

        if (cancelledRef.current) {
          throw new Error("Upload cancelled");
        }

        // 4. Complete multipart upload on S3
        const completeRes = await fetch("/api/s3/multipart/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileKey,
            uploadId,
            parts: completedParts,
          }),
        });

        const completeData = (await completeRes.json()) as {
          fileKey?: string;
          url?: string;
          error?: string;
        };

        if (!completeRes.ok || !completeData.fileKey) {
          throw new Error(completeData.error || "Failed to finalize video upload");
        }

        if (previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(completeData.url ?? URL.createObjectURL(file));

        activeUploadRef.current = null;
        setIsUploading(false);
        setProgress(100);
        setUploadedBytes(file.size);
        onChange?.(completeData.fileKey);
        toast.success("Video uploaded successfully!");
      } catch (err: unknown) {
        const wasCancelled = cancelledRef.current;

        // Clean up aborted multipart parts on S3 so free-tier storage isn't wasted
        if (activeUploadRef.current) {
          const { uploadId, fileKey } = activeUploadRef.current;
          activeUploadRef.current = null;
          fetch("/api/s3/multipart/abort", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey, uploadId }),
          }).catch(() => {});
        }

        setIsUploading(false);
        setProgress(0);
        setUploadedBytes(0);
        setTotalBytes(0);
        setFileName(null);

        if (wasCancelled) {
          setError(null);
          toast.info("Video upload cancelled");
        } else {
          console.error("[VIDEO_UPLOAD_ERROR]", err);
          const errorMessage =
            err instanceof Error ? err.message : "Failed to upload video";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      }
    },
    [onChange, uploadPartWithRetry],
  );

  const handleCancelUpload = () => {
    cancelledRef.current = true;
    activeXhrsRef.current.forEach((xhr) => xhr.abort());
    activeXhrsRef.current.clear();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const keyToDelete = value;

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileName(null);
    setError(null);
    setProgress(0);
    onChange?.("");
    onRemove?.();

    if (!keyToDelete) {
      toast.info("Video removed");
      return;
    }

    setIsDeleting(true);
    const toastId = toast.loading("Deleting video from storage...");

    try {
      const res = await fetch("/api/s3/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyToDelete }),
      });

      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete video from storage");
      }

      toast.success("Video deleted successfully!", { id: toastId });
    } catch (err: unknown) {
      console.error("[VIDEO_DELETE_ERROR]", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete from storage",
        { id: toastId },
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const hasVideo = Boolean(value);
  const inputId = React.useId();

  // ── Uploading state ──────────────────────────────────────────────────────
  if (isUploading) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center w-full min-h-[180px] rounded-lg border-2 border-dashed border-input bg-card p-6 text-center gap-3",
          className,
        )}
      >
        <Loader2 className="size-10 text-primary animate-spin" />
        <div className="space-y-1.5 w-full max-w-sm">
          <p className="text-sm font-medium text-foreground truncate">
            Uploading {fileName ? `"${fileName}"` : "video"}...
          </p>
          <Progress value={progress} className="h-2 w-full" />
          <p className="text-xs text-muted-foreground">
            {progress}% &bull; {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
            {speedBps > 0 && (
              <>
                {" "}
                &bull; {formatBytes(speedBps)}/s
                {totalBytes > uploadedBytes &&
                  ` (${formatDuration((totalBytes - uploadedBytes) / speedBps)})`}
              </>
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancelUpload}
          className="mt-1"
        >
          <X className="size-3.5 mr-1.5" />
          Cancel Upload
        </Button>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <label
        htmlFor={inputId}
        className={cn(
          "flex flex-col items-center justify-center w-full min-h-[160px] rounded-lg border-2 border-dashed border-destructive/60 bg-destructive/5 hover:bg-destructive/10 cursor-pointer p-6 text-center gap-2 transition-colors",
          className,
        )}
      >
        <input
          id={inputId}
          type="file"
          accept="video/*"
          className="sr-only"
          onChange={handleFileChange}
        />
        <div className="p-3 bg-destructive/10 text-destructive rounded-full">
          <AlertCircle className="size-7" />
        </div>
        <p className="text-sm font-semibold text-destructive">{error}</p>
        <p className="text-xs text-muted-foreground">
          Click or drag and drop a video to try again
        </p>
      </label>
    );
  }

  // ── Uploaded state — video player ────────────────────────────────────────
  if (hasVideo) {
    const videoUrl =
      previewUrl ||
      initialUrl ||
      (value && value.startsWith("http") ? value : null);

    const displayName = fileName || value?.split("/").pop() || "Uploaded video";

    return (
      <div className={cn("flex flex-col w-full gap-3", className)}>
        {/* Native video player */}
        <div className="relative w-full rounded-lg overflow-hidden border bg-black aspect-video">
          <video
            key={videoUrl ?? ""}
            src={videoUrl ?? undefined}
            controls
            controlsList="nodownload"
            className="w-full h-full object-contain"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Footer row: filename + replace + remove */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CheckCircle2 className="size-4 text-green-500 shrink-0" />
            <p className="text-sm text-foreground truncate">{displayName}</p>
          </div>

          {/* Replace button */}
          <label
            htmlFor={inputId}
            className="inline-flex items-center gap-1.5 cursor-pointer rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors shrink-0"
          >
            <UploadCloud className="size-3.5" />
            Replace
            <input
              id={inputId}
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>

          {/* Remove button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDeleting}
            onClick={handleRemove}
            className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10"
            aria-label="Remove video"
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="size-4 mr-1.5" />
                Remove
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ── Default / empty drop zone ────────────────────────────────────────────
  return (
    <label
      htmlFor={inputId}
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[160px] rounded-lg border-2 border-dashed border-input bg-card transition-colors cursor-pointer hover:border-primary/50 hover:bg-muted/30 p-6 text-center",
        className,
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        id={inputId}
        type="file"
        accept="video/*"
        className="sr-only"
        onChange={handleFileChange}
      />
      <div className="p-3 bg-muted rounded-full mb-3 text-muted-foreground">
        <UploadCloud className="size-6" />
      </div>
      <p className="text-sm font-medium text-foreground">
        <span className="text-primary font-semibold">Click to upload</span> or
        drag and drop
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        MP4, WebM, MOV, AVI or MKV (max. 5 GB &bull; fast parallel upload)
      </p>
    </label>
  );
}

export default VideoUploader;
