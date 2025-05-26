import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ClientWrapper from "./components/ClientWrapper";

const inter = Inter({ subsets: ["latin"] });

declare global {
  interface Window {
    onRecaptchaLoad: () => void;
  }
}

export const metadata: Metadata = {
  title: "FitTrack - Your Personal Fitness Journey",
  description:
    "Track your workouts, monitor your progress, and achieve your fitness goals with FitTrack. Create custom workouts, track your exercises, and stay motivated on your fitness journey.",
  keywords: [
    "fitness",
    "workout",
    "tracking",
    "health",
    "exercise",
    "personal trainer",
    "workout tracker",
    "fitness app",
    "exercise tracking",
    "custom workouts",
  ],
  authors: [{ name: "FitTrack Team" }],
  openGraph: {
    title: "FitTrack - Your Personal Fitness Journey",
    description:
      "Track your workouts, monitor your progress, and achieve your fitness goals with FitTrack.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FitTrack - Your Personal Fitness Journey",
    description:
      "Track your workouts, monitor your progress, and achieve your fitness goals with FitTrack.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4F46E5", // Indigo color for theme
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=explicit`}
          strategy="beforeInteractive"
        />
      </head>
      <body
        className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200"
        suppressHydrationWarning
      >
        <AuthProvider>
          <PreferencesProvider>
            <ClientWrapper>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
            </ClientWrapper>
          </PreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
