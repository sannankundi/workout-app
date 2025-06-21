import { NextResponse } from "next/server";

const RECAPTCHA_API_KEY = process.env.RECAPTCHA_API_KEY;
const PROJECT_ID = process.env.RECAPTCHA_PROJECT_ID || "fittrackworkout";
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

// Check if reCAPTCHA is properly configured
const isRecaptchaConfigured = !!RECAPTCHA_API_KEY && !!RECAPTCHA_SITE_KEY;

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

    const response = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${PROJECT_ID}/assessments?key=${RECAPTCHA_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: {
            token,
            expectedAction: action,
            siteKey: RECAPTCHA_SITE_KEY,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("reCAPTCHA assessment failed:", data);
      return NextResponse.json(
        { success: false, error: "Assessment failed" },
        { status: response.status }
      );
    }

    // Check if the assessment was successful
    const score = data.riskAnalysis?.score || 0;
    const success = score >= 0.5; // You can adjust this threshold

    return NextResponse.json({ success, score });
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
