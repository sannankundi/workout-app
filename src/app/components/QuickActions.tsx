"use client";

import { motion } from "framer-motion";
import { Play, Calendar, Apple, TrendingUp } from "lucide-react";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

const QuickActions = ({ actions }: QuickActionsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <motion.button
          key={action.title}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 + index * 0.1 }}
          onClick={action.action}
          className={`relative ${
            action.color
          } text-white p-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-orange-400/40 group ${
            action.title === "Start Workout"
              ? "bg-gradient-to-r from-orange-500 via-pink-500 to-yellow-400 dark:from-yellow-500 dark:via-pink-500 dark:to-orange-400 animate-glow"
              : "bg-gradient-to-br from-orange-400 via-pink-400 to-yellow-300 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800"
          }`}
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <span className="text-3xl group-hover:animate-bounce text-white dark:text-yellow-100 drop-shadow-md">
              {action.icon}
            </span>
            <div>
              <h3 className="font-semibold text-base text-white dark:text-yellow-100 drop-shadow-md">
                {action.title}
              </h3>
              <p className="text-xs opacity-90 text-white dark:text-yellow-100 drop-shadow-md">
                {action.description}
              </p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default QuickActions;
