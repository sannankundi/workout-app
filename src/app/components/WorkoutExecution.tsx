"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "../firebase/config";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { FaPlay, FaPause, FaCheck, FaArrowRight } from "react-icons/fa";

// Define TypeScript interfaces
interface User {
  uid: string;
  email: string | null;
  [key: string]: any;
}

interface AuthContextType {
  currentUser: User | null;
}

interface Preferences {
  measurementSystem: "metric" | "imperial";
  [key: string]: any;
}

interface PreferencesContextType {
  preferences: Preferences;
}

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  restTime?: number;
  notes?: string;
}

interface Workout {
  title: string;
  duration: number;
  exercises: Exercise[];
}

interface WorkoutExecutionProps {
  workoutId: string;
}

const WorkoutExecution = ({ workoutId }: WorkoutExecutionProps) => {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const { preferences } = usePreferences();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [currentExercise, setCurrentExercise] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [completedExercises, setCompletedExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCompletion, setShowCompletion] = useState<boolean>(false);

  useEffect(() => {
    const fetchWorkout = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const workoutDoc = await getDoc(doc(db, "workouts", workoutId));
        if (workoutDoc.exists()) {
          setWorkout(workoutDoc.data() as Workout);
          if (workoutDoc.data().exercises[0].restTime) {
            setTimeLeft(workoutDoc.data().exercises[0].restTime);
          }
        }
      } catch (error) {
        console.error("Error fetching workout:", error);
      }
      setLoading(false);
    };

    fetchWorkout();
  }, [workoutId, currentUser]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleExerciseComplete();
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const handleStart = () => {
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleExerciseComplete = async () => {
    if (!workout || !currentUser) return;

    const exercise = workout.exercises[currentExercise];
    setCompletedExercises([...completedExercises, exercise]);

    if (currentExercise < workout.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      const nextExercise = workout.exercises[currentExercise + 1];
      if (nextExercise.restTime) {
        setTimeLeft(nextExercise.restTime);
      }
    } else {
      try {
        await addDoc(collection(db, "workoutLogs"), {
          userId: currentUser.uid,
          workoutId,
          workoutName: workout.title,
          completedAt: new Date().toISOString(),
          duration: workout.duration,
          exercisesCompleted: workout.exercises.length,
          exercises: [...completedExercises, exercise],
        });
        setShowCompletion(true);
      } catch (error) {
        console.error("Error saving workout log:", error);
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!workout) {
    return <div>Workout not found</div>;
  }

  const currentExerciseData = workout.exercises[currentExercise];

  if (showCompletion) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-4">Workout Completed!</h2>
          <p className="text-gray-600 mb-6">
            Great job! You've completed the workout. Keep up the good work!
          </p>
          <Link
            href="/workouts"
            className="block w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Return to Workouts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{workout.title}</h1>

        <div className="bg-white dark:bg-dark-secondary rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Exercise {currentExercise + 1} of {workout.exercises.length}
            </h2>
            <div className="text-gray-600 dark:text-gray-300">
              {completedExercises.length} completed
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">
              {currentExerciseData.name}
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Sets
                </div>
                <div className="text-xl font-semibold">
                  {currentExerciseData.sets}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Reps
                </div>
                <div className="text-xl font-semibold">
                  {currentExerciseData.reps}
                </div>
              </div>
              {currentExerciseData.weight > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Weight
                  </div>
                  <div className="text-xl font-semibold">
                    {currentExerciseData.weight}{" "}
                    {preferences.measurementSystem === "metric" ? "kg" : "lbs"}
                  </div>
                </div>
              )}
              {currentExerciseData.restTime && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Rest Time
                  </div>
                  <div className="text-xl font-semibold">{timeLeft}s</div>
                </div>
              )}
            </div>
            {currentExerciseData.notes && (
              <p className="text-gray-600 dark:text-gray-300">
                {currentExerciseData.notes}
              </p>
            )}
          </div>

          <div className="flex justify-between">
            {!isActive ? (
              <button
                onClick={handleStart}
                className="flex items-center bg-primary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors"
                aria-label="Start exercise"
              >
                <FaPlay className="mr-2" />
                Start Exercise
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Pause exercise"
              >
                <FaPause className="mr-2" />
                Pause
              </button>
            )}
            <button
              onClick={handleExerciseComplete}
              className="flex items-center bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
              aria-label="Complete exercise"
            >
              <FaCheck className="mr-2" />
              Complete Exercise
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Upcoming Exercises</h3>
          {workout.exercises
            .slice(currentExercise + 1)
            .map((exercise, index) => (
              <div
                key={index}
                className="bg-white dark:bg-dark-secondary rounded-lg shadow p-4 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-medium">{exercise.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {exercise.sets} sets × {exercise.reps} reps
                  </p>
                </div>
                <FaArrowRight className="text-gray-400" />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default WorkoutExecution;
