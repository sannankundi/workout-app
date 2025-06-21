import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  setDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
} from "date-fns";

export interface WorkoutSummary {
  id: string;
  userId: string;
  workoutName: string;
  completedAt: string;
  duration: number;
  exercises: Array<{
    name: string;
    sets: number;
    reps?: number;
    duration?: number;
  }>;
  type?: "scheduled" | "manual";
  source?: "workoutLogs" | "workoutSchedule";
}

export interface Activity {
  id: string;
  activity: string;
  time: string;
  type: "workout" | "nutrition" | "achievement";
  link: string;
  workoutType?: "scheduled" | "manual";
  source?: "workoutLogs" | "workoutSchedule";
}

export interface NutritionProgress {
  userId: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  water: number;
  nutritionGoals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    water: number;
  };
}

export interface DashboardData {
  weeklyWorkouts: WorkoutSummary[];
  totalCaloriesBurned: number;
  nutritionProgress: NutritionProgress;
  nextWorkout: {
    id: string;
    name: string;
    scheduledDate: string;
    duration: number;
  } | null;
}

export interface ScheduledWorkout {
  documentId: string;
  workoutId: string;
  workoutName: string;
  scheduledDate: string;
  duration: number;
  exercises: any[];
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const getRecentActivities = async (
  userId: string
): Promise<Activity[]> => {
  try {
    // Get workout logs
    const logsQuery = query(
      collection(db, "workoutLogs"),
      where("userId", "==", userId),
      where("completed", "==", true),
      orderBy("completedAt", "desc"),
      limit(10)
    );
    const logsSnapshot = await getDocs(logsQuery);
    const workoutLogs = logsSnapshot.docs.map((doc) => ({
      id: doc.id,
      activity: `Completed ${doc.data().workoutName}`,
      time: format(new Date(doc.data().completedAt), "MMM d, h:mm a"),
      type: "workout" as const,
      link: "/workouts",
      workoutType: "manual" as const,
      source: "workoutLogs" as const,
    }));

    // Get scheduled workouts
    const scheduledQuery = query(
      collection(db, "workoutSchedule"),
      where("userId", "==", userId),
      where("completed", "==", true),
      orderBy("completedAt", "desc"),
      limit(10)
    );
    const scheduledSnapshot = await getDocs(scheduledQuery);
    const scheduledWorkouts = scheduledSnapshot.docs.map((doc) => ({
      id: doc.id,
      activity: `Completed ${doc.data().workoutName}`,
      time: format(new Date(doc.data().completedAt), "MMM d, h:mm a"),
      type: "workout" as const,
      link: "/workouts",
      workoutType: "scheduled" as const,
      source: "workoutSchedule" as const,
    }));

    // Combine and sort all activities
    const allActivities = [...workoutLogs, ...scheduledWorkouts].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );

    return allActivities;
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return [];
  }
};

export const getWorkoutsByTimeRange = async (
  userId: string,
  timeRange: "week" | "month" | "year"
): Promise<WorkoutSummary[]> => {
  try {
    // Get time range boundaries
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (timeRange) {
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "year":
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
    }

    // Get workout logs
    const logsQuery = query(
      collection(db, "workoutLogs"),
      where("userId", "==", userId)
    );
    const logsSnapshot = await getDocs(logsQuery);
    const workoutLogs = logsSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          type: "manual",
          source: "workoutLogs",
        } as WorkoutSummary)
    );

    // Get scheduled workouts
    const scheduledQuery = query(
      collection(db, "workoutSchedule"),
      where("userId", "==", userId),
      where("completed", "==", true)
    );
    const scheduledSnapshot = await getDocs(scheduledQuery);
    const scheduledWorkouts = scheduledSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          type: "scheduled",
          source: "workoutSchedule",
        } as WorkoutSummary)
    );

    // Combine and filter workouts
    const allWorkouts = [...workoutLogs, ...scheduledWorkouts]
      .filter((workout) => {
        const workoutDate = new Date(workout.completedAt);
        return workoutDate >= startDate && workoutDate <= endDate;
      })
      .sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );

    return allWorkouts;
  } catch (error) {
    console.error("Error fetching workouts by time range:", error);
    return [];
  }
};

