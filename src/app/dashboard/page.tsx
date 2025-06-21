"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell,
  Apple,
  TrendingUp,
  Calendar,
  Play,
  Plus,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Trash2,
  Edit,
  RefreshCw,
  Target,
  Trophy,
  Flame,
  Clock,
  Users,
  Zap,
  Star,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  getWorkoutsByTimeRange,
  getNutritionProgress,
  getNextWorkout,
  calculateCaloriesBurned,
  type WorkoutSummary,
  type NutritionProgress,
  getRecentActivities,
} from "../utils/dashboardUtils";
import {
  format,
  isToday,
  isTomorrow,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";
import { initializeUserData } from "../utils/initializeData";
import ScheduleWorkoutModal from "../components/ScheduleWorkoutModal";
import DashboardStats from "../components/DashboardStats";
import QuickActions from "../components/QuickActions";
import WorkoutChart from "../components/WorkoutChart";
import Achievements from "../components/Achievements";
import {
  getDoc,
  doc,
  deleteDoc,
  query,
  getDocs,
  collection,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useRouter } from "next/navigation";
import RecentActivity from "@/components/dashboard/RecentActivity";
import UpcomingWorkouts from "@/components/dashboard/UpcomingWorkouts";

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
  color: string;
  bgColor: string;
}

interface Activity {
  activity: string;
  time: string;
  type: "workout" | "nutrition" | "achievement";
  link: string;
  workoutType?: "scheduled" | "manual";
  source?: "workoutLogs" | "workoutSchedule";
}

