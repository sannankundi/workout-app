"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "../../firebase/config";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Query,
  QuerySnapshot,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { usePreferences } from "../../contexts/PreferencesContext";
import { FaPlay, FaPause, FaCheck, FaArrowRight } from "react-icons/fa";
import WorkoutCalendar from "../../components/WorkoutCalendar";
import ProtectedRoute from "../../components/ProtectedRoute";

// Define TypeScript interfaces
interface Exercise {
  name: string;
  sets: number;
  reps?: number;
  duration?: number;
  restTime: number;
  type: "reps" | "time";
  notes: string;
}

interface Workout {
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  imageUrl: string;
  exercises: Exercise[];
}

interface WorkoutLog {
  id: string;
  userId: string;
  workoutName: string;
  completedAt: string;
  duration: number;
  exercises: Exercise[];
}

interface User {
  uid: string;
  [key: string]: any; // Allow additional properties
}

const FullBodyWorkout = () => {
  const router = useRouter();
  const { currentUser } = useAuth() as { currentUser: User | null };
  const [currentExercise, setCurrentExercise] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [completedExercises, setCompletedExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isResting, setIsResting] = useState<boolean>(false);
  const [showCompletion, setShowCompletion] = useState<boolean>(false);
  const [workoutStreaks, setWorkoutStreaks] = useState<WorkoutLog[]>([]);
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [isExerciseComplete, setIsExerciseComplete] = useState<boolean>(false);

  // Full Body Workout data
  const workout: Workout = {
    title: "Full Body Workout",
    description:
      "A comprehensive full body workout targeting all major muscle groups",
    duration: 45,
    difficulty: "intermediate",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
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
      {
        name: "Mountain Climbers",
        sets: 3,
        duration: 30,
        restTime: 60,
        type: "time",
        notes:
          "Start in a high plank position with hands under shoulders. Keep your core tight and maintain a straight body line. Alternate bringing each knee towards your chest in a running motion, keeping your hips low and back flat. Move at a controlled pace, focusing on form rather than speed.",
      },
      {
        name: "Lunges",
        sets: 3,
        reps: 10,
        restTime: 60,
        type: "reps",
        notes:
          "Stand with feet together. Take a large step forward with one leg, lowering your body until both knees form 90-degree angles. Keep your front knee aligned with your ankle and your back knee hovering just above the ground. Push through your front heel to return to standing. Alternate legs with each rep.",
      },
      {
        name: "Bicycle Crunches",
        sets: 3,
        reps: 20,
        restTime: 60,
        type: "reps",
        notes:
          "Lie on your back with hands behind your head, elbows wide. Lift your shoulders off the ground and bring your knees towards your chest. Alternate touching your right elbow to your left knee while extending your right leg, then switch sides. Keep your lower back pressed into the ground and maintain a slow, controlled motion.",
      },
    ],
  };

  useEffect(() => {
    const fetchWorkoutStreaks = async () => {
      if (!currentUser) return;

      try {
        const streaksQuery = query(
          collection(db, "workoutLogs"),
          where("userId", "==", currentUser.uid),
          where("workoutName", "==", workout.title)
        );
        const streaksSnapshot = await getDocs(streaksQuery);
        const streaks: WorkoutLog[] = streaksSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as WorkoutLog)
        );
        setWorkoutStreaks(streaks);
      } catch (error) {
        console.error("Error fetching workout streaks:", error);
      }
      setLoading(false);
    };

    fetchWorkoutStreaks();
  }, [currentUser, workout.title]);

  useEffect(() => {
    // Initialize time for first exercise if it's time-based
    if (workout.exercises[0].type === "time") {
      setTimeLeft(workout.exercises[0].duration || 0);
    }
  }, [workout.exercises]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isActive && timeLeft > 0) {
      console.log("Timer running:", { timeLeft, isResting });
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          console.log("Timer tick:", { prev, new: prev - 1 });
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      console.log("Timer finished:", {
        isResting,
        currentSet,
        currentExercise,
      });
      if (isResting) {
        setIsResting(false);
        if (currentSet < workout.exercises[currentExercise].sets) {
          // Move to next set
          console.log("Moving to next set:", {
            currentSet,
            nextSet: currentSet + 1,
          });
          setCurrentSet(currentSet + 1);
          setIsExerciseComplete(false);
          if (workout.exercises[currentExercise].type === "time") {
            setTimeLeft(workout.exercises[currentExercise].duration || 0);
          }
        } else {
          // Move to next exercise
          console.log("Moving to next exercise");
          handleWorkoutComplete();
        }
      }
    }
    return () => {
      console.log("Cleaning up timer");
      if (timer) clearInterval(timer);
    };
  }, [
    isActive,
    timeLeft,
    isResting,
    currentExercise,
    currentSet,
    workout.exercises,
  ]);

  useEffect(() => {
    const checkTodayWorkout = async () => {
      if (!currentUser) return;

      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const logsQuery = query(
          collection(db, "workoutLogs"),
          where("userId", "==", currentUser.uid),
          where("workoutName", "==", workout.title),
          where("completedAt", ">=", today.toISOString()),
          where("completedAt", "<", tomorrow.toISOString())
        );

        const logsSnapshot = await getDocs(logsQuery);
        if (!logsSnapshot.empty) {
          // User has already completed this workout today
          setShowCompletion(true);
        }
      } catch (error) {
        console.error("Error checking today's workout:", error);
      }
    };

    checkTodayWorkout();
  }, [currentUser, workout.title]);

  const handleStart = () => {
    console.log("Starting exercise:", { currentExercise, currentSet });
    setIsActive(true);
  };

  const handlePause = () => {
    console.log("Pausing exercise");
    setIsActive(false);
  };

  const handleSetComplete = () => {
    const isLastExercise = currentExercise === workout.exercises.length - 1;
    const isLastSet = currentSet === workout.exercises[currentExercise].sets;

    console.log("Set Complete:", {
      isLastExercise,
      isLastSet,
      currentExercise,
      currentSet,
      totalExercises: workout.exercises.length,
      totalSets: workout.exercises[currentExercise].sets,
    });

    if (isLastExercise && isLastSet) {
      // Special handling for the last set of the last exercise
      console.log("Last set of last exercise - Completing workout");
      handleWorkoutComplete();
    } else {
      // Normal exercise completion flow
      console.log("Starting rest period for next set");
      setIsExerciseComplete(true);
      setIsResting(true);
      setTimeLeft(workout.exercises[currentExercise].restTime);
      setIsActive(true);
    }
  };

  const handleWorkoutComplete = useCallback(async () => {
    console.log("Handling workout completion");
    try {
      // Check if workout was already completed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const logsQuery = query(
        collection(db, "workoutLogs"),
        where("userId", "==", currentUser?.uid),
        where("workoutName", "==", workout.title),
        where("completedAt", ">=", today.toISOString()),
        where("completedAt", "<", tomorrow.toISOString())
      );

      const logsSnapshot = await getDocs(logsQuery);
      if (!logsSnapshot.empty) {
        console.log("Workout already completed today");
        setShowCompletion(true);
        return;
      }

      // Add the last exercise to completed exercises
      const lastExercise = workout.exercises[currentExercise];
      const updatedCompletedExercises = [...completedExercises, lastExercise];

      console.log("Saving workout to Firestore:", {
        userId: currentUser?.uid,
        workoutName: workout.title,
        exercises: updatedCompletedExercises,
      });

      // Save workout completion to Firestore
      await addDoc(collection(db, "workoutLogs"), {
        userId: currentUser?.uid,
        workoutName: workout.title,
        completedAt: new Date().toISOString(),
        duration: workout.duration,
        exercises: updatedCompletedExercises,
      });

      console.log("Workout saved to Firestore successfully");
      setShowCompletion(true);
    } catch (error) {
      console.error("Error saving workout completion:", error);
    }
  }, [currentExercise, currentUser, workout, completedExercises]);

  const handleSkipRest = () => {
    console.log("Skipping rest period");
    setIsResting(false);
    if (currentSet < workout.exercises[currentExercise].sets) {
      // Move to next set
      console.log("Moving to next set after skipping rest");
      setCurrentSet(currentSet + 1);
      setIsExerciseComplete(false);
      if (workout.exercises[currentExercise].type === "time") {
        setTimeLeft(workout.exercises[currentExercise].duration || 0);
      }
    } else {
      // Move to next exercise
      console.log("Moving to next exercise after skipping rest");
      if (currentExercise < workout.exercises.length - 1) {
        setCurrentExercise(currentExercise + 1);
        setCurrentSet(1);
        setIsExerciseComplete(false);
        const nextExercise = workout.exercises[currentExercise + 1];
        if (nextExercise.type === "time") {
          setTimeLeft(nextExercise.duration || 0);
        }
      } else {
        // If it's the last exercise, complete the workout
        console.log("Completing workout after skipping rest");
        handleWorkoutComplete();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showCompletion) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-4">Workout Completed!</h2>
          <p className="text-gray-600 mb-6">
            Great job! You've completed the Full Body Workout. Keep up the good
            work!
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

  const currentExerciseData = workout.exercises[currentExercise];

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{workout.title}</h1>

          {workout.imageUrl && (
            <div className="mb-8">
              <img
                src={workout.imageUrl}
                alt={workout.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          <WorkoutCalendar workoutName={workout.title} />

          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {isResting
                  ? "Rest"
                  : `Exercise ${currentExercise + 1} of ${
                      workout.exercises.length
                    }`}
              </h2>
              <div className="text-gray-600">
                Set {currentSet} of {currentExerciseData.sets}
              </div>
            </div>

            {!isResting ? (
              <>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">
                    {currentExerciseData.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Sets</div>
                      <div className="text-xl font-semibold">
                        {currentExerciseData.sets}
                      </div>
                    </div>
                    {currentExerciseData.type === "reps" ? (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">Reps</div>
                        <div className="text-xl font-semibold">
                          {currentExerciseData.reps}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">Duration</div>
                        <div className="text-xl font-semibold">{timeLeft}s</div>
                      </div>
                    )}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Rest Time</div>
                      <div className="text-xl font-semibold">
                        {currentExerciseData.restTime}s
                      </div>
                    </div>
                  </div>
                  {currentExerciseData.notes && (
                    <p className="text-gray-600">{currentExerciseData.notes}</p>
                  )}
                </div>

                <div className="flex justify-between">
                  {!isActive ? (
                    <button
                      onClick={handleStart}
                      className="flex items-center bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark"
                    >
                      <FaPlay className="mr-2" />
                      Start Exercise
                    </button>
                  ) : (
                    <button
                      onClick={handlePause}
                      className="flex items-center bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200"
                    >
                      <FaPause className="mr-2" />
                      Pause
                    </button>
                  )}
                  <button
                    onClick={handleSetComplete}
                    className="flex items-center bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
                  >
                    <FaCheck className="mr-2" />
                    Complete Set
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <h3 className="text-2xl font-bold mb-4">Rest Time</h3>
                <div className="text-4xl font-bold text-primary mb-4">
                  {timeLeft}s
                </div>
                <p className="text-gray-600 mb-4">
                  Get ready for the next set!
                </p>
                <button
                  onClick={handleSkipRest}
                  className="text-primary hover:text-primary-dark font-medium"
                >
                  Skip Rest
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Exercise List</h3>
            {workout.exercises.map((exercise, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg shadow p-4 flex items-center justify-between ${
                  index === currentExercise ? "ring-2 ring-primary" : ""
                }`}
              >
                <div>
                  <h4 className="font-medium">{exercise.name}</h4>
                  <p className="text-sm text-gray-600">
                    {exercise.sets} sets ×{" "}
                    {exercise.type === "reps"
                      ? `${exercise.reps} reps`
                      : `${exercise.duration}s`}
                  </p>
                </div>
                <div className="flex items-center">
                  {index < currentExercise ? (
                    <span className="text-green-500 text-xl">✓</span>
                  ) : index === currentExercise ? (
                    <FaArrowRight className="text-primary" />
                  ) : (
                    <FaArrowRight className="text-gray-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default FullBodyWorkout;
