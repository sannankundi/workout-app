"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { usePreferences } from "../../contexts/PreferencesContext";
import { FaPlay, FaPause, FaCheck, FaArrowRight } from "react-icons/fa";
import WorkoutCalendar from "../../components/WorkoutCalendar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { use } from "react";
import { query, getDocs, collection, where, addDoc } from "firebase/firestore";

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
  createdAt: string;
}

interface WorkoutLog {
  id: string;
  userId: string;
  workoutName: string;
  completedAt: string;
  duration: number;
  exercises: Exercise[];
}

interface WorkoutPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function WorkoutPage({ params }: WorkoutPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { currentUser } = useAuth();
  const { preferences } = usePreferences();
  const [workout, setWorkout] = useState<WorkoutTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentExercise, setCurrentExercise] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [completedExercises, setCompletedExercises] = useState<Exercise[]>([]);
  const [isResting, setIsResting] = useState<boolean>(false);
  const [showCompletion, setShowCompletion] = useState<boolean>(false);
  const [workoutStreaks, setWorkoutStreaks] = useState<WorkoutLog[]>([]);
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [isExerciseComplete, setIsExerciseComplete] = useState<boolean>(false);
  const [alreadyCompletedToday, setAlreadyCompletedToday] =
    useState<boolean>(false);
  const [showReminder, setShowReminder] = useState<boolean>(false);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        if (!id) {
          setError("Invalid workout ID");
          setLoading(false);
          return;
        }

        // Try to fetch from workoutTemplates first
        let workoutDoc = await getDoc(doc(db, "workoutTemplates", id));

        // If not found in workoutTemplates, try workouts collection
        if (!workoutDoc.exists()) {
          workoutDoc = await getDoc(doc(db, "workouts", id));
        }

        if (workoutDoc.exists()) {
          const workoutData = workoutDoc.data() as WorkoutTemplate;
          setWorkout(workoutData);
          // Initialize timeLeft for the first exercise if it's time-based
          if (workoutData.exercises[0]?.type === "time") {
            setTimeLeft(workoutData.exercises[0].duration || 0);
          }

          // Check if already completed today
          await checkTodayWorkout(workoutData.title);
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

  const currentExerciseData = workout?.exercises[currentExercise];

  const checkTodayWorkout = async (workoutTitle: string) => {
    if (!currentUser) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const logsQuery = query(
        collection(db, "workoutLogs"),
        where("userId", "==", currentUser.uid),
        where("workoutName", "==", workoutTitle),
        where("completedAt", ">=", today.toISOString()),
        where("completedAt", "<", tomorrow.toISOString())
      );

      const logsSnapshot = await getDocs(logsQuery);
      if (!logsSnapshot.empty) {
        setAlreadyCompletedToday(true);
        setShowReminder(true);
      }
    } catch (error) {
      console.error("Error checking today's workout:", error);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && !isResting && currentExerciseData?.type === "time") {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsActive(false);
            handleExerciseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (isActive && isResting) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsActive(false);
            setIsResting(false);
            if (currentSet < (currentExerciseData?.sets || 0)) {
              setCurrentSet((prev) => prev + 1);
              if (currentExerciseData?.type === "time") {
                setTimeLeft(currentExerciseData.duration || 0);
              }
            } else {
              handleExerciseComplete();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, isResting, currentExerciseData, currentSet]);

  const handleExerciseComplete = async () => {
    if (!workout) return;

    if (currentSet < (currentExerciseData?.sets || 0)) {
      setCurrentSet((prev) => prev + 1);
      if (currentExerciseData?.type === "time") {
        setTimeLeft(currentExerciseData.duration || 0);
      }
      setIsActive(false);
      setIsResting(true);
      setTimeLeft(currentExerciseData?.restTime || 0);
    } else {
      const updatedCompletedExercises = [
        ...completedExercises,
        currentExerciseData,
      ].filter((exercise): exercise is Exercise => exercise !== undefined);
      setCompletedExercises(updatedCompletedExercises);

      if (currentExercise < workout.exercises.length - 1) {
        setCurrentExercise((prev) => prev + 1);
        setCurrentSet(1);
        if (workout.exercises[currentExercise + 1]?.type === "time") {
          setTimeLeft(workout.exercises[currentExercise + 1].duration || 0);
        }
        setIsActive(false);
        setIsResting(true);
        setTimeLeft(workout.exercises[currentExercise + 1]?.restTime || 0);
      } else {
        // Workout completed - save to database if not already completed today
        if (!alreadyCompletedToday && currentUser) {
          try {
            await addDoc(collection(db, "workoutLogs"), {
              userId: currentUser.uid,
              workoutName: workout.title,
              completedAt: new Date().toISOString(),
              duration: workout.duration,
              exercises: updatedCompletedExercises,
            });
          } catch (error) {
            console.error("Error saving workout completion:", error);
          }
        }
        setShowCompletion(true);
      }
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  if (showCompletion) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-4">Workout Completed!</h2>
          <p className="text-gray-600 mb-6">
            {alreadyCompletedToday
              ? "Great practice session! This was a repeat workout, so it wasn't recorded as a new completion."
              : "Great job! You've completed the workout. Keep up the good work!"}
          </p>
          <Link href="/workouts" className="btn-primary block w-full">
            Return to Workouts
          </Link>
        </div>
      </div>
    );
  }

  if (showReminder) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-4xl mb-4">💪</div>
          <h2 className="text-xl font-bold mb-4">Already Completed Today!</h2>
          <p className="text-gray-600 mb-6">
            You've already completed this workout today. You can practice it
            again, but it won't be recorded as another completion for tracking
            purposes.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowReminder(false)}
              className="flex-1 btn-primary"
            >
              Continue Practice
            </button>
            <Link href="/workouts" className="flex-1 btn-secondary">
              Go Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
    <ProtectedRoute>
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
                Set {currentSet} of {currentExerciseData?.sets}
              </div>
            </div>

            {!isResting ? (
              <>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">
                    {currentExerciseData?.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Sets</div>
                      <div className="text-xl font-semibold">
                        {currentExerciseData?.sets}
                      </div>
                    </div>
                    {currentExerciseData?.type === "reps" ? (
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
                        {currentExerciseData?.restTime}s
                      </div>
                    </div>
                  </div>
                  {currentExerciseData?.notes && (
                    <p className="text-gray-600">{currentExerciseData.notes}</p>
                  )}
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={toggleTimer}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {isActive ? (
                      <>
                        <FaPause />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <FaPlay />
                        <span>Start</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleExerciseComplete}
                    className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                  >
                    <FaCheck />
                    <span>Complete</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Rest Time</h3>
                <div className="text-4xl font-bold mb-4">{timeLeft}s</div>
                <button
                  onClick={toggleTimer}
                  className="btn-primary flex items-center space-x-2 mx-auto"
                >
                  {isActive ? (
                    <>
                      <FaPause />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <FaPlay />
                      <span>Start</span>
                    </>
                  )}
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
}

// Force static rendering for Firebase Spark plan
export const dynamic = "force-static";
