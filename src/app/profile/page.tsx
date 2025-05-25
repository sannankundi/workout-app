"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { FaUser, FaLock, FaBell, FaCog } from "react-icons/fa";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User,
} from "firebase/auth";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

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

const Profile = () => {
  const { currentUser } = useAuth() as AuthContextType;
  const { preferences, updatePreferences } =
    usePreferences() as PreferencesContextType;
  const [activeTab, setActiveTab] = useState<
    "personal" | "security" | "notifications" | "preferences"
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
            height: displayHeight || "",
            weight: displayWeight || "",
          });
          setNotificationSettings(userData.notifications);
        } else {
          // Create user document if it doesn't exist
          const newUserData: UserProfile = {
            email: currentUser.email || "",
            name: currentUser.displayName || "",
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
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
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "personal", icon: <FaUser />, label: "Personal Info" },
                { id: "security", icon: <FaLock />, label: "Security" },
                {
                  id: "notifications",
                  icon: <FaBell />,
                  label: "Notifications",
                },
                { id: "preferences", icon: <FaCog />, label: "Preferences" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
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
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
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
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
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
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
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
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save Preferences"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
