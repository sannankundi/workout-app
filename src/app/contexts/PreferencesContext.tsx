"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

interface Preferences {
  measurementSystem: "metric" | "imperial";
  theme: "light" | "dark" | "system";
}

interface PreferencesContextType {
  preferences: Preferences;
  updatePreferences: (newPreferences: Partial<Preferences>) => Promise<boolean>;
  loading: boolean;
}

const defaultPreferences: Preferences = {
  measurementSystem: "metric",
  theme: "system",
};

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}

interface PreferencesProviderProps {
  children: ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const { currentUser } = useAuth();
  const [preferences, setPreferences] =
    useState<Preferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists() && userDoc.data().preferences) {
            setPreferences(userDoc.data().preferences as Preferences);
          }
        } catch (error) {
          console.error("Error fetching preferences:", error);
        }
      }
      setLoading(false);
    };

    fetchPreferences();
  }, [currentUser]);

  useEffect(() => {
    const applyTheme = () => {
      const root = window.document.documentElement;
      const isDark =
        preferences.theme === "dark" ||
        (preferences.theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    // Apply theme on mount and when preferences change
    applyTheme();

    // Listen for system theme changes if using system theme
    if (preferences.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [preferences.theme]);

  const updatePreferences = async (
    newPreferences: Partial<Preferences>
  ): Promise<boolean> => {
    if (currentUser) {
      try {
        const updatedPreferences = { ...preferences, ...newPreferences };
        await updateDoc(doc(db, "users", currentUser.uid), {
          preferences: updatedPreferences,
        });
        setPreferences(updatedPreferences);
        return true;
      } catch (error) {
        console.error("Error updating preferences:", error);
        return false;
      }
    }
    return false;
  };

  const value: PreferencesContextType = {
    preferences,
    updatePreferences,
    loading,
  };

  return React.createElement(PreferencesContext.Provider, { value }, children);
}
