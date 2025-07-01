"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import {
  FaUser,
  FaLock,
  FaBell,
  FaCog,
  FaExclamationTriangle,
  FaTrophy,
} from "react-icons/fa";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User,
  deleteUser,
  signOut,
} from "firebase/auth";
import {
  doc,
  updateDoc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { useRouter } from "next/navigation";
import { deleteUserData } from "../utils/initializeData";
import {
  getWorkoutsByTimeRange,
  calculateCaloriesBurned,
  getNutritionProgress,
} from "../utils/dashboardUtils";

// Define TypeScript interfaces
interface AuthContextType {
  currentUser: User | null;
}

interface Preferences {
  measurementSystem: "metric" | "imperial";
  theme: "light" | "dark" | "system";
}

interface PreferencesContextType {
  preferences: Preferences;
  updatePreferences: (newPreferences: Preferences) => Promise<boolean>;
}

interface NotificationSettings {
  workoutReminders: boolean;
  nutritionTracking: boolean;
  progressUpdates: boolean;
  achievementAlerts: boolean;
  weeklyReports: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  height_cm: string;
  height_in: string;
  weight_kg: string;
  weight_lbs: string;
  goal: string;
  activityLevel: string;
  notifications: NotificationSettings;
  preferences: Preferences;
  createdAt: string;
}

interface FormData extends UserProfile {
  height: string;
  weight: string;
}

interface SecurityData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt?: string;
}

// Firebase Auth Error type
interface FirebaseAuthError extends Error {
  code?: string;
}

