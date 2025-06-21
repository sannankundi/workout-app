"use client";

import { motion } from "framer-motion";
import { FaHeart, FaCode, FaUsers } from "react-icons/fa";
import Link from "next/link";

// Define TypeScript interface for value items
interface Value {
  icon: JSX.Element;
  title: string;
  description: string;
}

const About = () => {
  const values: Value[] = [
    {
      icon: <FaHeart className="h-8 w-8 text-primary" />,
      title: "Our Mission",
      description:
        "To empower individuals to achieve their fitness goals through technology and community support.",
    },
    {
      icon: <FaCode className="h-8 w-8 text-primary" />,
      title: "Our Technology",
      description:
        "Built with modern web technologies to provide a seamless and responsive experience across all devices.",
    },
    {
      icon: <FaUsers className="h-8 w-8 text-primary" />,
      title: "Our Community",
      description:
        "A supportive network of fitness enthusiasts helping each other stay motivated and achieve their goals.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About FitTrack
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your personal fitness companion designed to help you achieve your
            health and fitness goals through technology and community support.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-lg p-6 text-center"
            >
              <div className="flex justify-center mb-4">{value.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {value.title}
              </h3>
              <p className="text-gray-600">{value.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-8 mb-16"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
          <p className="text-gray-600 mb-4">
            FitTrack was born from a simple idea: making fitness tracking
            accessible and enjoyable for everyone. We noticed that many fitness
            apps were either too complex or too basic, leaving users frustrated
            and unmotivated.
          </p>
          <p className="text-gray-600 mb-4">
            Our team of fitness enthusiasts and developers came together to
            create a solution that combines powerful features with an intuitive
            interface. The result is FitTrack - a comprehensive fitness platform
            that helps users track their workouts, monitor their nutrition, and
            stay motivated through community support.
          </p>
          <p className="text-gray-600">
            Today, FitTrack continues to evolve with user feedback and the
            latest fitness trends, always staying true to our mission of making
            fitness tracking simple and effective for everyone.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Join Our Journey
          </h2>
          <p className="text-gray-600 mb-8">
            Be part of our growing community and start your fitness journey
            today
          </p>
          <Link href="/signup" className="btn-primary">
            Get Started
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
