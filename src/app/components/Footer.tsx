"use client";

import React from "react";
import Link from "next/link";
import { FaGithub, FaLinkedin } from "react-icons/fa";

// Define TypeScript interfaces
interface QuickLink {
  name: string;
  path: string;
}

interface SocialLink {
  name: string;
  url: string;
  icon: React.ReactElement;
}

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks: QuickLink[] = [
    { name: "Home", path: "/?visited=true" },
    { name: "Features", path: "/features" },
    { name: "Pricing", path: "/pricing" },
    { name: "About", path: "/about" },
  ];

  const socialLinks: SocialLink[] = [
    {
      name: "GitHub",
      url: "https://github.com/sannankundi",
      icon: <FaGithub className="h-6 w-6" aria-hidden="true" />,
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/asannaankhan",
      icon: <FaLinkedin className="h-6 w-6" aria-hidden="true" />,
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link
              href="/?visited=true"
              className="text-2xl font-bold text-white"
            >
              FitTrack
            </Link>
            <p className="text-sm">
              Your personal fitness companion. Track workouts, monitor
              nutrition, and achieve your fitness goals.
            </p>
          </div>

          {/* Quick Links */}
          <nav aria-label="Footer navigation">
            <h3 className="text-lg font-semibold text-white mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.path}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
            <nav aria-label="Social media links">
              <div className="flex space-x-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors"
                    aria-label={`Visit our ${link.name} page`}
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          <p>
            © {currentYear} FitTrack. All rights reserved. Created by{" "}
            <a
              href="https://github.com/sannankundi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-opacity-90"
              aria-label="Visit Ahmad Sannaan Khan's GitHub profile"
            >
              Ahmad Sannaan Khan
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
