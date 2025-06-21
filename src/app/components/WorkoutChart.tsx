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
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{getChartTitle()}</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Workouts</span>
          <div className="w-3 h-3 bg-orange-500 rounded-full ml-4"></div>
          <span>Calories</span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="period" stroke="#6b7280" />
            <YAxis yAxisId="left" stroke="#3b82f6" />
            <YAxis yAxisId="right" orientation="right" stroke="#f97316" />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="workouts"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="calories"
              fill="#f97316"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WorkoutChart;
