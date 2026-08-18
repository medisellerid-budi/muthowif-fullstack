import { NextResponse } from "next/server";

export function middleware(request: Request) {
  const origin = request.headers.get("origin") || "*";

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Bypass-Tunnel-Reminder, ngrok-skip-browser-warning",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Bypass-Tunnel-Reminder, ngrok-skip-browser-warning"
  );

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
