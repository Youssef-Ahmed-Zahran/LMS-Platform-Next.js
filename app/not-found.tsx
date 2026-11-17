import Link from "next/link";
import Image from "next/image";
import { FileQuestion, ArrowLeft, Home, BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "404 - Page Not Found | LMS Platform",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center p-4 bg-muted/30">
      <Link
        href="/"
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className: "absolute left-4 top-4 gap-2",
        })}
      >
        <ArrowLeft className="size-4" />
        Back to Home
      </Link>

      <div className="flex w-full max-w-md flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-semibold"
        >
          <Image
            src="/logo.png"
            alt="LMS Logo"
            width={36}
            height={36}
            className="size-9"
          />
          <span>LMS Platform</span>
        </Link>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-8 ring-primary/5">
              <FileQuestion className="size-7" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Page Not Found
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              We couldn&apos;t find the page or course you were looking for. It
              might have been moved, renamed, or deleted.
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center text-sm text-muted-foreground">
            <p>Please check the URL or head back to the platform homepage.</p>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-2">
            <Link
              href="/"
              className={buttonVariants({ className: "w-full gap-2" })}
            >
              <Home className="size-4" />
              Return to Homepage
            </Link>
            <Link
              href="/admin/courses"
              className={buttonVariants({
                variant: "outline",
                className: "w-full gap-2",
              })}
            >
              <BookOpen className="size-4" />
              Go to Courses
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
