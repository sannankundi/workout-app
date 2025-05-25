import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const workoutsRef = adminDb.collection("workouts");
    const snapshot = await workoutsRef.where("userId", "==", userId).get();

    const workouts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ workouts });
  } catch (error) {
    console.error("Error fetching workouts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, description, exercises } = body;

    if (!userId || !title) {
      return NextResponse.json(
        { error: "User ID and title are required" },
        { status: 400 }
      );
    }

    const workoutRef = adminDb.collection("workouts").doc();
    await workoutRef.set({
      userId,
      title,
      description,
      exercises,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id: workoutRef.id,
      message: "Workout created successfully",
    });
  } catch (error) {
    console.error("Error creating workout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
