"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, PlayCircle, VideoOff } from "lucide-react";
import type {
  PublicChapter,
  PublicLesson,
} from "@/app/data/course/get-all-course";

interface CourseCurriculumProps {
  chapters: PublicChapter[];
}

export function CourseCurriculum({ chapters }: CourseCurriculumProps) {
  const [selectedLesson, setSelectedLesson] = useState<PublicLesson | null>(
    null
  );

  if (chapters.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No chapters have been added to this course yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {chapters.map((chapter, chapterIndex) => (
          <Collapsible
            key={chapter.id}
            defaultOpen={chapterIndex === 0}
            className="rounded-lg border bg-card"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-muted/50 transition-colors rounded-lg group">
              <div className="flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {chapterIndex + 1}
                </span>
                <span className="text-sm md:text-base font-semibold">
                  {chapter.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {chapter.lessons.length}{" "}
                  {chapter.lessons.length === 1 ? "Lesson" : "Lessons"}
                </Badge>
                <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-panel-open:rotate-180" />
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="overflow-hidden border-t transition-all duration-300 ease-in-out h-(--collapsible-panel-height) data-starting-style:h-0 data-ending-style:h-0 data-starting-style:opacity-0 data-ending-style:opacity-0">
              {chapter.lessons.length === 0 ? (
                <p className="px-4 py-3 text-xs text-muted-foreground">
                  No lessons in this chapter yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {chapter.lessons.map((lesson, lessonIndex) => (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedLesson(lesson)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <PlayCircle className="size-4 shrink-0 text-primary" />
                          <span className="truncate font-medium">
                            {lessonIndex + 1}. {lesson.title}
                          </span>
                        </div>
                        <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                          {lesson.videoUrl ? "Watch" : "Preview"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {/* Temporary Lesson Video Dialog until dedicated lesson page is built */}
      <Dialog
        open={Boolean(selectedLesson)}
        onOpenChange={(open) => {
          if (!open) setSelectedLesson(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedLesson?.title}</DialogTitle>
            {selectedLesson?.description && (
              <DialogDescription className="line-clamp-2">
                {selectedLesson.description}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted border">
            {selectedLesson?.videoUrl ? (
              <video
                key={selectedLesson.id}
                src={selectedLesson.videoUrl}
                poster={selectedLesson.thumbnailUrl ?? undefined}
                controls
                autoPlay
                className="size-full object-contain bg-black"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <VideoOff className="size-10 opacity-60" />
                <p className="text-sm font-medium">
                  No video uploaded for this lesson yet.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
