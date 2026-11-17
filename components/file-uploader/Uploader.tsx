"use client";

import { cn } from "cn";
import React, { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { RenderState } from "./RenderState";

export interface UploaderProps {
  value?: string;
  onChange?: (fileKey: string) => void;
  onRemove?: () => void;
  className?: string;
  endpoint?: string;
}

export function Uploader({
  value,
  onChange,
  onRemove,
  className,
  endpoint = "/api/s3/upload",
}: UploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      // Instant local preview for immediate user feedback
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setFileName(file.name);

      try {
        // Step 1: Request presigned upload URL from Next.js server
        // Sends only tiny metadata (~100 bytes) — bypasses Vercel 4.5MB payload limit!
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            size: file.size,
          }),
        });

        const data = (await res.json()) as {
          presignedUrl?: string;
          fileKey?: string;
          error?: string;
        };

        if (!res.ok || !data.presignedUrl || !data.fileKey) {
          throw new Error(data.error || "Failed to generate upload URL");
        }

        const { presignedUrl, fileKey } = data;

        // Step 2: Upload file DIRECTLY to S3 / Tigris via presigned PUT
        // Includes byte-by-byte live progress tracking via XMLHttpRequest
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presignedUrl, true);
          xhr.setRequestHeader(
            "Content-Type",
            file.type || "application/octet-stream",
          );

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setProgress(percent);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`S3 upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => {
            reject(new Error("Network error during direct S3 upload"));
          };

          xhr.send(file);
        });

        // Step 3: Complete upload
        setIsUploading(false);
        setProgress(100);
        onChange?.(fileKey);
        toast.success("Image uploaded successfully!");
      } catch (err: unknown) {
        console.error("[UPLOAD_ERROR]", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to upload file";
        setError(errorMessage);
        setIsUploading(false);
        setProgress(0);
        setPreviewUrl(null);
        setFileName(null);
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        toast.error(errorMessage);
      }
    },
    [endpoint, onChange],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        const rejectionError =
          fileRejections[0].errors[0]?.message ?? "Invalid file selection";
        setError(rejectionError);
        toast.error(rejectionError);
        return;
      }

      const file = acceptedFiles[0];
      if (file) uploadFile(file);
    },
    [uploadFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
    },
    maxFiles: 1,
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10 MB limit
    disabled: isUploading,
  });

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const keyToDelete = value;

    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileName(null);
    setError(null);
    setProgress(0);
    onChange?.("");
    onRemove?.();

    if (!keyToDelete) {
      toast.info("Image removed");
      return;
    }

    setIsDeleting(true);
    const toastId = toast.loading("Deleting image from storage...");

    try {
      const res = await fetch("/api/s3/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyToDelete }),
      });

      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete file from S3");
      }

      toast.success("Image deleted successfully!", { id: toastId });
    } catch (err: unknown) {
      console.error("[DELETE_ERROR]", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete from storage",
        { id: toastId }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const currentPreview = value || isUploading ? previewUrl : null;
  const hasImage = Boolean(currentPreview || value);

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[220px] rounded-lg border-2 border-dashed border-input bg-card transition-colors cursor-pointer hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        isDragActive && "border-primary bg-primary/5",
        isUploading && "cursor-not-allowed pointer-events-none",
        hasImage && !error && "p-2 border-solid border-border cursor-default",
        error && "border-destructive/60 bg-destructive/5 hover:border-destructive hover:bg-destructive/10 cursor-pointer",
        className,
      )}
    >
      <input {...getInputProps()} />
      <RenderState
        isDragActive={isDragActive}
        isUploading={isUploading}
        isDeleting={isDeleting}
        progress={progress}
        fileUrl={currentPreview}
        fileKey={value}
        fileName={fileName}
        error={error}
        onRemove={handleRemove}
      />
    </div>
  );
}

export default Uploader;
