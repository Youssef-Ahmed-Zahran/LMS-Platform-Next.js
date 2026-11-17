export const instant = false;

import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";

export default async function AuthLayout({ children }: React.PropsWithChildren) {
  const reqHeaders = await headers();
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: reqHeaders,
    });
  } catch (error) {
    unstable_rethrow(error);
    console.error("[AuthLayout] Failed to retrieve session:", error);
  }

  if (session) {
    redirect("/");
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center p-4">
      <Link
        href="/"
        className={buttonVariants({
          variant: "outline",
          className: "absolute left-4 top-4",
        })}
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-md">
          <Image src="/logo.png" alt="logo" width={45} height={45} />
          LMS Platform
        </Link>

        {children}

        <div className="text-balance text-center text-xs text-muted-foreground">
          By clicking continue, you agree to our{" "}
          <span className="font-medium underline hover:text-blue-400">
            Terms
          </span>{" "}
          and{" "}
          <span className="font-medium underline hover:text-blue-400">
            Privacy Policy
          </span>
        </div>
      </div>
    </main>
  );
}
