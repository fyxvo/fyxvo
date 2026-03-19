import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function getPrimaryHost() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    return null;
  }

  return new URL(siteUrl).host;
}

function getApexHost(primaryHost: string | null) {
  if (!primaryHost || !primaryHost.startsWith("www.")) {
    return null;
  }

  return primaryHost.slice("www.".length);
}

function getStatusHost() {
  const statusPageUrl = process.env.NEXT_PUBLIC_STATUS_PAGE_URL;
  if (!statusPageUrl) {
    return null;
  }

  return new URL(statusPageUrl).host;
}

function isAssetPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes(".")
  );
}

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  const primaryHost = getPrimaryHost();
  const apexHost = getApexHost(primaryHost);
  const statusHost = getStatusHost();

  if (apexHost && primaryHost && host === apexHost) {
    url.protocol = "https";
    url.host = primaryHost;
    return NextResponse.redirect(url, 308);
  }

  if (statusHost && host === statusHost && !isAssetPath(url.pathname)) {
    if (url.pathname !== "/status") {
      url.pathname = "/status";
      url.search = "";
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
