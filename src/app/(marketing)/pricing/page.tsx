"use client";

import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa";
import Link from "next/link";

// Define TypeScript interface for pricing plans
interface Plan {
  name: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonLink: string;
  highlighted?: boolean;
}

const Pricing = () => {
  const plans: Plan[] = [
    {
      name: "Free",
      price: "0",
      description: "Perfect for getting started",
      features: [
        "Basic workout tracking",
        "Simple nutrition logging",
        "Community access",
        "Basic progress tracking",
      ],
      buttonText: "Get Started",
      buttonLink: "/signup",
    },
    {
      name: "Pro",
      price: "9.99",
      description: "For serious fitness enthusiasts",
      features: [
        "Advanced workout tracking",
        "Detailed nutrition analysis",
        "Custom workout plans",
        "Progress analytics",
        "Priority support",
        "Ad-free experience",
      ],
      buttonText: "Start Free Trial",
      buttonLink: "/signup",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "29.99",
      description: "For fitness professionals",
      features: [
        "All Pro features",
        "Client management",
        "Team collaboration",
        "Custom branding",
        "API access",
        "Dedicated support",
      ],
      buttonText: "Contact Sales",
      buttonLink: "/contact",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Choose the plan that&apos;s right for you
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-lg shadow-lg p-8 ${
                plan.highlighted
                  ? "ring-2 ring-primary transform scale-105"
                  : ""
              }`}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  ${plan.price}
                </span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-gray-600 mb-6">{plan.description}</p>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <FaCheck className="h-5 w-5 text-primary mr-2" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.buttonLink}
                className={`block w-full text-center py-3 px-4 rounded-lg ${
                  plan.highlighted
                    ? "bg-primary text-white hover:bg-opacity-90"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                } transition-colors`}
              >
                {plan.buttonText}
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Need a custom plan?
          </h2>
          <p className="text-gray-600 mb-8">
            Contact us for special requirements or enterprise solutions
          </p>
          <Link
            href="/contact"
            className="inline-block bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Contact Sales
          </Link>
        </motion.div>

        <p className="text-gray-600">
          Let&apos;s get started on your fitness journey today!
        </p>
      </div>
    </div>
  );
};

export default Pricing;
