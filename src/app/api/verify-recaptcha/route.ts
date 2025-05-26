import { NextResponse } from "next/server";

const RECAPTCHA_API_KEY = process.env.RECAPTCHA_API_KEY;
const PROJECT_ID = "fittrackworkout";

export async function POST(request: Request) {
  try {
    const { token, action } = await request.json();

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
            siteKey: "6LelKkkrAAAAAPaUeB0iqkvrVFjZVgFxksxYCGCh",
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
