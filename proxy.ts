import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { decrypt } from "./lib/session";

const protectedRoutes = [
  "/dashboard",
  "/create",
  "/complete-profile",
  "/settings",
];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);

  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);
  if (isProtectedRoute && !session?.phoneNumber) {
    return NextResponse.redirect(
      new URL(`/auth?callbackUrl=${path}`, request.nextUrl),
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", path);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
