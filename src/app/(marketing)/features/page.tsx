"use client";

import { motion } from "framer-motion";
import {
  FaDumbbell,
  FaChartLine,
  FaAppleAlt,
  FaUserFriends,
} from "react-icons/fa";
import Link from "next/link";

// Define TypeScript interface for feature items
interface Feature {
  icon: JSX.Element;
  title: string;
  description: string;
}

const Features = () => {
  const features: Feature[] = [
    {
      icon: <FaDumbbell className="h-8 w-8 text-primary" />,
      title: "Workout Tracking",
      description:
        "Track your workouts, set goals, and monitor your progress with detailed analytics and insights.",
    },
    {
      icon: <FaChartLine className="h-8 w-8 text-primary" />,
      title: "Progress Analytics",
      description:
        "Visualize your fitness journey with comprehensive charts and progress tracking tools.",
    },
    {
      icon: <FaAppleAlt className="h-8 w-8 text-primary" />,
      title: "Nutrition Planning",
      description:
        "Plan your meals, track your nutrition, and maintain a balanced diet for optimal results.",
    },
    {
      icon: <FaUserFriends className="h-8 w-8 text-primary" />,
      title: "Community Support",
      description:
        "Connect with like-minded individuals, share your progress, and stay motivated together.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Your Fitness Journey
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Everything you need to achieve your fitness goals
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users who have transformed their lives with
            FitTrack
          </p>
          <Link href="/signup" className="btn-primary">
            Get Started
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Features;
