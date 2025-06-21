"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dumbbell,
  Plus,
  Calendar,
  MoreVertical,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface Workout {
  id: string;
  name: string;
  time: string;
  duration: string;
  exercises: number;
}

interface UpcomingWorkoutsProps {
  workouts: Workout[];
}

export default function UpcomingWorkouts({ workouts }: UpcomingWorkoutsProps) {
  const [showMenuId, setShowMenuId] = useState<string | null>(null);

  const handleStartWorkout = (workoutId: string) => {
    // Handle starting workout
    console.log("Starting workout:", workoutId);
  };

  const handleScheduleWorkout = () => {
    // Handle scheduling new workout
    console.log("Schedule workout");
  };

  const handleRescheduleWorkout = (workout: Workout) => {
    // Handle rescheduling workout
    console.log("Reschedule workout:", workout);
  };

  const handleDeleteWorkout = (workoutId: string) => {
    // Handle deleting workout
    console.log("Delete workout:", workoutId);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Upcoming Workouts</h2>
        <button
          onClick={handleScheduleWorkout}
          className="btn-primary inline-flex items-center text-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Schedule
        </button>
      </div>
      <div className="space-y-4">
        {workouts.length > 0 ? (
          workouts.map((workout) => (
            <div
              key={`workout-${workout.id}`}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 border border-transparent hover:border-gray-200 relative group"
            >
              <div
                className="flex items-center space-x-4 cursor-pointer"
                onClick={() => handleStartWorkout(workout.id)}
              >
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Dumbbell className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary transition-colors">
                    {workout.name}
                  </h3>
                  <p className="text-sm text-gray-500">{workout.time}</p>
                  <p className="text-sm text-gray-500">
                    {workout.duration} • {workout.exercises} exercises
                  </p>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenuId(
                        showMenuId === workout.id ? null : workout.id
                      );
                    }}
                    className="p-2 rounded-full hover:bg-gray-200 focus:outline-none transition-colors"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-500" />
                  </button>
                  {showMenuId === workout.id && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 border border-gray-200">
                      <div className="py-1" role="menu">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRescheduleWorkout(workout);
                            setShowMenuId(null);
                          }}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          role="menuitem"
                        >
                          <RefreshCw className="mr-3 h-4 w-4 text-gray-400" />
                          Reschedule
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWorkout(workout.id);
                            setShowMenuId(null);
                          }}
                          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                          role="menuitem"
                        >
                          <Trash2 className="mr-3 h-4 w-4 text-red-400" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No upcoming workouts</p>
            <button
              onClick={handleScheduleWorkout}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Workout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
