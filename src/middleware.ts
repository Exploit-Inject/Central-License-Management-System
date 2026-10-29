import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("lm_auth_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === "/login";
  const isProtectedPage =
    pathname === "/" ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/logs") ||
    pathname.startsWith("/sdks");

  if (isProtectedPage && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthPage && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/products/:path*", "/settings/:path*", "/logs/:path*", "/sdks/:path*", "/login"],
};

