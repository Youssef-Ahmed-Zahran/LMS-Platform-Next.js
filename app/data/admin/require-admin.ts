import "server-only";

import { auth } from "@/lib/auth";
import { ApiResponse } from "@/types";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";

/**
 * Shared admin guard for API route handlers (e.g. S3 upload & delete).
 *
 * Returns `{ session, userId }` when the caller is an authenticated admin.
 * Returns a ready-to-send `NextResponse` (401 / 403) when they are not.
 *
 * Usage inside a route handler:
 * ```ts
 * const result = await requireAdmin(req);
 * if (result instanceof NextResponse) return result; // blocked
 * const { session, userId } = result;
 * ```
 */
export async function requireAdmin(_req?: Request) {
  const reqHeaders = await headers();
  try {
    const session = await auth.api.getSession({ headers: reqHeaders });

    // ── Not authenticated ───────────────────────────────────────────────────
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to perform this action.", code: "unauthorized" },
        { status: 401 }
      );
    }

    // ── Not an admin ────────────────────────────────────────────────────────
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. You do not have permission to perform this action.", code: "forbidden" },
        { status: 403 }
      );
    }

    return {
      session,
      userId: session.user.id,
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[requireAdmin] Session lookup failed:", error);
    return NextResponse.json(
      { error: "Authentication service unavailable. Please try again.", code: "session_error" },
      { status: 500 }
    );
  }
}

export type RequireAdminActionResult =
  | {
      authorized: true;
      session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
    }
  | {
      authorized: false;
      code: "unauthorized" | "forbidden" | "session_error";
      error: ApiResponse<never>;
    };

/**
 * Shared admin guard for Server Actions.
 *
 * Returns `{ authorized: true, session }` when the caller is an authenticated admin.
 * Returns `{ authorized: false, error }` with an `ApiResponse` error payload otherwise.
 *
 * Usage inside a server action:
 * ```ts
 * const adminCheck = await requireAdminAction();
 * if (!adminCheck.authorized) return adminCheck.error;
 * const { session } = adminCheck;
 * ```
 */
export async function requireAdminAction(): Promise<RequireAdminActionResult> {
  const reqHeaders = await headers();
  try {
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session?.user?.id) {
      return {
        authorized: false,
        code: "unauthorized",
        error: {
          status: "error",
          message: "Unauthorized. Please log in to perform this action.",
        },
      };
    }

    if (session.user.role !== "admin") {
      return {
        authorized: false,
        code: "forbidden",
        error: {
          status: "error",
          message: "Forbidden. Only admins can perform this action.",
        },
      };
    }

    return {
      authorized: true,
      session,
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[requireAdminAction] Session check error:", error);
    return {
      authorized: false,
      code: "session_error",
      error: {
        status: "error",
        message: "Failed to authenticate session due to a database error. Please try again.",
      },
    };
  }
}

/**
 * Checks whether the current server-side session belongs to an admin.
 * Safe to call from Server Components and layouts.
 */
export async function isAdminSession(): Promise<boolean> {
  const reqHeaders = await headers();
  try {
    const session = await auth.api.getSession({ headers: reqHeaders });
    return session?.user?.role === "admin";
  } catch (error) {
    unstable_rethrow(error);
    console.error("[isAdminSession] Session check error:", error);
    return false;
  }
}
