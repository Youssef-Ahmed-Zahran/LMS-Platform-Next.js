import arcjet, { detectBot } from "@/lib/arcjet";
import { isSpoofedBot } from "@arcjet/inspect";
import ip from "@arcjet/ip";
import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const aj = arcjet.withRule(
  detectBot({
    mode: "LIVE",
    // Block automated bots while allowing search engines, uptime monitors, and link previews
    allow: [
      "CATEGORY:SEARCH_ENGINE",
      "CATEGORY:MONITOR",
      "CATEGORY:PREVIEW",
      "STRIPE_WEBHOOK",
    ],
  }),
);

export async function proxy(request: NextRequest) {
  // 1. Run Arcjet protection first so bots and attacks are blocked before any routing/auth work
  const decision = await aj.protect(request, {
    fingerprint: ip(request) || "127.0.0.1",
  });

  if (decision.isDenied()) {
    const message = decision.reason.isBot() ? "No bots allowed" : "Forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  if (decision.results.some(isSpoofedBot)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Optimistic auth gate for /admin (full session + role checks still enforced server-side)
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