export const getNutritionProgress = async (
  userId: string
): Promise<NutritionProgress> => {
  // Default goals
  const defaultGoals = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fats: 70,
    water: 8,
  };

  try {
    // console.log("Fetching nutrition data for user:", userId);
    const today = new Date().toISOString().split("T")[0];

    // Get nutrition data from userGoals collection
    const goalsQuery = query(
      collection(db, "userGoals"),
      where("userId", "==", userId)
    );
    const goalsSnapshot = await getDocs(goalsQuery);
    const userData = goalsSnapshot.docs[0]?.data();

    // Get today's nutrition log
    const logQuery = query(
      collection(db, "nutritionLogs"),
      where("userId", "==", userId),
      where("date", "==", today)
    );
    const logSnapshot = await getDocs(logQuery);
    const todayLog = logSnapshot.docs[0]?.data();

    // Handle different nutrition goals structures
    let nutritionGoals = defaultGoals;
    if (userData?.nutritionGoals) {
      nutritionGoals = {
        calories:
          userData.nutritionGoals.calories ||
          userData.nutritionGoals.dailyCalories ||
          defaultGoals.calories,
        protein:
          userData.nutritionGoals.protein ||
          userData.nutritionGoals.proteinIntake ||
          defaultGoals.protein,
        carbs: userData.nutritionGoals.carbs || defaultGoals.carbs,
        fats: userData.nutritionGoals.fats || defaultGoals.fats,
        water:
          userData.nutritionGoals.water ||
          userData.nutritionGoals.waterIntake ||
          defaultGoals.water,
      };
    }

    return {
      userId,
      calories: todayLog?.calories || 0,
      protein: todayLog?.protein || 0,
      carbs: todayLog?.carbs || 0,
      fats: todayLog?.fats || 0,
      water: todayLog?.water || 0,
      nutritionGoals,
    };
  } catch (error) {
    console.error("Error fetching nutrition data:", error);
    return {
      userId,
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      water: 0,
      nutritionGoals: defaultGoals,
    };
  }
};

export const getNextWorkout = async (userId: string) => {
  try {
    const scheduledWorkoutsQuery = query(
      collection(db, "scheduledWorkouts"),
      where("userId", "==", userId),
      where("completed", "==", false)
    );

    const snapshot = await getDocs(scheduledWorkoutsQuery);
    const workouts = snapshot.docs.map((doc) => ({
      ...doc.data(),
      documentId: doc.id,
    })) as ScheduledWorkout[];

    const futureWorkouts = workouts
      .filter((workout) => new Date(workout.scheduledDate) >= new Date())
      .sort(
        (a, b) =>
          new Date(a.scheduledDate).getTime() -
          new Date(b.scheduledDate).getTime()
      );

    if (futureWorkouts.length === 0) return null;

    const nextWorkout = futureWorkouts[0];
    return {
      id: nextWorkout.documentId,
      name: nextWorkout.workoutName,
      scheduledDate: nextWorkout.scheduledDate,
      duration: nextWorkout.duration,
      exercises: nextWorkout.exercises?.length || 0,
    };
  } catch (error) {
    console.error("Error getting next workout:", error);
    return null;
  }
};

export const calculateCaloriesBurned = (workouts: WorkoutSummary[]): number => {
  return workouts.reduce((total, workout) => {
    const baseCaloriesPerMinute = 7;
    const exerciseMultiplier = 1 + workout.exercises.length * 0.1;
    return (
      total + workout.duration * baseCaloriesPerMinute * exerciseMultiplier
    );
  }, 0);
};
