import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://julsixczdtoskgmpaewz.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1bHNpeGN6ZHRvc2tnbXBhZXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNDI2NDIsImV4cCI6MjA2MzcxODY0Mn0.VK2mmcnl7IOjiG1EmOrsOOAaE2NPcUHz0ov_7tTf-jQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export type Tables = {
  users: {
    id: string;
    email: string;
    name: string | null;
    height_cm: string | null;
    height_in: string | null;
    weight_kg: string | null;
    weight_lbs: string | null;
    goal: string | null;
    activity_level: string | null;
    created_at: string;
    updated_at: string;
  };
  workout_templates: {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    exercises: any[];
    created_at: string;
    updated_at: string;
  };
  workout_logs: {
    id: string;
    user_id: string;
    workout_name: string;
    completed_at: string;
    duration: number;
    exercises: any[];
    created_at: string;
  };
  workouts: {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    exercises: any[];
    created_at: string;
    updated_at: string;
  };
  nutrition: {
    id: string;
    user_id: string;
    date: string;
    meals: any[];
    goals: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    };
    created_at: string;
    updated_at: string;
  };
  progress: {
    id: string;
    user_id: string;
    date: string;
    weight_kg: number | null;
    weight_lbs: number | null;
    notes: string | null;
    created_at: string;
  };
};
