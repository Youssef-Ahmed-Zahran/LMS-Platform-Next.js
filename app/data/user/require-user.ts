import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * requireUser — Server-side session guard.
 *
 * Returns the authenticated session user or redirects to /login.
 * Use at the top of any Server Action or Server Component that
 * needs a confirmed identity.
 */
export async function requireUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
}
