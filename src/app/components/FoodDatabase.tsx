"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FaSearch, FaPlus, FaTimes } from "react-icons/fa";
import { searchFoods } from "../utils/foodApi";

// Define TypeScript interfaces
interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}

interface ServingSize {
  amount: number;
  unit: string;
  gramWeight: number;
  id: string;
  label?: string;
}

interface FoodDatabaseProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFood: (
    food: Food & {
      servingSize: number;
      servingUnit: string;
      originalValues: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        water: number;
      };
      servingSizes: ServingSize[];
    }
  ) => void;
}

// Mock utility types (replace with actual implementations from your foodApi)
interface SearchFoods {
  (query: string, page: number): Promise<Food[]>;
}

interface RoundNumber {
  (value: number, decimals?: number): number;
}

// Replace these with actual imports from your foodApi
const roundNumber: RoundNumber = (value: number, decimals: number = 2) => {
  return Number(value.toFixed(decimals));
};

const FoodDatabase = ({ isOpen, onClose, onSelectFood }: FoodDatabaseProps) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const observer = useRef<IntersectionObserver | null>(null);

  const lastFoodElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore]
  );

  useEffect(() => {
    if (!isOpen) {
      setSearchResults([]);
      setPage(1);
      setHasMore(true);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsLoading(true);
        setError(null);
        try {
          const results = await searchFoods(searchQuery, page);
          if (page === 1) {
            setSearchResults(results);
          } else {
            setSearchResults((prev) => [...prev, ...results]);
          }
          setHasMore(results.length > 0);
        } catch (error) {
          setError("Failed to search foods. Please try again.");
          console.error(error);
        }
        setIsLoading(false);
      } else {
        setSearchResults([]);
        setHasMore(true);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, page]);

  const handleFoodSelect = (food: Food) => {
    const defaultServing: ServingSize = {
      amount: 100,
      unit: "g",
      gramWeight: 100,
      id: "100g",
      label: "100g (Standard)",
    };

    const originalValues = {
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      water: food.water,
    };

    onSelectFood({
      ...food,
      servingSize: defaultServing.amount,
      servingUnit: defaultServing.unit,
      originalValues,
      servingSizes: [
        defaultServing,
        {
          amount: 200,
          unit: "g",
          gramWeight: 200,
          id: "200g",
          label: "Double (200g)",
        },
        {
          amount: 1,
          unit: "cup",
          gramWeight: 240,
          id: "1cup",
          label: "1 cup (240g)",
        },
        {
          amount: 1,
          unit: "fl oz",
          gramWeight: 30,
          id: "1floz",
          label: "1 fl oz (30g)",
        },
        {
          amount: 1,
          unit: "large",
          gramWeight: 600,
          id: "1large",
          label: "1 large (600g)",
        },
        {
          amount: 1,
          unit: "small",
          gramWeight: 300,
          id: "1small",
          label: "1 small (300g)",
        },
        {
          amount: 1,
          unit: "medium",
          gramWeight: 480,
          id: "1medium",
          label: "1 medium (480g)",
        },
        {
          amount: 1,
          unit: "quantity not specified",
          gramWeight: 360,
          id: "1qns",
          label: "1 quantity not specified (360g)",
        },
      ],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-secondary rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Food Database
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              aria-label="Close food database"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
                setSearchResults([]);
              }}
              placeholder="Search for foods..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
          </div>

          {isLoading && page === 1 && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-center py-4">{error}</div>
          )}

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {searchResults.map((food, index) => (
              <div
                key={food.id}
                ref={
                  index === searchResults.length - 1 ? lastFoodElementRef : null
                }
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                onClick={() => handleFoodSelect(food)}
              >
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {food.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {food.calories} cal | {food.protein}g protein | {food.carbs}
                    g carbs | {food.fat}g fat
                  </p>
                </div>
                <FaPlus className="text-gray-400 dark:text-gray-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDatabase;