const Profile = () => {
  const { currentUser } = useAuth() as AuthContextType;
  const { preferences, updatePreferences } =
    usePreferences() as PreferencesContextType;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "personal" | "security" | "notifications" | "preferences" | "achievements"
  >("personal");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    height: "",
    weight: "",
    height_cm: "",
    height_in: "",
    weight_kg: "",
    weight_lbs: "",
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
    createdAt: "",
  });
  const [securityData, setSecurityData] = useState<SecurityData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      workoutReminders: true,
      nutritionTracking: true,
      progressUpdates: true,
      achievementAlerts: true,
      weeklyReports: true,
    });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;

          // Set display values based on current measurement system
          const displayHeight =
            preferences.measurementSystem === "metric"
              ? userData.height_cm
              : userData.height_in;
          const displayWeight =
            preferences.measurementSystem === "metric"
              ? userData.weight_kg
              : userData.weight_lbs;

          setFormData({
            ...userData,
            name: userData.name || "",
            email: userData.email || currentUser.email || "",
            height: displayHeight || "",
            weight: displayWeight || "",
          });
          setNotificationSettings(userData.notifications);
        } else {
          // Create user document if it doesn't exist
          const newUserData: UserProfile = {
            email: currentUser.email || "",
            name: "", // Will be set during signup or profile update
            height_cm: "",
            height_in: "",
            weight_kg: "",
            weight_lbs: "",
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
          };
          await setDoc(doc(db, "users", currentUser.uid), newUserData);
          setFormData({
            ...newUserData,
            height: "",
            weight: "",
          });
          setNotificationSettings(newUserData.notifications);
        }
      } catch (error: unknown) {
        setError("Failed to load user data: " + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, preferences.measurementSystem]);

  useEffect(() => {
    if (activeTab === "achievements") {
      fetchAchievements();
    }
  }, [activeTab, currentUser]);

  // Refresh achievements when user navigates to profile page
  useEffect(() => {
    if (currentUser) {
      fetchAchievements();
    }
  }, [currentUser]);

  const fetchAchievements = async () => {
    if (!currentUser) return;
    setAchievementsLoading(true);
    try {
      // Use the same function as dashboard to get workouts for the current week
      const workouts = await getWorkoutsByTimeRange(currentUser.uid, "week");

      // Calculate total calories burned using the same function as dashboard
      const totalCaloriesBurned = calculateCaloriesBurned(workouts);

      // Get nutrition progress using the same function as dashboard
      const nutritionProgress = await getNutritionProgress(currentUser.uid);
      const nutritionPercentage =
        nutritionProgress && nutritionProgress.nutritionGoals?.calories
          ? Math.round(
              (nutritionProgress.calories /
                nutritionProgress.nutritionGoals.calories) *
                100
            )
          : 0;

      // Calculate achievements using the exact same logic as dashboard
      const workoutStreak = calculateWorkoutStreak(workouts);
      const totalWorkouts = workouts.length;
      const caloriesGoal = totalCaloriesBurned >= 2000;

      const allAchievements: Achievement[] = [
        {
          id: "first-workout",
          title: "First Steps",
          description: "Complete your first workout",
          icon: <FaTrophy className="h-6 w-6" />,
          unlocked: totalWorkouts > 0,
          progress: Math.min(totalWorkouts, 1),
          maxProgress: 1,
          unlockedAt: totalWorkouts > 0 ? workouts[0]?.completedAt : undefined,
        },
        {
          id: "workout-streak",
          title: "Consistency King",
          description: "Complete 3 workouts in a row",
          icon: <FaTrophy className="h-6 w-6" />,
          unlocked: workoutStreak >= 3,
          progress: Math.min(workoutStreak, 3),
          maxProgress: 3,
        },
        {
          id: "calories-burner",
          title: "Calorie Crusher",
          description: "Burn 2000 calories in a week",
          icon: <FaTrophy className="h-6 w-6" />,
          unlocked: caloriesGoal,
          progress: Math.min(totalCaloriesBurned, 2000),
          maxProgress: 2000,
        },
        {
          id: "nutrition-master",
          title: "Nutrition Master",
          description: "Meet your nutrition goals for 3 days",
          icon: <FaTrophy className="h-6 w-6" />,
          unlocked: nutritionPercentage >= 100,
          progress: Math.min(nutritionPercentage, 100),
          maxProgress: 100,
        },
        {
          id: "workout-warrior",
          title: "Workout Warrior",
          description: "Complete 10 workouts",
          icon: <FaTrophy className="h-6 w-6" />,
          unlocked: totalWorkouts >= 10,
          progress: Math.min(totalWorkouts, 10),
          maxProgress: 10,
        },
        {
          id: "streak-master",
          title: "Streak Master",
          description: "Complete 7 workouts in a row",
          icon: <FaTrophy className="h-6 w-6" />,
          unlocked: workoutStreak >= 7,
          progress: Math.min(workoutStreak, 7),
          maxProgress: 7,
        },
      ];

      setAchievements(allAchievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setAchievementsLoading(false);
    }
  };

  // Helper function to calculate workout streak
  const calculateWorkoutStreak = (workouts: any[]) => {
    if (workouts.length === 0) return 0;

    const sortedWorkouts = workouts.sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedWorkouts.length; i++) {
      const workoutDate = new Date(sortedWorkouts[i].completedAt);
      workoutDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "height" || name === "weight") {
      const numValue = parseFloat(value) || 0;

      if (name === "height") {
        const height_cm =
          preferences.measurementSystem === "metric"
            ? numValue
            : numValue * 2.54;
        const height_in =
          preferences.measurementSystem === "imperial"
            ? numValue
            : numValue / 2.54;

        setFormData((prev) => ({
          ...prev,
          height: value,
          height_cm: height_cm.toFixed(1),
          height_in: height_in.toFixed(1),
        }));
      } else {
        const weight_kg =
          preferences.measurementSystem === "metric"
            ? numValue
            : numValue / 2.20462;
        const weight_lbs =
          preferences.measurementSystem === "imperial"
            ? numValue
            : numValue * 2.20462;

        setFormData((prev) => ({
          ...prev,
          weight: value,
          weight_kg: weight_kg.toFixed(1),
          weight_lbs: weight_lbs.toFixed(1),
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNotificationChange = (setting: keyof NotificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handlePreferenceChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const newSystem = value as "metric" | "imperial";

    // Update displayed values when measurement system changes
    if (name === "measurementSystem") {
      setFormData((prev) => ({
        ...prev,
        height: newSystem === "metric" ? prev.height_cm : prev.height_in,
        weight: newSystem === "metric" ? prev.weight_kg : prev.weight_lbs,
      }));
    }

    const newPreferences: Preferences = {
      ...preferences,
      [name]: value,
    };

    try {
      await updatePreferences(newPreferences);
    } catch (error: unknown) {
      setError("Failed to update preferences: " + (error as Error).message);
    }
  };

  const handlePersonalInfoSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Update Firebase Auth profile
      if (currentUser && formData.name !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: formData.name });
      }

      // Ensure both metric and imperial values are saved
      const height_cm =
        formData.height_cm ||
        (formData.height_in
          ? (parseFloat(formData.height_in) * 2.54).toFixed(1)
          : "");
      const height_in =
        formData.height_in ||
        (formData.height_cm
          ? (parseFloat(formData.height_cm) / 2.54).toFixed(1)
          : "");
      const weight_kg =
        formData.weight_kg ||
        (formData.weight_lbs
          ? (parseFloat(formData.weight_lbs) / 2.20462).toFixed(1)
          : "");
      const weight_lbs =
        formData.weight_lbs ||
        (formData.weight_kg
          ? (parseFloat(formData.weight_kg) * 2.20462).toFixed(1)
          : "");

      // Update user data in Firestore
      await updateDoc(doc(db, "users", currentUser!.uid), {
        name: formData.name,
        height_cm,
        height_in,
        weight_kg,
        weight_lbs,
        goal: formData.goal,
        activityLevel: formData.activityLevel,
      });

      setSuccess("Profile updated successfully!");
    } catch (error: unknown) {
      setError("Failed to update profile: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (securityData.newPassword !== securityData.confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    try {
      if (!currentUser || !currentUser.email)
        throw new Error("User not authenticated");

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        securityData.currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, securityData.newPassword);

      setSuccess("Password updated successfully!");
      setSecurityData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: unknown) {
      setError("Failed to update password: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await updateDoc(doc(db, "users", currentUser!.uid), {
        notifications: notificationSettings,
      });
      setSuccess("Notification preferences updated successfully!");
    } catch (error: unknown) {
      setError(
        "Failed to update notification preferences: " + (error as Error).message
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const success = await updatePreferences(preferences);
      if (success) {
        setSuccess("Preferences updated successfully!");
      } else {
        setError("Failed to update preferences");
      }
    } catch (error: unknown) {
      setError("Failed to update preferences: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      // 1. Delete all user data from Firestore
      console.log("Starting data deletion process...");

      // Delete from each collection individually to better handle errors
      const collections = [
        "workoutLogs",
        "scheduledWorkouts",
        "nutritionLogs",
        "userGoals",
        "workoutSchedule",
        "users",
      ];

      for (const collectionName of collections) {
        try {
          console.log(`Deleting data from ${collectionName}...`);
          const collectionRef = collection(db, collectionName);
          const q = query(
            collectionRef,
            where("userId", "==", currentUser.uid)
          );
          const querySnapshot = await getDocs(q);

          const deletePromises = querySnapshot.docs.map((doc) =>
            deleteDoc(doc.ref)
          );
          await Promise.all(deletePromises);
          console.log(`Successfully deleted data from ${collectionName}`);
        } catch (error) {
          console.error(`Error deleting from ${collectionName}:`, error);
          // Continue with other collections even if one fails
        }
      }

      // 2. Delete the user account
      console.log("Deleting user account...");
      await deleteUser(currentUser);

      // 3. Sign out and redirect
      console.log("Signing out and redirecting...");
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error in delete process:", error);
      const authError = error as FirebaseAuthError;
      if (authError.code === "auth/requires-recent-login") {
        setDeleteError(
          "For security reasons, please log out and log back in before deleting your account."
        );
      } else {
        setDeleteError(
          `Failed to delete account: ${
            authError.message || "An unexpected error occurred"
          }`
        );
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-8">
        Please sign in to view your profile.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-pink-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg dark:from-yellow-400 dark:via-pink-400 dark:to-orange-400">
              Profile Settings
            </h1>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded relative">
              {success}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-lg">
            <nav className="-mb-px flex space-x-2 p-1 rounded-t-lg bg-transparent">
              {[
                { id: "personal", icon: <FaUser />, label: "Personal Info" },
                { id: "security", icon: <FaLock />, label: "Security" },
                {
                  id: "notifications",
                  icon: <FaBell />,
                  label: "Notifications",
                },
                { id: "preferences", icon: <FaCog />, label: "Preferences" },
                {
                  id: "achievements",
                  icon: <FaExclamationTriangle />,
                  label: "Achievements",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`whitespace-nowrap py-2 px-4 font-medium text-sm flex items-center transition-all
                    rounded-lg
                    ${
                      activeTab === tab.id
                        ? "bg-primary text-white shadow border-none"
                        : "bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 border-none"
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-xl border border-orange-100 dark:border-gray-700 p-6">
            <div className="p-6">
              {activeTab === "personal" && (
                <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Personal Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          disabled
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Height (
                          {preferences.measurementSystem === "metric"
                            ? "cm"
                            : "in"}
                          )
                        </label>
                        <input
                          type="number"
                          name="height"
                          value={formData.height}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          step="0.1"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Weight (
                          {preferences.measurementSystem === "metric"
                            ? "kg"
                            : "lbs"}
                          )
                        </label>
                        <input
                          type="number"
                          name="weight"
                          value={formData.weight}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          step="0.1"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Fitness Goals
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Primary Goal
                        </label>
                        <select
                          name="goal"
                          value={formData.goal}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="lose_weight">Lose Weight</option>
                          <option value="build_muscle">Build Muscle</option>
                          <option value="maintain">Maintain Weight</option>
                          <option value="improve_fitness">
                            Improve Fitness
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Activity Level
                        </label>
                        <select
                          name="activityLevel"
                          value={formData.activityLevel}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="sedentary">Sedentary</option>
                          <option value="light">Lightly Active</option>
                          <option value="moderate">Moderately Active</option>
                          <option value="very">Very Active</option>
                          <option value="extra">Extra Active</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "security" && (
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Security Settings
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={securityData.currentPassword}
                        onChange={handleSecurityChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={securityData.newPassword}
                        onChange={handleSecurityChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={securityData.confirmPassword}
                        onChange={handleSecurityChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary disabled:opacity-50"
                    >
                      {loading ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Notification Preferences
                  </h2>
                  <div className="space-y-4">
                    {Object.entries(notificationSettings).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <span className="text-gray-700 dark:text-gray-300">
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={() =>
                                handleNotificationChange(
                                  key as keyof NotificationSettings
                                )
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      )
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleNotificationSubmit}
                      disabled={loading}
                      className="btn-primary disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save Preferences"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "preferences" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    App Preferences
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Measurement System
                      </label>
                      <select
                        name="measurementSystem"
                        value={preferences.measurementSystem}
                        onChange={handlePreferenceChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="metric">Metric (kg, cm)</option>
                        <option value="imperial">Imperial (lb, in)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Theme
                      </label>
                      <select
                        name="theme"
                        value={preferences.theme}
                        onChange={handlePreferenceChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handlePreferenceSubmit}
                      disabled={loading}
                      className="btn-primary disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save Preferences"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "achievements" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Your Achievements
                    </h2>
                    <button
                      onClick={fetchAchievements}
                      disabled={achievementsLoading}
                      className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      {achievementsLoading ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>

                  {achievementsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {achievements.map((achievement) => (
                        <div
                          key={achievement.id}
                          className={`p-6 rounded-lg border-2 transition-all duration-300 ${
                            achievement.unlocked
                              ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-lg"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div
                              className={`p-3 rounded-full ${
                                achievement.unlocked
                                  ? "bg-yellow-100 text-yellow-600"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {achievement.icon}
                            </div>
                            {achievement.unlocked && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                                Unlocked
                              </span>
                            )}
                          </div>

                          <h3
                            className={`font-semibold text-lg mb-2 ${
                              achievement.unlocked
                                ? "text-gray-900"
                                : "text-gray-600"
                            }`}
                          >
                            {achievement.title}
                          </h3>

                          <p
                            className={`text-sm mb-4 ${
                              achievement.unlocked
                                ? "text-gray-700"
                                : "text-gray-500"
                            }`}
                          >
                            {achievement.description}
                          </p>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-medium">
                                {achievement.progress} /{" "}
                                {achievement.maxProgress}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  achievement.unlocked
                                    ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                                    : "bg-gray-300"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    (achievement.progress /
                                      achievement.maxProgress) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {achievement.unlocked && achievement.unlockedAt && (
                            <div className="mt-4 pt-4 border-t border-yellow-200">
                              <p className="text-xs text-yellow-700">
                                Unlocked on{" "}
                                {new Date(
                                  achievement.unlockedAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {!achievementsLoading && achievements.length === 0 && (
                    <div className="text-center py-8">
                      <FaTrophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">
                        No achievements found
                      </p>
                      <p className="text-sm text-gray-400">
                        Start working out to unlock achievements!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Deletion Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-red-600 mb-4">
              Danger Zone
            </h3>
            <p className="text-gray-600 mb-4">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold text-red-600 mb-4">
                Delete Account
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete your account? This action cannot
                be undone and all your data will be permanently deleted.
              </p>
              {deleteError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                  {deleteError}
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    "Delete Account"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
