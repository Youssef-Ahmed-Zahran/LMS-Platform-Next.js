"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  CreditCard,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

interface CourseEnrollCardProps {
  title: string;
  price: number;
  duration: number;
  level: string;
  category: string;
  chaptersCount: number;
  lessonsCount: number;
}

export function CourseEnrollCard({
  title,
  price,
  duration,
  level,
  category,
  chaptersCount,
  lessonsCount,
}: CourseEnrollCardProps) {
  const [open, setOpen] = useState(false);

  const formattedPrice = price === 0 ? "Free" : `$${price.toFixed(2)}`;

  const handleDemoCheckout = () => {
    setOpen(false);
    toast.success("Demo enrollment triggered!", {
      description: `Payment integration pending for "${title}".`,
    });
  };

  return (
    <Card className="sticky top-24 border shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-3xl font-bold tracking-tight">
            {formattedPrice}
          </span>
          <Badge variant="secondary" className="capitalize">
            Demo Checkout
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Full lifetime access · Certificate of completion
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button size="lg" className="w-full font-semibold">
                <CreditCard className="size-4 mr-2" />
                {price === 0 ? "Enroll for Free" : "Enroll Now"}
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Demo Payment Checkout</DialogTitle>
              <DialogDescription>
                Payment integration is not connected yet. This is a preview of
                the enrollment flow for <strong>{title}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Course</span>
                <span className="font-medium truncate max-w-[220px]">
                  {title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-base">{formattedPrice}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-primary shrink-0" />
                <span>
                  Stripe / payment provider will be integrated here later.
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDemoCheckout}>
                <CheckCircle2 className="size-4 mr-2" />
                Simulate Enrollment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Separator />

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
          </ul>
        </div>
      </CardContent>

      <CardFooter className="pt-0 text-xs text-muted-foreground justify-center">
        30-day money-back guarantee (Demo UI)
      </CardFooter>
    </Card>
  );
}
