"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import ProtectedRoute from "../components/ProtectedRoute";

type TabType = "workouts" | "recent";

// Define TypeScript interfaces
interface User {
  uid: string;
  email: string | null;
  displayName?: string;
  photoURL?: string;
}

interface AuthContextType {
  currentUser: User | null;
}

interface WorkoutTemplate {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  imageUrl?: string;
  userId?: string;
}

interface WorkoutLog {
  id: string;
  userId: string;
  workoutName: string;
  completedAt: string;
  duration: number;
  exercises: Exercise[];
}

interface Exercise {
  name: string;
  sets: number;
  reps?: number;
  duration?: number;
  restTime: number;
  type: "reps" | "time";
  notes: string;
}

export default function WorkoutsPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("workouts");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchWorkouts = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Define the Full Body workout
      const fullBodyWorkout: WorkoutTemplate = {
        id: "full-body",
        title: "Full Body Workout",
        description:
          "A comprehensive full body workout targeting all major muscle groups",
        duration: 45,
        difficulty: "intermediate",
        imageUrl:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      };

      // Fetch workout templates
      const templatesQuery = query(
        collection(db, "workoutTemplates"),
        where("userId", "==", currentUser.uid)
      );
      const templatesSnapshot = await getDocs(templatesQuery);
      const templatesData: WorkoutTemplate[] = templatesSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as WorkoutTemplate)
      );

      // Always include the Full Body workout at the start
      const allTemplates = [fullBodyWorkout, ...templatesData];
      setTemplates(allTemplates);

      // Fetch recent workouts
      const recentQuery = query(
        collection(db, "workoutLogs"),
        where("userId", "==", currentUser.uid)
      );
      const recentSnapshot = await getDocs(recentQuery);
      const recentData: WorkoutLog[] = recentSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as WorkoutLog)
      );
      setRecentWorkouts(recentData);
    } catch (error: unknown) {
      console.error("Error fetching workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [currentUser]);

  const handleDelete = async (id: string) => {
    if (!currentUser || id === "full-body") return;

    try {
      setDeletingId(id);
      await deleteDoc(doc(db, "workoutTemplates", id));
      setTemplates(templates.filter((template) => template.id !== id));
    } catch (error) {
      console.error("Error deleting workout:", error);
      alert("Failed to delete workout. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Workouts
          </h1>
          <Link href="/workouts/new" className="btn-primary">
            Create Custom Workout
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex space-x-4 border-b dark:border-gray-700">
            <button
              className={`pb-2 px-4 transition-all duration-300 ${
                activeTab === "workouts"
                  ? "border-b-2 border-primary text-primary dark:text-primary font-medium"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
              onClick={() => setActiveTab("workouts")}
            >
              Workouts
            </button>
            <button
              className={`pb-2 px-4 transition-all duration-300 ${
                activeTab === "recent"
                  ? "border-b-2 border-primary text-primary dark:text-primary font-medium"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
              onClick={() => setActiveTab("recent")}
            >
              Recent Workouts
            </button>
          </div>
        </div>

        {activeTab === "workouts" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-600 dark:text-gray-300">
                  No workout templates found
                </p>
              </div>
            ) : (
              templates.map((workout) => (
                <div
                  key={workout.id}
                  className="group bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <Link
                    href={
                      workout.id === "full-body"
                        ? "/workouts/full-body"
                        : `/workouts/${workout.id}`
                    }
                    className="block"
                  >
                    {workout.imageUrl && (
                      <div className="relative w-full h-48 overflow-hidden">
                        <Image
                          src={workout.imageUrl}
                          alt={workout.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary transition-colors duration-300">
                        {workout.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {workout.description}
                      </p>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          {workout.duration} minutes
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 capitalize">
                          {workout.difficulty}
                        </span>
                      </div>
                    </div>
                  </Link>
                  {workout.id !== "full-body" &&
                    workout.userId === currentUser?.uid && (
                      <div className="p-4 border-t dark:border-gray-700">
                        <button
                          onClick={() => handleDelete(workout.id)}
                          disabled={deletingId === workout.id}
                          className="w-full btn-danger"
                        >
                          {deletingId === workout.id
                            ? "Deleting..."
                            : "Delete Workout"}
                        </button>
                      </div>
                    )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {recentWorkouts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300">
                  No recent workouts found
                </p>
              </div>
            ) : (
              recentWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link
                        href={`/workouts/${workout.workoutName
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                        className="text-xl font-semibold mb-2 text-primary hover:text-primary-dark transition-colors cursor-pointer"
                      >
                        {workout.workoutName}
                      </Link>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                        <span>
                          {new Date(workout.completedAt).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                        <span>{workout.duration} minutes</span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {workout.exercises.length} exercises completed
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
