import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ClientWrapper from "./components/ClientWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Workout App",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    "Track your workouts and progress",
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
