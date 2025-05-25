"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import {
  FaDumbbell,
  FaChartLine,
  FaUsers,
  FaCalendarAlt,
} from "react-icons/fa";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();

  useEffect(() => {
    // Only redirect if it's the initial visit (no 'visited' parameter)
    if (currentUser && searchParams && !searchParams.get("visited")) {
      router.push("/dashboard");
    }
  }, [currentUser, router, searchParams]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-secondary to-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Transform Your Body, Transform Your Life
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-100">
              Track your workouts, set goals, and achieve your fitness dreams
            </p>
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-primary px-8 py-4 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all"
              >
                Start Your Journey
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary mb-4">
              Why Choose FitTrack?
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to reach your fitness goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FaDumbbell className="h-12 w-12 text-primary" />,
                title: "Custom Workouts",
                description:
                  "Personalized workout plans tailored to your goals",
              },
              {
                icon: <FaChartLine className="h-12 w-12 text-primary" />,
                title: "Progress Tracking",
                description: "Monitor your progress with detailed analytics",
              },
              {
                icon: <FaUsers className="h-12 w-12 text-primary" />,
                title: "Community Support",
                description: "Connect with like-minded fitness enthusiasts",
              },
              {
                icon: <FaCalendarAlt className="h-12 w-12 text-primary" />,
                title: "Workout Scheduling",
                description: "Plan and organize your fitness routine",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-secondary mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-secondary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-8">
            Ready to Start Your Fitness Journey?
          </h2>
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all"
            >
              Get Started Now
            </motion.button>
          </Link>
        </div>
      </section>
    </div>
  );
}
