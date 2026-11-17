"use client";

import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import Link from "next/link";
import { UserDropdown } from "./UserDropdown";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-[backdrop-filter]:bg-background/60">
      <div className="flex min-h-16 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2 mr-4">
          <Image
            src="/logo.png"
            alt="Logo"
            width={150}
            height={150}
            className="size-9"
          />
          <span className="font-bold">LMS Platform</span>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex md:flex-1 md:items-center md:justify-between">
          <div className="flex items-center space-x-6 lg:space-x-10 mx-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="flex items-center space-x-4 ml-auto">
          <ThemeToggle />

          {isPending ? (
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="hidden md:inline-block h-4 w-20 rounded" />
            </div>
          ) : session?.user ? (
            <UserDropdown
              user={session.user}
              isAdmin={session.user.role === "admin"}
            />
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "secondary" })}
              >
                Login
              </Link>
              <Link href="/login" className={buttonVariants()}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
