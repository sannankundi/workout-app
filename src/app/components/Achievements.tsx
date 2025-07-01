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
    <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 rounded-2xl shadow-xl border border-orange-100 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-pink-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg dark:from-yellow-400 dark:via-pink-400 dark:to-orange-400">
          Achievements
        </h2>
        <Trophy className="h-6 w-6 text-yellow-500" />
      </div>
      <div className="space-y-4">
        {achievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`relative p-5 rounded-2xl border-2 transition-all overflow-hidden ${
              achievement.unlocked
                ? "bg-gradient-to-r from-green-200 via-yellow-100 to-pink-100 border-yellow-400 animate-glow"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-4 rounded-full text-3xl shadow-lg ${
                  achievement.unlocked
                    ? "bg-gradient-to-br from-yellow-200 via-green-200 to-pink-200 text-yellow-600 animate-bounce"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {achievement.unlocked ? (
                  <span className="inline-block animate-bounce">🎉</span>
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
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ease-out ${
                        achievement.unlocked
                          ? "bg-gradient-to-r from-green-400 via-yellow-300 to-pink-400 animate-pulse"
                          : "bg-blue-500"
                      }`}
                      style={{
                        width: `${
                          (achievement.progress / achievement.maxProgress) * 100
                        }%`,
                      }}
                    />
                  </div>
                  {achievement.unlocked && (
                    <span className="absolute top-2 right-4 text-2xl animate-bounce">
                      🎊
                    </span>
                  )}
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
