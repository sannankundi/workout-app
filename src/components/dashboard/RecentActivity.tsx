"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUp, Dumbbell, Plus } from "lucide-react";

interface RecentActivityProps {
  workouts: Array<{
    activity: string;
    time: string;
    link: string;
    workoutType?: string;
  }>;
}

export default function RecentActivity({ workouts }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        <Link
          href="/workouts"
          className="text-primary hover:text-primary-dark font-medium text-sm flex items-center gap-1"
        >
          View All
          <ArrowUp className="h-4 w-4 rotate-45" />
        </Link>
      </div>
      <div className="space-y-4">
        {workouts.length > 0 ? (
          workouts.slice(0, 5).map((item, index) => (
            <motion.div
              key={`activity-${item.activity}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Link
                href={item.link}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 border border-transparent hover:border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                      <Dumbbell className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.activity}
                      </p>
                      <p className="text-sm text-gray-500">{item.time}</p>
                      {item.workoutType === "scheduled" && (
                        <span className="inline-block mt-1 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          Scheduled
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowUp className="h-4 w-4 text-gray-400 rotate-45" />
                </div>
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8">
            <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No recent activities</p>
            <Link
              href="/workouts"
              className="btn-primary inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Start a Workout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
