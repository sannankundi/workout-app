"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
import { FaGoogle } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  renderRecaptcha,
  resetRecaptcha,
  getRecaptchaResponse,
  clearRecaptchaWidget,
} from "../../utils/recaptcha";

const Login = () => {
  const router = useRouter();
  const { login, googleSignIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const recaptchaRef = useRef<number | null>(null);
  const hasRendered = useRef(false);

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

  const handleSuccessfulLogin = () => {
    const redirectUrl = sessionStorage.getItem("redirectUrl") || "/dashboard";
    sessionStorage.removeItem("redirectUrl");
    router.replace(redirectUrl);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setError("");

      if (!recaptchaToken) {
        setError("Please complete the reCAPTCHA verification");
        return;
      }

      setLoading(true);
      await login(email, password);
      handleSuccessfulLogin();
    } catch (error) {
      if (error instanceof Error) {
        setError("Failed to sign in: " + error.message);
      } else {
        setError("Failed to sign in");
      }
      // Reset reCAPTCHA on error
      if (recaptchaRef.current !== null) {
        resetRecaptcha(recaptchaRef.current);
        setRecaptchaToken("");
      }
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    try {
      setError("");

      if (!recaptchaToken) {
        setError("Please complete the reCAPTCHA verification");
        return;
      }

      setLoading(true);
      await googleSignIn();
      handleSuccessfulLogin();
    } catch (error) {
      if (error instanceof Error) {
        setError("Failed to sign in with Google: " + error.message);
      } else {
        setError("Failed to sign in with Google");
      }
      // Reset reCAPTCHA on error
      if (recaptchaRef.current !== null) {
        resetRecaptcha(recaptchaRef.current);
        setRecaptchaToken("");
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
        </div>
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:border-red-700 dark:text-red-200"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm dark:bg-gray-700"
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
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm dark:bg-gray-700"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-center">
            <div id="recaptcha-container" className="mb-4" />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !recaptchaToken}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading || !recaptchaToken}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaGoogle className="h-5 w-5 text-red-500 mr-2" />
              Sign in with Google
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary hover:text-opacity-90"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
