import { NextRequest, NextResponse } from "next/server";

const PRIMARY_HOSTS = new Set([
  "nasaex.com",
  "www.nasaex.com",
]);

function isPrimaryHost(host: string): boolean {
  if (PRIMARY_HOSTS.has(host)) return true;
  const hostname = host.split(":")[0];
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (hostname.endsWith(".vercel.app")) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const path = req.nextUrl.pathname;

  if (isPrimaryHost(host)) return NextResponse.next();

  if (
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    path.startsWith("/uploads") ||
    path.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = `/_sites/${host}${path === "/" ? "" : path}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
