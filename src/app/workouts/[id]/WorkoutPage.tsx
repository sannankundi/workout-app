"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../app/firebase/config";
import { useAuth } from "../../../app/contexts/AuthContext";

interface Exercise {
  name: string;
  sets: number;
  reps?: number;
  duration?: number;
  restTime: number;
  type: "reps" | "time";
  notes: string;
}

interface WorkoutTemplate {
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  imageUrl?: string;
  exercises: Exercise[];
  userId: string;
}

interface WorkoutPageProps {
  id: string;
}

export default function WorkoutPage({ id }: WorkoutPageProps) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [workout, setWorkout] = useState<WorkoutTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        if (!id) {
          setError("Invalid workout ID");
          setLoading(false);
          return;
        }
        const workoutDoc = await getDoc(doc(db, "workoutTemplates", id));
        if (workoutDoc.exists()) {
          setWorkout(workoutDoc.data() as WorkoutTemplate);
        } else {
          setError("Workout not found");
          router.push("/workouts");
        }
      } catch (error) {
        console.error("Error fetching workout:", error);
        setError("Failed to fetch workout");
        router.push("/workouts");
      } finally {
        setLoading(false);
      }
    };
    fetchWorkout();
  }, [id, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">{error}</div>
        <div className="text-center mt-4">
          <Link
            href="/workouts"
            className="text-primary hover:text-primary-dark"
          >
            Back to Workouts
          </Link>
        </div>
      </div>
    );
  }

  if (!workout) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{workout.title}</h1>
          <Link
            href="/workouts"
            className="text-primary hover:text-primary-dark"
          >
            Back to Workouts
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-600">{workout.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">Duration</h3>
              <p>{workout.duration} minutes</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Difficulty</h3>
              <p className="capitalize">{workout.difficulty}</p>
            </div>
          </div>

          {workout.exercises.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Exercises</h2>
              <div className="space-y-4">
                {workout.exercises.map((exercise, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-medium">{exercise.name}</h3>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Sets: {exercise.sets}</p>
                      {exercise.type === "reps" ? (
                        <p>Reps: {exercise.reps}</p>
                      ) : (
                        <p>Duration: {exercise.duration} seconds</p>
                      )}
                      <p>Rest Time: {exercise.restTime} seconds</p>
                      {exercise.notes && <p>Notes: {exercise.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
