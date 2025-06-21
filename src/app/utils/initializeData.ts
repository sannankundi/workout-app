import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

export const initializeUserData = async (userId: string): Promise<boolean> => {
  try {
    console.log("Starting data initialization for user:", userId);

    // 1. Initialize user document with default values
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      email: "",
      name: "",
      height: "",
      weight: "",
      goal: "lose_weight",
      activityLevel: "moderate",
      notifications: {
        workoutReminders: true,
        nutritionTracking: true,
        progressUpdates: true,
        achievementAlerts: true,
        weeklyReports: true,
      },
      preferences: {
        measurementSystem: "metric",
        theme: "light",
      },
      createdAt: new Date().toISOString(),
    });
    console.log("User document initialized");

    // 2. Initialize scheduledWorkouts with a default scheduled workout
    const scheduledWorkoutsRef = collection(db, "scheduledWorkouts");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await setDoc(doc(scheduledWorkoutsRef), {
      userId,
      workoutName: "Full Body Workout",
      scheduledDate: tomorrow.toISOString(),
      duration: 45,
      completed: false,
    });
    console.log("Scheduled workouts initialized");

    // 3. Initialize nutritionLogs with default goals and today's empty log
    const nutritionLogsRef = collection(db, "nutritionLogs");
    const today = new Date().toISOString().split("T")[0];
    await setDoc(doc(nutritionLogsRef), {
      userId,
      date: today,
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      water: 0,
      goals: {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fats: 70,
        water: 8,
      },
    });
    console.log("Nutrition logs initialized");

    // 4. Initialize userGoals with default goals
    const userGoalsRef = collection(db, "userGoals");
    await setDoc(doc(userGoalsRef), {
      userId,
      workoutGoals: {
        weeklyWorkouts: 3,
        workoutDuration: 45,
        strengthProgress: "moderate",
      },
      nutritionGoals: {
        dailyCalories: 2000,
        proteinIntake: 150,
        waterIntake: 8,
      },
      weightGoals: {
        targetWeight: 0,
        weeklyChange: 0.5,
        startDate: new Date().toISOString(),
      },
    });
    console.log("User goals initialized");

    // 5. Initialize workoutSchedule with a default weekly schedule
    const workoutScheduleRef = collection(db, "workoutSchedule");
    const scheduleDays = ["Monday", "Wednesday", "Friday"];
    for (const day of scheduleDays) {
      await setDoc(doc(workoutScheduleRef), {
        userId,
        day,
        workoutName: `${day} Workout`,
        duration: 45,
        exercises: [
          {
            name: "Warm-up",
            duration: 10,
          },
          {
            name: "Main Workout",
            duration: 30,
          },
          {
            name: "Cool-down",
            duration: 5,
          },
        ],
        completed: false,
      });
    }
    console.log("Workout schedule initialized");

    console.log("All data initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing user data:", error);
    return false;
  }
};

export const deleteUserData = async (userId: string): Promise<boolean> => {
  try {
    console.log("Starting data deletion for user:", userId);

    // Collections to clean up
    const collections = [
      "workoutLogs",
      "scheduledWorkouts",
      "nutritionLogs",
      "userGoals",
      "workoutSchedule",
      "users",
    ];

    // Delete documents from each collection
    for (const collectionName of collections) {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);
      console.log(`Deleted data from ${collectionName}`);
    }

    console.log("All user data deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting user data:", error);
    return false;
  }
};
