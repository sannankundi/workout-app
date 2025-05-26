import { NextResponse } from "next/server";

// Log ALL environment variables (excluding sensitive values) when module loads
console.log("[Server] Environment Check:", {
  nodeEnv: process.env.NODE_ENV,
  // Log all environment variables that start with NEXT_PUBLIC_
  publicVars: Object.keys(process.env)
    .filter((key) => key.startsWith("NEXT_PUBLIC_"))
    .reduce((acc, key) => {
      acc[key] = process.env[key]
        ? "***" + process.env[key]?.slice(-4)
        : "not set";
      return acc;
    }, {} as Record<string, string>),
  // Check if the specific key exists
  hasPixabayKey: !!process.env.NEXT_PUBLIC_PIXABAY_API_KEY,
  // Log the actual key length if it exists
  pixabayKeyLength: process.env.NEXT_PUBLIC_PIXABAY_API_KEY?.length || 0,
});

export async function GET(request: Request) {
  console.log("[Server] Pixabay API Route called");

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    console.error("[Server] Missing query parameter");
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;

    if (!apiKey) {
      console.error("[Server] No API key found in environment variables");
      return NextResponse.json(
        {
          error: "Pixabay API key is not configured",
          details:
            "Please check your .env.local file and ensure it contains NEXT_PUBLIC_PIXABAY_API_KEY",
        },
        { status: 500 }
      );
    }

    // Construct URL according to Pixabay API documentation
    const apiUrl = new URL("https://pixabay.com/api/");
    apiUrl.searchParams.append("key", apiKey);
    apiUrl.searchParams.append("q", query);
    apiUrl.searchParams.append("image_type", "photo");
    apiUrl.searchParams.append("category", "sports");
    apiUrl.searchParams.append("safesearch", "true");
    apiUrl.searchParams.append("per_page", "1");
    apiUrl.searchParams.append("order", "popular");
    apiUrl.searchParams.append("min_width", "800");
    apiUrl.searchParams.append("min_height", "600");

    console.log("[Server] Making request to Pixabay API:", {
      url: apiUrl.toString().replace(apiKey, "***"),
      params: {
        q: query,
        image_type: "photo",
        category: "sports",
        safesearch: "true",
        per_page: "1",
        order: "popular",
        min_width: "800",
        min_height: "600",
      },
    });

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    // Log rate limit headers
    const rateLimit = {
      limit: response.headers.get("X-RateLimit-Limit"),
      remaining: response.headers.get("X-RateLimit-Remaining"),
      reset: response.headers.get("X-RateLimit-Reset"),
    };
    console.log("[Server] Rate limit status:", rateLimit);

    const responseText = await response.text();

    if (response.status === 401) {
      console.error("[Server] Pixabay API unauthorized error:", {
        status: response.status,
        statusText: response.statusText,
        response: responseText,
        rateLimit,
      });
      return NextResponse.json(
        {
          error: "Unauthorized access to Pixabay API",
          details:
            "Please verify your API key is correct and active. You can get a new API key from https://pixabay.com/api/docs/",
          response: responseText,
        },
        { status: 401 }
      );
    }

    if (!response.ok) {
      console.error("[Server] Pixabay API error:", {
        status: response.status,
        statusText: response.statusText,
        response: responseText,
        rateLimit,
      });
      return NextResponse.json(
        {
          error: `Pixabay API error: ${response.status} ${response.statusText}`,
          details: responseText,
        },
        { status: response.status }
      );
    }

    try {
      const data = JSON.parse(responseText);

      // Log response summary
      console.log("[Server] Pixabay API response:", {
        totalHits: data.totalHits,
        hasHits: data.hits?.length > 0,
        rateLimit,
      });

      return NextResponse.json(data);
    } catch (e) {
      console.error("[Server] Failed to parse Pixabay response:", e);
      return NextResponse.json(
        {
          error: "Invalid response from Pixabay API",
          details: "Could not parse response as JSON",
          response: responseText,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Server] Error in Pixabay API route:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch images",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
