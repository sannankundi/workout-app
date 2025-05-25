"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { v4 as uuidv4 } from "uuid";
import ProtectedRoute from "../../components/ProtectedRoute";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps?: number;
  duration?: number;
  restTime: number;
  type: "reps" | "time";
  notes: string;
}

// Predefined exercises
const PREDEFINED_EXERCISES: Exercise[] = [
  // Reps-based exercises
  {
    id: "pushups",
    name: "Push-ups",
    sets: 3,
    reps: 10,
    restTime: 60,
    type: "reps",
    notes:
      "Start in a plank position with hands slightly wider than shoulders. Lower your body until your chest nearly touches the floor, keeping your core tight and elbows at 45 degrees. Push back up to starting position.",
  },
  {
    id: "pullups",
    name: "Pull-ups",
    sets: 3,
    reps: 8,
    restTime: 90,
    type: "reps",
    notes:
      "Hang from a bar with hands slightly wider than shoulders, palms facing away. Pull your body up until your chin is over the bar, then lower with control. Keep your core engaged throughout.",
  },
  {
    id: "squats",
    name: "Squats",
    sets: 3,
    reps: 15,
    restTime: 60,
    type: "reps",
    notes:
      "Stand with feet shoulder-width apart. Lower your body by bending knees and pushing hips back, as if sitting in a chair. Keep chest up and knees aligned with toes. Return to standing position.",
  },
  {
    id: "lunges",
    name: "Lunges",
    sets: 3,
    reps: 12,
    restTime: 60,
    type: "reps",
    notes:
      "Step forward with one leg and lower until both knees are at 90 degrees. Front knee should be above ankle, back knee hovering above ground. Push back to starting position and alternate legs.",
  },
  {
    id: "dips",
    name: "Dips",
    sets: 3,
    reps: 10,
    restTime: 60,
    type: "reps",
    notes:
      "Support yourself on parallel bars or a sturdy surface. Lower your body by bending elbows, keeping them close to your body. Push back up to starting position, maintaining straight posture.",
  },
  {
    id: "burpees",
    name: "Burpees",
    sets: 3,
    reps: 10,
    restTime: 90,
    type: "reps",
    notes:
      "Start standing, drop into a squat position, kick feet back into plank, do a push-up, jump feet back to squat, and jump up with arms overhead. Land softly and repeat.",
  },
  {
    id: "mountain-climbers",
    name: "Mountain Climbers",
    sets: 3,
    reps: 20,
    restTime: 60,
    type: "reps",
    notes:
      "Start in plank position. Alternately bring knees toward chest in a running motion. Keep hips low and core engaged throughout the movement.",
  },
  {
    id: "jumping-jacks",
    name: "Jumping Jacks",
    sets: 3,
    reps: 30,
    restTime: 30,
    type: "reps",
    notes:
      "Start standing with arms at sides. Jump feet apart while raising arms overhead. Jump back to starting position. Land softly and maintain rhythm.",
  },
  {
    id: "sit-ups",
    name: "Sit-ups",
    sets: 3,
    reps: 15,
    restTime: 60,
    type: "reps",
    notes:
      "Lie on back with knees bent, feet flat. Place hands behind head, elbows out. Curl upper body toward knees, then lower back down with control.",
  },
  {
    id: "glute-bridges",
    name: "Glute Bridges",
    sets: 3,
    reps: 15,
    restTime: 45,
    type: "reps",
    notes:
      "Lie on back with knees bent, feet flat. Lift hips toward ceiling, squeezing glutes. Hold briefly at top, then lower with control.",
  },
  {
    id: "russian-twists",
    name: "Russian Twists",
    sets: 3,
    reps: 20,
    restTime: 45,
    type: "reps",
    notes:
      "Sit on floor with knees bent, feet lifted. Lean back slightly, rotate torso side to side, touching floor beside hips. Keep core engaged throughout.",
  },
  {
    id: "bicycle-crunches",
    name: "Bicycle Crunches",
    sets: 3,
    reps: 20,
    restTime: 45,
    type: "reps",
    notes:
      "Lie on back, hands behind head. Bring right knee to chest while rotating left elbow to meet it. Alternate sides in a pedaling motion.",
  },
  // Time-based exercises
  {
    id: "plank",
    name: "Plank",
    sets: 3,
    duration: 30,
    restTime: 60,
    type: "time",
    notes:
      "Hold push-up position with forearms on ground. Keep body straight from head to heels, core tight, and breathe steadily. Focus on maintaining proper form.",
  },
  {
    id: "wall-sit",
    name: "Wall Sit",
    sets: 3,
    duration: 45,
    restTime: 60,
    type: "time",
    notes:
      "Stand with back against wall, feet shoulder-width apart. Slide down until knees are at 90 degrees. Hold position, keeping back flat against wall.",
  },
  {
    id: "side-plank",
    name: "Side Plank",
    sets: 3,
    duration: 30,
    restTime: 45,
    type: "time",
    notes:
      "Lie on side, prop up on forearm. Stack feet and lift hips, creating straight line from head to feet. Keep core engaged and hips lifted.",
  },
  {
    id: "superman-hold",
    name: "Superman Hold",
    sets: 3,
    duration: 30,
    restTime: 45,
    type: "time",
    notes:
      "Lie face down, arms extended overhead. Lift arms, chest, and legs off ground. Hold position, engaging back muscles. Keep neck neutral.",
  },
  {
    id: "bear-crawl",
    name: "Bear Crawl",
    sets: 3,
    duration: 45,
    restTime: 60,
    type: "time",
    notes:
      "Start on hands and knees. Lift knees slightly off ground. Move opposite hand and foot forward, maintaining low position. Keep core tight throughout.",
  },
  {
    id: "dead-bug",
    name: "Dead Bug",
    sets: 3,
    duration: 30,
    restTime: 45,
    type: "time",
    notes:
      "Lie on back, arms extended toward ceiling, knees bent at 90 degrees. Slowly lower opposite arm and leg toward ground while keeping core engaged.",
  },
  {
    id: "bird-dog",
    name: "Bird Dog",
    sets: 3,
    duration: 30,
    restTime: 45,
    type: "time",
    notes:
      "Start on hands and knees. Extend opposite arm and leg, keeping them parallel to ground. Hold position, maintaining balance and core stability.",
  },
  {
    id: "hollow-hold",
    name: "Hollow Hold",
    sets: 3,
    duration: 30,
    restTime: 45,
    type: "time",
    notes:
      "Lie on back, arms extended overhead. Lift arms, shoulders, and legs off ground, creating a slight curve. Hold position, engaging core throughout.",
  },
  {
    id: "reverse-plank",
    name: "Reverse Plank",
    sets: 3,
    duration: 30,
    restTime: 45,
    type: "time",
    notes:
      "Sit on ground, legs extended. Place hands behind hips, fingers pointing toward feet. Lift hips, creating straight line from head to heels.",
  },
];

