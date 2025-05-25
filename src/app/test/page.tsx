"use client";

import AuthTest from "../components/AuthTest";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Supabase Integration Test
        </h1>
        <AuthTest />
      </div>
    </div>
  );
}
