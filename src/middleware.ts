import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  if (host.includes("nexonet-git-master-adrianmorra-gmailcoms-projects.vercel.app")) {
    const url = new URL(request.url);
    url.hostname = "nexonet.ar";
    url.port = "";
    url.protocol = "https:";
    return NextResponse.redirect(url.toString(), 301);
  }

  return NextResponse.next();
}
