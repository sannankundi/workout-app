"use client";

import { motion } from "framer-motion";
import { ArrowUp, ArrowDown } from "lucide-react";

interface Stat {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: string;
  trend: "up" | "down" | "neutral";
  color: string;
  bgColor: string;
}

interface DashboardStatsProps {
  stats: Stat[];
}

const DashboardStats = ({ stats }: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={`stat-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + index * 0.1 }}
          className="bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-xl p-7 hover:shadow-2xl transition-all duration-200 transform hover:scale-105 border border-orange-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-700 dark:text-yellow-200 mb-1 tracking-wide">
                {stat.title}
              </p>
              <p className="text-3xl font-extrabold bg-gradient-to-r from-orange-500 via-pink-500 to-yellow-400 bg-clip-text text-transparent dark:from-yellow-400 dark:via-pink-400 dark:to-orange-400 mb-2">
                {stat.value}
                {stat.trend === "up" && (
                  <span className="ml-2 text-yellow-400 animate-bounce">
                    🏆
                  </span>
                )}
              </p>
              <div className="flex items-center text-sm">
                {stat.trend === "up" ? (
                  <ArrowUp className="text-green-500 dark:text-green-300 mr-1 h-4 w-4" />
                ) : stat.trend === "down" ? (
                  <ArrowDown className="text-red-500 dark:text-red-300 mr-1 h-4 w-4" />
                ) : null}
                <span className="text-gray-500 dark:text-gray-300">
                  {stat.change}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-full bg-gradient-to-br from-orange-200 via-pink-200 to-yellow-100 dark:from-yellow-500 dark:via-pink-500 dark:to-orange-400 shadow-lg flex items-center justify-center">
              <span className="text-3xl text-orange-600 dark:text-yellow-100 drop-shadow-md">
                {stat.icon}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardStats;
