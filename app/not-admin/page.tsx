import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, ArrowLeft, Home, BookOpen } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Access Denied | LMS Platform",
  description: "You do not have administrative permissions to view this page.",
};

export default function NotAdminPage() {
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
        <Link href="/" className="flex items-center gap-2 self-center font-semibold">
          <Image src="/logo.png" alt="LMS Logo" width={36} height={36} className="size-9" />
          <span>LMS Platform</span>
        </Link>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/5">
              <ShieldAlert className="size-7" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Access Restricted
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Administrator privileges are required to view the dashboard and manage platform resources.
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center text-sm text-muted-foreground">
            <p>
              If you believe this is an error and you should have administrative access, please contact your organization administrator or support.
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-2">
            <Link href="/" className={buttonVariants({ className: "w-full gap-2" })}>
              <Home className="size-4" />
              Return to Homepage
            </Link>
            <Link
              href="/courses"
              className={buttonVariants({ variant: "outline", className: "w-full gap-2" })}
            >
              <BookOpen className="size-4" />
              Browse Courses
            </Link>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Logged in with the wrong account? You can log out from the navigation menu and sign in with an admin account.
        </p>
      </div>
    </main>
  );
}
