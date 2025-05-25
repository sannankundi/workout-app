"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { FaBell, FaCheck } from "react-icons/fa";

// Define TypeScript interfaces
interface User {
  uid: string;
  email: string | null;
  [key: string]: any;
}

interface AuthContextType {
  currentUser: User | null;
}

interface WorkoutSchedule {
  id: string;
  userId: string;
  workoutId: string;
  workoutName: string;
  date: string;
  completed: boolean;
  completedAt?: string;
}

const WorkoutReminder = () => {
  const { currentUser } = useAuth();
  const [todaysWorkout, setTodaysWorkout] = useState<WorkoutSchedule | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkTodaysWorkout = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const workoutQuery = query(
          collection(db, "workoutSchedule"),
          where("userId", "==", currentUser.uid),
          where("date", "==", today.toISOString()),
          where("completed", "==", false)
        );

        const workoutSnapshot = await getDocs(workoutQuery);
        if (!workoutSnapshot.empty) {
          const workoutData = workoutSnapshot.docs[0].data() as WorkoutSchedule;
          setTodaysWorkout({
            ...workoutData,
          });
        }
      } catch (error) {
        console.error("Error checking today's workout:", error);
      }
      setLoading(false);
    };

    checkTodaysWorkout();
  }, [currentUser]);

  const markWorkoutAsCompleted = async () => {
    if (!todaysWorkout) return;
    try {
      await updateDoc(doc(db, "workoutSchedule", todaysWorkout.id), {
        completed: true,
        completedAt: new Date().toISOString(),
      });
      setTodaysWorkout(null);
    } catch (error) {
      console.error("Error marking workout as completed:", error);
    }
  };

  if (loading || !todaysWorkout) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-dark-secondary shadow-lg rounded-lg p-4 max-w-sm">
      <div className="flex items-start space-x-3">
        <FaBell className="text-primary mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Today's Workout
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            You have a workout scheduled: {todaysWorkout.workoutName}
          </p>
          <div className="mt-2 flex space-x-2">
            <Link
              href={`/workout/${todaysWorkout.workoutId}`}
              className="text-sm text-primary hover:text-opacity-90"
            >
              Start Workout
            </Link>
            <button
              onClick={markWorkoutAsCompleted}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
            >
              <FaCheck className="mr-1" />
              Mark as Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutReminder;
