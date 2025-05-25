import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Only protect API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify the token using Firebase Auth REST API
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken: token }),
      }
    );

    if (!response.ok) {
      throw new Error("Invalid token");
    }

    const data = await response.json();
    const userId = data.users[0].localId;

    // Add the user ID to the request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", userId);

    // Return the response with the modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Unauthorized - Invalid token" },
      { status: 401 }
    );
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: "/api/:path*",
};
