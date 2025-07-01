"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";

interface WorkoutData {
  period: string;
  workouts: number;
  calories: number;
  date: string;
}

interface WorkoutChartProps {
  data: WorkoutData[];
  timeRange: "week" | "month" | "year";
}

const WorkoutChart = ({ data, timeRange }: WorkoutChartProps) => {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const match = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(match.matches);
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      match.addEventListener("change", handler);
      return () => match.removeEventListener("change", handler);
    }
  }, []);

  const getChartTitle = () => {
    switch (timeRange) {
      case "week":
        return "Weekly Progress";
      case "month":
        return "Monthly Progress";
      case "year":
        return "Yearly Progress";
      default:
        return "Progress";
    }
  };

  return (
    <div className="relative rounded-2xl shadow-2xl border border-orange-100 dark:border-gray-800 p-0 overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 opacity-90" />
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-pink-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg dark:from-yellow-400 dark:via-pink-400 dark:to-orange-400">
            {getChartTitle()}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
            <span className="inline-flex items-center">
              <span
                className="w-3 h-3 rounded-full shadow-md mr-1"
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 60%, #818cf8 100%)",
                }}
              ></span>
              Workouts
            </span>
            <span className="inline-flex items-center ml-4">
              <span
                className="w-3 h-3 rounded-full shadow-md mr-1"
                style={{
                  background:
                    "linear-gradient(135deg, #f97316 60%, #fbbf24 100%)",
                }}
              ></span>
              Calories
            </span>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={6} barCategoryGap={20}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "#444" : "#f0f0f0"}
              />
              <XAxis
                dataKey="period"
                stroke={isDark ? "#f3f4f6" : "#6b7280"}
                tick={{
                  fontWeight: 700,
                  fontSize: 14,
                  fill: isDark ? "#fbbf24" : "#f59e42",
                }}
              />
              <YAxis
                yAxisId="left"
                stroke="#3b82f6"
                tick={{ fontWeight: 700, fontSize: 14, fill: "#3b82f6" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#f97316"
                tick={{ fontWeight: 700, fontSize: 14, fill: "#f97316" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#18181b" : "white",
                  color: isDark ? "#f3f4f6" : "#171717",
                  border: isDark ? "1px solid #333" : "1px solid #e5e7eb",
                  borderRadius: "10px",
                  boxShadow: isDark
                    ? "0 4px 24px #0008"
                    : "0 4px 24px #ffb34744",
                }}
                itemStyle={{ color: isDark ? "#f3f4f6" : "#171717" }}
                labelStyle={{
                  color: isDark ? "#fbbf24" : "#f59e42",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="workouts"
                fill="url(#workoutGradient)"
                radius={[8, 8, 0, 0]}
                minPointSize={3}
                maxBarSize={32}
                stroke="#3b82f6"
                strokeWidth={isDark ? 2 : 1}
                className="shadow-lg"
              />
              <Bar
                yAxisId="right"
                dataKey="calories"
                fill="url(#caloriesGradient)"
                radius={[8, 8, 0, 0]}
                minPointSize={3}
                maxBarSize={32}
                stroke="#f97316"
                strokeWidth={isDark ? 2 : 1}
                className="shadow-lg"
              />
              <defs>
                <linearGradient
                  id="workoutGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient
                  id="caloriesGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.7" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WorkoutChart;
