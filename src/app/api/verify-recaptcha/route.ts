import { NextResponse } from "next/server";

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

// Check if reCAPTCHA is properly configured
const isRecaptchaConfigured = !!RECAPTCHA_SECRET_KEY && !!RECAPTCHA_SITE_KEY;

export async function POST(request: Request) {
  try {
    const { token, action } = await request.json();

    // If reCAPTCHA is not configured, return success for dummy tokens
    if (!isRecaptchaConfigured) {
      if (token === "dummy-token") {
        return NextResponse.json({ success: true, score: 1.0 });
      }
      return NextResponse.json(
        { success: false, error: "reCAPTCHA not configured" },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 400 }
      );
    }

    // Use standard reCAPTCHA v2 verification
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: RECAPTCHA_SECRET_KEY,
          response: token,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("reCAPTCHA verification failed:", data);
      return NextResponse.json(
        { success: false, error: "Verification failed" },
        { status: response.status }
      );
    }

    // Check if the verification was successful
    const success = data.success === true;
    const score = success ? 1.0 : 0.0; // reCAPTCHA v2 doesn't provide scores, only success/failure

    return NextResponse.json({ success, score });
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
