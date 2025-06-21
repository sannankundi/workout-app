"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  or,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { FaTimes } from "react-icons/fa";

interface Workout {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  userId?: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps?: number;
    duration?: number;
    restTime: number;
    type: "reps" | "time";
    notes: string;
  }>;
}

interface ScheduleWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: () => void;
}

const ScheduleWorkoutModal = ({
  isOpen,
  onClose,
  onSchedule,
}: ScheduleWorkoutModalProps) => {
  const { currentUser } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!currentUser) return;
      console.log("Fetching workouts...");
      try {
        // Get template workouts (no userId) and user's custom workouts
        const workoutsQuery = query(
          collection(db, "workouts"),
          or(
            where("userId", "==", null),
            where("userId", "==", currentUser.uid)
          )
        );
        const snapshot = await getDocs(workoutsQuery);
        const workoutsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Workout[];

        console.log("Fetched workouts:", workoutsData);

        // Add the full-body workout template if it doesn't exist in the fetched data
        const hasFullBodyWorkout = workoutsData.some(
          (w) => w.id === "full-body-template"
        );
        if (!hasFullBodyWorkout) {
          const fullBodyWorkout: Workout = {
            id: "full-body-template",
            title: "Full Body Workout",
            description:
              "A comprehensive full body workout targeting all major muscle groups",
            duration: 45,
            difficulty: "intermediate",
            exercises: [
              {
                name: "Push-ups",
                sets: 3,
                reps: 12,
                restTime: 60,
                type: "reps",
                notes:
                  "Start in a plank position with hands slightly wider than shoulder-width. Keep your core tight, back straight, and lower your body until your chest nearly touches the floor. Push back up to the starting position while maintaining a straight body line. Breathe in as you lower, breathe out as you push up.",
              },
              {
                name: "Squats",
                sets: 3,
                reps: 15,
                restTime: 60,
                type: "reps",
                notes:
                  "Stand with feet shoulder-width apart, toes slightly turned out. Keep your chest up and core engaged. Lower your body by pushing your hips back and bending your knees, as if sitting in a chair. Keep your knees aligned with your toes and go as low as comfortable (ideally thighs parallel to ground). Push through your heels to return to standing.",
              },
              {
                name: "Plank",
                sets: 3,
                duration: 45,
                restTime: 60,
                type: "time",
                notes:
                  "Start in a forearm plank position with elbows directly under shoulders. Keep your body in a straight line from head to heels, engaging your core, glutes, and legs. Avoid sagging at the hips or raising your buttocks. Breathe steadily and maintain the position for the full duration.",
              },
              {
                name: "Dumbbell Rows",
                sets: 3,
                reps: 12,
                restTime: 60,
                type: "reps",
                notes:
                  "Place one hand and knee on a bench, keeping your back flat and parallel to the ground. Hold a dumbbell in your free hand with arm extended. Pull the dumbbell up towards your hip, keeping your elbow close to your body. Squeeze your shoulder blade at the top, then lower with control. Switch sides after completing all reps.",
              },
            ],
          };
          setWorkouts([fullBodyWorkout, ...workoutsData]);
        } else {
          setWorkouts(workoutsData);
        }
      } catch (error) {
        console.error("Error fetching workouts:", error);
        setError("Failed to load workouts");
      }
    };

    if (isOpen) {
      fetchWorkouts();
    }
  }, [isOpen, currentUser]);

  const handleSchedule = async () => {
    if (!selectedWorkout || !selectedDate || !currentUser) return;

    setLoading(true);
    setError(null);

    try {
      // Get the workout details
      const selectedWorkoutData = workouts.find(
        (w) => w.id === selectedWorkout
      );
      if (!selectedWorkoutData) {
        throw new Error("Selected workout not found");
      }

      // Create the scheduled workout document and get its ID
      const docRef = await addDoc(collection(db, "scheduledWorkouts"), {
        workoutId: selectedWorkout,
        workoutName: selectedWorkoutData.title,
        scheduledDate: selectedDate,
        duration: selectedWorkoutData.duration,
        exercises: selectedWorkoutData.exercises,
        userId: currentUser.uid,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      onSchedule();
      onClose();
    } catch (error) {
      console.error("Error scheduling workout:", error);
      setError("Failed to schedule workout");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-secondary rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Schedule a Workout
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="workout"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Select Workout
            </label>
            <select
              id="workout"
              value={selectedWorkout}
              onChange={(e) => setSelectedWorkout(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
            >
              <option value="">Choose a workout</option>
              {workouts.map((workout) => (
                <option key={workout.id} value={workout.id}>
                  {workout.title} ({workout.duration} min)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Select Date
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-primary rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={!selectedWorkout || !selectedDate || loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? "Scheduling..." : "Schedule Workout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleWorkoutModal;
