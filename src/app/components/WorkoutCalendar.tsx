"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";

// Define TypeScript interfaces
interface User {
  uid: string;
  email: string | null;
  [key: string]: any;
}

interface AuthContextType {
  currentUser: User | null;
}

interface WorkoutLog {
  id: string;
  userId: string;
  workoutName: string;
  completedAt: string;
  [key: string]: any;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  display: string;
  allDay: boolean;
}

interface WorkoutCalendarProps {
  workoutName: string;
}

const WorkoutCalendar = ({ workoutName }: WorkoutCalendarProps) => {
  const { currentUser } = useAuth() as AuthContextType;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchWorkoutLogs = async () => {
      if (!currentUser) return;

      try {
        const logsQuery = query(
          collection(db, "workoutLogs"),
          where("userId", "==", currentUser.uid),
          where("workoutName", "==", workoutName)
        );
        const logsSnapshot = await getDocs(logsQuery);

        // Group logs by date to prevent multiple entries per day
        const workoutEvents = logsSnapshot.docs.reduce(
          (acc: { [key: string]: CalendarEvent }, doc) => {
            const data = doc.data() as WorkoutLog;
            const date = new Date(data.completedAt).toISOString().split("T")[0];

            // Only add if we haven't seen this date before
            if (!acc[date]) {
              acc[date] = {
                id: doc.id,
                title: "✓",
                date,
                backgroundColor: "#10B981",
                borderColor: "#10B981",
                textColor: "#FFFFFF",
                display: "block",
                allDay: true,
              };
            }
            return acc;
          },
          {}
        );

        setEvents(Object.values(workoutEvents));
      } catch (error: any) {
        console.error("Error fetching workout logs:", error);
      }
      setLoading(false);
    };

    fetchWorkoutLogs();
  }, [currentUser, workoutName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Workout History</h2>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek",
        }}
        events={events}
        height="auto"
        eventContent={(eventInfo) => (
          <div className="text-center p-1">
            <span className="text-lg font-medium">{eventInfo.event.title}</span>
          </div>
        )}
        dayMaxEvents={true}
        moreLinkContent={(args) => `+${args.num} more`}
        eventDisplay="block"
        eventTimeFormat={{
          hour: "numeric",
          minute: "2-digit",
          meridiem: "short",
        }}
        dayHeaderFormat={{
          weekday: "short",
          day: "numeric",
        }}
        buttonText={{
          today: "Today",
          month: "Month",
          week: "Week",
        }}
      />
    </div>
  );
};

export default WorkoutCalendar;
