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
          className={`${action.color} text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
        >
          <div className="flex flex-col items-center text-center space-y-2">
            {action.icon}
            <div>
              <h3 className="font-semibold text-sm">{action.title}</h3>
              <p className="text-xs opacity-90">{action.description}</p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default QuickActions;
