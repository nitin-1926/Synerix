import { NextResponse, type NextRequest } from "next/server";

// Next 16 convention: proxy.ts replaces middleware.ts.
// Lightweight gate: checks for the Auth.js session cookie (JWT strategy).
// Real authentication/authorization happens in requireAuth() at the data layer
// — this only handles redirect UX for signed-out visitors.
const SESSION_COOKIES = ["__Secure-authjs.session-token", "authjs.session-token"];

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/calendar",
  "/brand",
  "/products",
  "/studio",
  "/library",
  "/models",
  "/onboarding",
  "/settings",
  "/admin",
];

export async function proxy(request: NextRequest) {
  // DEV-ONLY: when the auth bypass is on, skip all session gating.
  if (process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS === "1") {
    return NextResponse.next({ request });
  }

  const path = request.nextUrl.pathname;
  const isAuthed = SESSION_COOKIES.some((name) => request.cookies.has(name));
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

  if (!isAuthed && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (isAuthed && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff2?)$).*)"],
};
