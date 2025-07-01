import React, { ReactNode } from "react";

interface RecentActivityProps {
  children: ReactNode;
}

const RecentActivity = ({ children }: RecentActivityProps) => (
  <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 rounded-2xl shadow-xl border border-orange-100 dark:border-gray-800 p-6">
    {children}
  </div>
);

export default RecentActivity;