interface UpcomingWorkout {
  id: string;
  name: string;
  time: string;
  duration: string;
  exercises: number;
  scheduledDate: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

const Dashboard = () => {
  const { currentUser } = useAuth() as AuthContextType;
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "week" | "month" | "year"
  >("week");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stat[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<UpcomingWorkout[]>(
    []
  );
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workoutData, setWorkoutData] = useState<any[]>([]);
  const [nutritionData, setNutritionData] = useState<any>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const router = useRouter();
  const [showMenuId, setShowMenuId] = useState<string | null>(null);

  // Generate workout data for chart based on selected time range
  const generateChartData = (workouts: WorkoutSummary[]) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let formatString: string;

    switch (selectedTimeRange) {
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        formatString = "EEE";
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        formatString = "MMM d";
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        formatString = "MMM";
        break;
      default:
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        formatString = "EEE";
    }

    if (selectedTimeRange === "year") {
      // For yearly view, group by months
      const months = [];
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(now.getFullYear(), i, 1);
        const monthEnd = new Date(now.getFullYear(), i + 1, 0);
        const monthWorkouts = workouts.filter((workout) => {
          const workoutDate = new Date(workout.completedAt);
          return workoutDate >= monthStart && workoutDate <= monthEnd;
        });
        months.push({
          period: format(monthStart, formatString),
          workouts: monthWorkouts.length,
          calories: calculateCaloriesBurned(monthWorkouts),
          date: format(monthStart, "yyyy-MM"),
        });
      }
      return months;
    } else {
      // For week and month views, use daily intervals
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      return days.map((day) => {
        const dayWorkouts = workouts.filter(
          (workout) =>
            format(new Date(workout.completedAt), "yyyy-MM-dd") ===
            format(day, "yyyy-MM-dd")
        );
        return {
          period: format(day, formatString),
          workouts: dayWorkouts.length,
          calories: calculateCaloriesBurned(dayWorkouts),
          date: format(day, "yyyy-MM-dd"),
        };
      });
    }
  };

  const fetchDashboardData = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all dashboard data
      const [activities, workouts, nutritionProgress, nextWorkout] =
        await Promise.all([
          getRecentActivities(currentUser.uid),
          getWorkoutsByTimeRange(currentUser.uid, selectedTimeRange),
          getNutritionProgress(currentUser.uid),
          getNextWorkout(currentUser.uid),
        ]);

      // Process and update state
      const totalCaloriesBurned = calculateCaloriesBurned(workouts);
      const nutritionPercentage =
        nutritionProgress && nutritionProgress.nutritionGoals?.calories
          ? Math.round(
              (nutritionProgress.calories /
                nutritionProgress.nutritionGoals.calories) *
                100
            )
          : 0;

      // Generate chart data based on selected time range
      const chartData = generateChartData(workouts);
      setWorkoutData(chartData);
      setNutritionData(nutritionProgress);

      // Calculate achievements
      const workoutStreak = calculateWorkoutStreak(workouts);
      const totalWorkouts = workouts.length;
      const caloriesGoal = totalCaloriesBurned >= 2000; // Example goal

      const allAchievements: Achievement[] = [
        {
          id: "first-workout",
          title: "First Steps",
          description: "Complete your first workout",
          icon: <Dumbbell className="h-6 w-6" />,
          unlocked: totalWorkouts > 0,
          progress: Math.min(totalWorkouts, 1),
          maxProgress: 1,
        },
        {
          id: "workout-streak",
          title: "Consistency King",
          description: "Complete 3 workouts in a row",
          icon: <Flame className="h-6 w-6" />,
          unlocked: workoutStreak >= 3,
          progress: Math.min(workoutStreak, 3),
          maxProgress: 3,
        },
        {
          id: "calories-burner",
          title: "Calorie Crusher",
          description: "Burn 2000 calories in a week",
          icon: <TrendingUp className="h-6 w-6" />,
          unlocked: caloriesGoal,
          progress: Math.min(totalCaloriesBurned, 2000),
          maxProgress: 2000,
        },
        {
          id: "nutrition-master",
          title: "Nutrition Master",
          description: "Meet your nutrition goals for 3 days",
          icon: <Apple className="h-6 w-6" />,
          unlocked: nutritionPercentage >= 100,
          progress: Math.min(nutritionPercentage, 100),
          maxProgress: 100,
        },
      ];

      // Filter out completed achievements and only show incomplete ones
      const incompleteAchievements = allAchievements.filter(
        (achievement) => !achievement.unlocked
      );
      setAchievements(incompleteAchievements);

      // Update stats with enhanced styling
      const workoutTitle = `Workouts This ${
        selectedTimeRange.charAt(0).toUpperCase() + selectedTimeRange.slice(1)
      }`;
      const timeRangeText =
        selectedTimeRange === "week"
          ? "This week"
          : selectedTimeRange === "month"
          ? "This month"
          : "This year";

      setStats([
        {
          title: workoutTitle,
          value: workouts.length.toString(),
          icon: <Dumbbell className="h-6 w-6" />,
          change: `${workouts.length} completed`,
          trend: "up",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        },
        {
          title: "Calories Burned",
          value: Math.round(totalCaloriesBurned).toString(),
          icon: <Flame className="h-6 w-6" />,
          change: timeRangeText,
          trend: "up",
          color: "text-orange-600",
          bgColor: "bg-orange-50",
        },
        {
          title: "Nutrition Goals",
          value: `${nutritionPercentage}%`,
          icon: <Apple className="h-6 w-6" />,
          change: nutritionPercentage >= 100 ? "Goal achieved" : "On track",
          trend: nutritionPercentage >= 100 ? "up" : "neutral",
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          title: "Next Workout",
          value: nextWorkout
            ? format(new Date(nextWorkout.scheduledDate), "MMM d")
            : "None",
          icon: <Calendar className="h-6 w-6" />,
          change: nextWorkout ? nextWorkout.name : "No workouts scheduled",
          trend: "neutral",
          color: "text-purple-600",
          bgColor: "bg-purple-50",
        },
      ]);

      setRecentActivities(activities);

      if (nextWorkout) {
        setUpcomingWorkouts([
          {
            id: nextWorkout.id,
            name: nextWorkout.name,
            time: format(new Date(nextWorkout.scheduledDate), "MMM d, h:mm a"),
            duration: `${nextWorkout.duration} min`,
            exercises: nextWorkout.exercises,
            scheduledDate: nextWorkout.scheduledDate,
          },
        ]);
      } else {
        setUpcomingWorkouts([]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate workout streak
  const calculateWorkoutStreak = (workouts: any[]) => {
    if (workouts.length === 0) return 0;

    const sortedWorkouts = workouts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedWorkouts.length; i++) {
      const workoutDate = new Date(sortedWorkouts[i].createdAt);
      workoutDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser, selectedTimeRange]);

  const handleScheduleWorkout = () => {
    setIsScheduleModalOpen(true);
  };

  const handleWorkoutScheduled = async () => {
    console.log("Workout scheduled, refreshing dashboard...");
    await fetchDashboardData();
  };

  const handleStartWorkout = (workoutId: string) => {
    router.push(`/workouts/${workoutId}`);
  };

  const handleDeleteWorkout = async (documentId: string) => {
    if (!documentId) {
      console.error("No document ID provided");
      return;
    }

    try {
      await deleteDoc(doc(db, "scheduledWorkouts", documentId));
      setUpcomingWorkouts((prevWorkouts) =>
        prevWorkouts.filter((workout) => workout.id !== documentId)
      );
      setShowMenuId(null);
    } catch (error) {
      console.error("Error deleting workout:", error);
      setError("Failed to delete workout");
    }
  };

  const handleRescheduleWorkout = (workout: UpcomingWorkout) => {
    setIsScheduleModalOpen(true);
  };

  const quickActions: QuickAction[] = [
    {
      title: "Start Workout",
      description: "Begin a new workout session",
      icon: <Play className="h-5 w-5" />,
      action: () => router.push("/workouts"),
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Schedule Workout",
      description: "Plan your next workout",
      icon: <Calendar className="h-5 w-5" />,
      action: handleScheduleWorkout,
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "Log Nutrition",
      description: "Track your daily nutrition",
      icon: <Apple className="h-5 w-5" />,
      action: () => router.push("/nutrition"),
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "View Progress",
      description: "Check your fitness progress",
      icon: <TrendingUp className="h-5 w-5" />,
      action: () => router.push("/profile"),
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="btn-primary inline-flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {currentUser?.email?.split("@")[0] || "User"}!
                  👋
                </h1>
                <p className="mt-2 text-gray-600">
                  Here's your fitness journey overview
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-white rounded-lg shadow-sm border">
                  {(["week", "month", "year"] as const).map((range) => (
                    <button
                      key={`range-${range}`}
                      onClick={() => setSelectedTimeRange(range)}
                      className={`px-4 py-2 text-sm font-medium transition-all ${
                        selectedTimeRange === range
                          ? "bg-primary text-white rounded-lg shadow-sm"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {range.charAt(0).toUpperCase() + range.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <QuickActions actions={quickActions} />
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <DashboardStats stats={stats} />
            </motion.div>

            {/* Charts and Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Workout Progress Chart */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={
                  achievements.length > 0 ? "lg:col-span-2" : "lg:col-span-3"
                }
              >
                <WorkoutChart
                  data={workoutData}
                  timeRange={selectedTimeRange}
                />
              </motion.div>

              {/* Achievements - Only show if there are incomplete achievements */}
              {achievements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Achievements achievements={achievements} />
                </motion.div>
              )}
            </div>

            {/* Recent Activity and Upcoming Workouts */}
            <div
              className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${
                achievements.length === 0 ? "mt-8" : ""
              }`}
            >
              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <RecentActivity workouts={recentActivities} />
              </motion.div>

              {/* Upcoming Workouts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <UpcomingWorkouts workouts={upcomingWorkouts} />
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <ScheduleWorkoutModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleWorkoutScheduled}
      />
    </div>
  );
};

export default Dashboard;
