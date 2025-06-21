"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  CheckCircle,
  Dumbbell,
  Flame,
  Apple,
  TrendingUp,
} from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

interface AchievementsProps {
  achievements: Achievement[];
}

const Achievements = ({ achievements }: AchievementsProps) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
        <Trophy className="h-6 w-6 text-yellow-500" />
      </div>
      <div className="space-y-4">
        {achievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-lg border transition-all ${
              achievement.unlocked
                ? "bg-green-50 border-green-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  achievement.unlocked
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {achievement.unlocked ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  achievement.icon
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-gray-900">
                  {achievement.title}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {achievement.description}
                </p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>
                      {achievement.progress}/{achievement.maxProgress}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        achievement.unlocked ? "bg-green-500" : "bg-blue-500"
                      }`}
                      style={{
                        width: `${
                          (achievement.progress / achievement.maxProgress) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;