export default function NewWorkout() {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [difficulty, setDifficulty] = useState("beginner");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    console.log("Auth state:", { currentUser, authLoading });
    setIsClient(true);
  }, [currentUser, authLoading]);

  const filteredExercises = PREDEFINED_EXERCISES.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addExercise = (exercise?: Exercise) => {
    if (!isClient) return; // Don't add exercises during server-side rendering

    const newExercise: Exercise = exercise
      ? {
          ...exercise,
          id: uuidv4(),
          sets: exercise.sets || 3,
          reps: exercise.type === "reps" ? exercise.reps || 10 : undefined,
          duration:
            exercise.type === "time" ? exercise.duration || 30 : undefined,
          restTime: exercise.restTime || 60,
          notes: exercise.notes || "",
          type: exercise.type || "reps",
        }
      : {
          id: uuidv4(),
          name: "",
          sets: 3,
          reps: 10,
          duration: undefined,
          restTime: 60,
          type: "reps",
          notes: "",
        };
    setExercises([...exercises, newExercise]);
    setShowExerciseList(false);
    setSearchTerm("");
  };

  const updateExercise = (id: string, field: keyof Exercise, value: any) => {
    setExercises(
      exercises.map((exercise) =>
        exercise.id === id ? { ...exercise, [field]: value } : exercise
      )
    );
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((exercise) => exercise.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      const workoutData = {
        title,
        description,
        duration,
        difficulty,
        exercises,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(
        collection(db, "workoutTemplates"),
        workoutData
      );
      router.push(`/workouts/${docRef.id}`);
    } catch (error) {
      console.error("Error creating workout:", error);
      alert("Failed to create workout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Create New Workout</h1>
          {isClient ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    required
                    min="1"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Exercises</h2>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowExerciseList(true)}
                      className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      Choose Exercise
                    </button>
                    <button
                      type="button"
                      onClick={() => addExercise()}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Custom Exercise
                    </button>
                  </div>
                </div>

                {showExerciseList && (
                  <div className="mb-4 p-4 border rounded-lg bg-white shadow-sm">
                    <div className="mb-4">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search exercises..."
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {filteredExercises.map((exercise) => (
                        <button
                          key={exercise.id}
                          type="button"
                          onClick={() => addExercise(exercise)}
                          className="text-left p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <div className="font-medium">{exercise.name}</div>
                          <div className="text-sm text-gray-500">
                            {exercise.type === "reps"
                              ? `${exercise.sets} sets × ${exercise.reps} reps`
                              : `${exercise.sets} sets × ${exercise.duration}s`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {exercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) =>
                            updateExercise(exercise.id, "name", e.target.value)
                          }
                          placeholder="Exercise name"
                          required
                          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary mr-4"
                        />
                        <button
                          type="button"
                          onClick={() => removeExercise(exercise.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sets
                          </label>
                          <input
                            type="number"
                            value={exercise.sets}
                            onChange={(e) =>
                              updateExercise(
                                exercise.id,
                                "sets",
                                Number(e.target.value)
                              )
                            }
                            required
                            min="1"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type
                          </label>
                          <select
                            value={exercise.type}
                            onChange={(e) =>
                              updateExercise(
                                exercise.id,
                                "type",
                                e.target.value as "reps" | "time"
                              )
                            }
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          >
                            <option value="reps">Reps</option>
                            <option value="time">Time</option>
                          </select>
                        </div>
                      </div>

                      {exercise.type === "reps" ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reps
                          </label>
                          <input
                            type="number"
                            value={exercise.reps || ""}
                            onChange={(e) =>
                              updateExercise(
                                exercise.id,
                                "reps",
                                Number(e.target.value)
                              )
                            }
                            required
                            min="1"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration (seconds)
                          </label>
                          <input
                            type="number"
                            value={exercise.duration || ""}
                            onChange={(e) =>
                              updateExercise(
                                exercise.id,
                                "duration",
                                Number(e.target.value)
                              )
                            }
                            required
                            min="1"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rest Time (seconds)
                        </label>
                        <input
                          type="number"
                          value={exercise.restTime}
                          onChange={(e) =>
                            updateExercise(
                              exercise.id,
                              "restTime",
                              Number(e.target.value)
                            )
                          }
                          required
                          min="0"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          value={exercise.notes}
                          onChange={(e) =>
                            updateExercise(exercise.id, "notes", e.target.value)
                          }
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Workout"}
                </button>
              </div>
            </form>
          ) : (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="space-y-6">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
