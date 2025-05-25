"use client";

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";
import {
  FaDumbbell,
  FaAppleAlt,
  FaChartLine,
  FaCalendarAlt,
  FaPlay,
  FaPlus,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";

// Define TypeScript interfaces
interface User {
  uid: string;
  email: string | null;
}

interface AuthContextType {
  currentUser: User | null;
}

interface Stat {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: string;
  trend: "up" | "down" | "neutral";
}

interface Activity {
  activity: string;
  time: string;
  type: "workout" | "nutrition" | "achievement";
  link: string;
}

interface UpcomingWorkout {
  name: string;
  time: string;
  duration: string;
  exercises: number;
}

const Dashboard = () => {
  const { currentUser } = useAuth() as AuthContextType;
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "week" | "month" | "year"
  >("week");

  const stats: Stat[] = [
    {
      title: "Workouts This Week",
      value: "3",
      icon: <FaDumbbell className="h-6 w-6 text-primary" />,
      change: "+1 from last week",
      trend: "up",
    },
    {
      title: "Calories Burned",
      value: "1,250",
      icon: <FaChartLine className="h-6 w-6 text-green-500" />,
      change: "+250 from last week",
      trend: "up",
    },
    {
      title: "Nutrition Goals",
      value: "85%",
      icon: <FaAppleAlt className="h-6 w-6 text-yellow-500" />,
      change: "On track",
      trend: "neutral",
    },
    {
      title: "Next Workout",
      value: "Tomorrow",
      icon: <FaCalendarAlt className="h-6 w-6 text-blue-500" />,
      change: "Upper Body",
      trend: "neutral",
    },
  ];

  const recentActivities: Activity[] = [
    {
      activity: "Completed Upper Body Workout",
      time: "2 hours ago",
      type: "workout",
      link: "/workouts",
    },
    {
      activity: "Logged Breakfast: Oatmeal with Fruits",
      time: "4 hours ago",
      type: "nutrition",
      link: "/nutrition",
    },
    {
      activity: "Set New Personal Best: Bench Press",
      time: "Yesterday",
      type: "achievement",
      link: "/workouts",
    },
  ];

  const upcomingWorkouts: UpcomingWorkout[] = [
    {
      name: "Upper Body Strength",
      time: "Tomorrow, 9:00 AM",
      duration: "45 min",
      exercises: 8,
    },
    {
      name: "Lower Body Power",
      time: "Thursday, 10:00 AM",
      duration: "50 min",
      exercises: 10,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {currentUser?.email?.split("@")[0] || "User"}!
              </h1>
              <p className="mt-1 text-gray-600">
                Here&apos;s an overview of your fitness journey
              </p>
            </div>
            <div className="flex space-x-2">
              {(["week", "month", "year"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    selectedTimeRange === range
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">
                      {stat.value}
                    </p>
                    <div className="mt-1 flex items-center text-sm">
                      {stat.trend === "up" ? (
                        <FaArrowUp className="text-green-500 mr-1" />
                      ) : stat.trend === "down" ? (
                        <FaArrowDown className="text-red-500 mr-1" />
                      ) : null}
                      <span className="text-gray-500">{stat.change}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-full">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Activity
                </h2>
                <Link
                  href="/workouts"
                  className="text-sm text-primary hover:text-opacity-90"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {recentActivities.map((item, index) => (
                  <Link
                    key={index}
                    href={item.link}
                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.activity}
                        </p>
                        <p className="text-sm text-gray-500">{item.time}</p>
                      </div>
                      <div
                        className={`p-2 rounded-full ${
                          item.type === "workout"
                            ? "bg-blue-100 text-blue-600"
                            : item.type === "nutrition"
                            ? "bg-green-100 text-green-600"
                            : "bg-purple-100 text-purple-600"
                        }`}
                      >
                        {item.type === "workout" ? (
                          <FaDumbbell className="h-4 w-4" />
                        ) : item.type === "nutrition" ? (
                          <FaAppleAlt className="h-4 w-4" />
                        ) : (
                          <FaChartLine className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Upcoming Workouts */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Workouts
                </h2>
                <Link
                  href="/workouts"
                  className="text-sm text-primary hover:text-opacity-90"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {upcomingWorkouts.map((workout, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {workout.name}
                        </p>
                        <p className="text-sm text-gray-500">{workout.time}</p>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span>{workout.duration}</span>
                          <span className="mx-2">•</span>
                          <span>{workout.exercises} exercises</span>
                        </div>
                      </div>
                      <button className="p-2 bg-primary text-white rounded-full hover:bg-opacity-90 transition-colors">
                        <FaPlay className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <Link
                  href="/workouts/create"
                  className="flex items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-primary"
                >
                  <FaPlus className="h-4 w-4 mr-2" />
                  Create New Workout
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
