"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
import { FaGoogle } from "react-icons/fa";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import {
  renderRecaptcha,
  resetRecaptcha,
  getRecaptchaResponse,
  clearRecaptchaWidget,
} from "../../utils/recaptcha";
import { initializeUserData } from "../../utils/initializeData";

// Define TypeScript interfaces
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  googleSignIn: () => Promise<{ user: User }>;
  currentUser: User | null;
}

interface UserProfile {
  email: string | null;
  name: string;
  height: string;
  weight: string;
  goal: string;
  activityLevel: string;
  notifications: {
    workoutReminders: boolean;
    nutritionTracking: boolean;
    progressUpdates: boolean;
    achievementAlerts: boolean;
    weeklyReports: boolean;
  };
  preferences: {
    measurementSystem: string;
    theme: string;
  };
  createdAt: string;
}

const Signup = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const recaptchaRef = useRef<number | null>(null);
  const hasRendered = useRef(false);
  const router = useRouter();
  const { googleSignIn } = useAuth() as AuthContextType;

  useEffect(() => {
    if (hasRendered.current) return;
    hasRendered.current = true;

    if (typeof window === "undefined") return;

    renderRecaptcha(
      "recaptcha-container",
      (token) => setRecaptchaToken(token),
      () => setRecaptchaToken("")
    )
      .then((id) => {
        recaptchaRef.current = id;
      })
      .catch((error) => {
        console.error("Error rendering reCAPTCHA:", error);
      });

    return () => {
      clearRecaptchaWidget();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification");
      return;
    }

    setLoading(true);

    try {
      // 1. Create the user account
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 2. Update the user's display name
      await updateProfile(user, { displayName: fullName });

      // 3. Create the user document
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name: fullName,
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
      } as UserProfile);

      // 4. Initialize user data
      console.log("Initializing user data...");
      const success = await initializeUserData(user.uid);
      if (!success) {
        console.error("Failed to initialize user data");
        // Continue anyway as the user is created
      }

      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Error during signup:", error);

      // Handle specific Firebase auth errors
      if (error instanceof Error) {
        const errorCode = (error as any).code;
        if (errorCode === "auth/email-already-in-use") {
          setError("This email is already registered. Please log in instead.");
        } else if (errorCode === "auth/weak-password") {
          setError("Password should be at least 6 characters long.");
        } else if (errorCode === "auth/invalid-email") {
          setError("Please enter a valid email address.");
        } else {
          setError("Failed to create an account. Please try again.");
        }
      } else {
        setError("Failed to create an account. Please try again.");
      }

      // Reset reCAPTCHA on error
      if (recaptchaRef.current !== null) {
        resetRecaptcha(recaptchaRef.current);
        setRecaptchaToken("");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");

      if (!recaptchaToken) {
        setError("Please complete the reCAPTCHA verification");
        return;
      }

      setLoading(true);
      const { user } = await googleSignIn();
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name: user.displayName || "",
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
      } as UserProfile);
      router.push("/dashboard");
    } catch (error: unknown) {
      setError("Failed to sign up with Google: " + (error as Error).message);
      // Reset reCAPTCHA on error
      if (recaptchaRef.current !== null) {
        resetRecaptcha(recaptchaRef.current);
        setRecaptchaToken("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline font-medium">{error}</span>
            {error.includes("already registered") && (
              <div className="mt-2">
                <Link
                  href="/login"
                  className="text-blue-700 hover:text-blue-900 underline font-medium"
                >
                  Click here to log in
                </Link>
              </div>
            )}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="full-name" className="sr-only">
                Full Name
              </label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-center">
            <div id="recaptcha-container" className="mb-4" />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FaGoogle className="h-5 w-5 text-red-500 mr-2" />
              Sign up with Google
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-opacity-90"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
