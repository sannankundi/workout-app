"use client";

import { useState, useEffect } from "react";
import { FaPlus, FaUtensils, FaTrash } from "react-icons/fa";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import FoodDatabase from "../components/FoodDatabase";

// Types
interface NutritionGoal {
  target: number;
  current: number;
}

interface NutritionGoals {
  calories: NutritionGoal;
  protein: NutritionGoal;
  carbs: NutritionGoal;
  fat: NutritionGoal;
  water: NutritionGoal;
}

interface ServingSize {
  id: string;
  label?: string;
  amount: number;
  unit: string;
  gramWeight: number;
}

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  servingSizes: ServingSize[];
  servingSize: number;
  servingUnit: string;
  originalValues: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  };
}

interface Meal {
  name: string;
  time: string;
  items: FoodItem[];
}

// Helper function to clean up floating point numbers
const cleanNumber = (num: number): number => {
  if (Math.abs(num) < 0.0001 || num < 0) return 0;
  return Math.round(num * 10) / 10;
};

const Nutrition = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("tracking");
  const [isFoodDatabaseOpen, setIsFoodDatabaseOpen] = useState<boolean>(false);
  const [selectedMeal, setSelectedMeal] = useState<number | null>(null);
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoals>({
    calories: { target: 2000, current: 0 },
    protein: { target: 150, current: 0 },
    carbs: { target: 250, current: 0 },
    fat: { target: 65, current: 0 },
    water: { target: 2500, current: 0 },
  });
  const [isEditingGoals, setIsEditingGoals] = useState<boolean>(false);
  const [editedGoals, setEditedGoals] = useState<
    Partial<Record<keyof NutritionGoals, number>>
  >({});
  const [meals, setMeals] = useState<Meal[]>([
    { name: "Breakfast", time: "8:00 AM", items: [] },
    { name: "Lunch", time: "12:30 PM", items: [] },
    { name: "Dinner", time: "7:00 PM", items: [] },
  ]);
  const [waterIntake, setWaterIntake] = useState<number>(0);
  const [foodWaterIntake, setFoodWaterIntake] = useState<number>(0);

  useEffect(() => {
    const fetchNutritionData = async () => {
      if (!currentUser) {
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.nutritionGoals) {
            const cleanedGoals: NutritionGoals = {
              calories: {
                target: cleanNumber(userData.nutritionGoals.calories.target),
                current: cleanNumber(userData.nutritionGoals.calories.current),
              },
              protein: {
                target: cleanNumber(userData.nutritionGoals.protein.target),
                current: cleanNumber(userData.nutritionGoals.protein.current),
              },
              carbs: {
                target: cleanNumber(userData.nutritionGoals.carbs.target),
                current: cleanNumber(userData.nutritionGoals.carbs.current),
              },
              fat: {
                target: cleanNumber(userData.nutritionGoals.fat.target),
                current: cleanNumber(userData.nutritionGoals.fat.current),
              },
              water: {
                target: cleanNumber(userData.nutritionGoals.water.target),
                current: cleanNumber(userData.nutritionGoals.water.current),
              },
            };
            setNutritionGoals(cleanedGoals);
            setWaterIntake(cleanedGoals.water.current - foodWaterIntake);
          }
          if (userData.meals) {
            setMeals(userData.meals);
          }
        }
      } catch (error) {
        console.error("Error fetching nutrition data:", error);
      }
    };

    fetchNutritionData();
  }, [currentUser, foodWaterIntake]);

  const handleSaveMeal = async () => {
    if (!currentUser) {
      return;
    }

    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        meals: meals,
        nutritionGoals: nutritionGoals,
      });
    } catch (error) {
      console.error("Error saving meal:", error);
    }
  };

  const handleSelectFood = async (food: FoodItem) => {
    if (selectedMeal !== null) {
      const updatedMeals = [...meals];
      updatedMeals[selectedMeal].items.push({
        ...food,
        id: Date.now().toString(),
      });
      setMeals(updatedMeals);
      const updatedGoals = { ...nutritionGoals };
      updatedGoals.calories.current = cleanNumber(
        updatedGoals.calories.current + food.calories
      );
      updatedGoals.protein.current = cleanNumber(
        updatedGoals.protein.current + food.protein
      );
      updatedGoals.carbs.current = cleanNumber(
        updatedGoals.carbs.current + food.carbs
      );
      updatedGoals.fat.current = cleanNumber(
        updatedGoals.fat.current + food.fat
      );
      updatedGoals.water.current = cleanNumber(
        updatedGoals.water.current + food.water
      );
      setNutritionGoals(updatedGoals);
      setFoodWaterIntake((prev) => cleanNumber(prev + food.water));
      await handleSaveMeal();
      setIsFoodDatabaseOpen(false);
      setSelectedMeal(null);
    }
  };

  const handleRemoveFood = async (mealIndex: number, foodIndex: number) => {
    const updatedMeals = [...meals];
    const removedFood = updatedMeals[mealIndex].items[foodIndex];
    updatedMeals[mealIndex].items.splice(foodIndex, 1);
    setMeals(updatedMeals);
    const updatedGoals = { ...nutritionGoals };
    updatedGoals.calories.current = cleanNumber(
      updatedGoals.calories.current - removedFood.calories
    );
    updatedGoals.protein.current = cleanNumber(
      updatedGoals.protein.current - removedFood.protein
    );
    updatedGoals.carbs.current = cleanNumber(
      updatedGoals.carbs.current - removedFood.carbs
    );
    updatedGoals.fat.current = cleanNumber(
      updatedGoals.fat.current - removedFood.fat
    );
    updatedGoals.water.current = cleanNumber(
      updatedGoals.water.current - removedFood.water
    );
    setNutritionGoals(updatedGoals);
    setFoodWaterIntake((prev) => cleanNumber(prev - removedFood.water));
    await handleSaveMeal();
  };

  const handleUpdateGoals = async () => {
    try {
      const goalsData: NutritionGoals = {
        calories: {
          ...nutritionGoals.calories,
          target: cleanNumber(Number(editedGoals.calories)),
        },
        protein: {
          ...nutritionGoals.protein,
          target: cleanNumber(Number(editedGoals.protein)),
        },
        carbs: {
          ...nutritionGoals.carbs,
          target: cleanNumber(Number(editedGoals.carbs)),
        },
        fat: {
          ...nutritionGoals.fat,
          target: cleanNumber(Number(editedGoals.fat)),
        },
        water: {
          ...nutritionGoals.water,
          target: cleanNumber(Number(editedGoals.water)),
        },
      };
      await handleSaveMeal();
      setNutritionGoals(goalsData);
      setIsEditingGoals(false);
    } catch (error) {
      console.error("Error updating goals:", error);
    }
  };

  const handleWaterIntake = async (amount: number) => {
    const newWaterIntake = waterIntake + amount;
    setWaterIntake(newWaterIntake);
    const updatedGoals = { ...nutritionGoals };
    updatedGoals.water.current = newWaterIntake + foodWaterIntake;
    await handleSaveMeal();
    setNutritionGoals(updatedGoals);
  };

  const getTotalWaterIntake = () => {
    return waterIntake + foodWaterIntake;
  };

  const handleServingSizeChange = async (
    mealIndex: number,
    foodIndex: number,
    newServingSize: ServingSize
  ) => {
    const updatedMeals = [...meals];
    const food = updatedMeals[mealIndex].items[foodIndex];
    const multiplier = newServingSize.gramWeight / 100;
    const originalValues = food.originalValues;
    const newValues = {
      calories: cleanNumber(originalValues.calories * multiplier),
      protein: cleanNumber(originalValues.protein * multiplier),
      carbs: cleanNumber(originalValues.carbs * multiplier),
      fat: cleanNumber(originalValues.fat * multiplier),
      water: cleanNumber(originalValues.water * multiplier),
    };
    updatedMeals[mealIndex].items[foodIndex] = {
      ...food,
      servingSize: newServingSize.amount,
      servingUnit: newServingSize.unit,
      calories: newValues.calories,
      protein: newValues.protein,
      carbs: newValues.carbs,
      fat: newValues.fat,
      water: newValues.water,
    };
    const updatedGoals = { ...nutritionGoals };
    updatedGoals.calories.current = 0;
    updatedGoals.protein.current = 0;
    updatedGoals.carbs.current = 0;
    updatedGoals.fat.current = 0;
    updatedGoals.water.current = 0;
    updatedMeals.forEach((meal) => {
      meal.items.forEach((item) => {
        updatedGoals.calories.current = cleanNumber(
          updatedGoals.calories.current + item.calories
        );
        updatedGoals.protein.current = cleanNumber(
          updatedGoals.protein.current + item.protein
        );
        updatedGoals.carbs.current = cleanNumber(
          updatedGoals.carbs.current + item.carbs
        );
        updatedGoals.fat.current = cleanNumber(
          updatedGoals.fat.current + item.fat
        );
        updatedGoals.water.current = cleanNumber(
          updatedGoals.water.current + item.water
        );
      });
    });
    setFoodWaterIntake(updatedGoals.water.current);
    setMeals(updatedMeals);
    setNutritionGoals(updatedGoals);
    await handleSaveMeal();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Nutrition</h1>
            <button
              onClick={() => {
                setSelectedMeal(0);
                setIsFoodDatabaseOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              <FaPlus className="mr-2" />
              Log Meal
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {["tracking", "goals"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          {activeTab === "tracking" ? (
            <div className="space-y-6">
              {/* Nutrition Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(nutritionGoals).map(([key, value]) => {
                  // Skip water in the nutrition summary since we have a dedicated water section
                  if (key === "water") return null;
                  const percentage = Math.min(
                    (value.current / value.target) * 100,
                    100
                  );
                  const isAchieved = value.current >= value.target;
                  return (
                    <div key={key} className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-sm font-medium text-gray-600 capitalize">
                        {key}
                      </h3>
                      <div className="mt-2">
                        <div className="flex justify-between items-baseline">
                          <p className="text-2xl font-semibold text-gray-900">
                            {value.current}
                          </p>
                          <p className="text-sm text-gray-500">
                            / {value.target}
                          </p>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${
                              isAchieved ? "bg-green-500" : "bg-primary"
                            } rounded-full h-2 transition-all duration-300`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Water Intake */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Water Intake</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600">Direct Water Intake</p>
                      <p className="text-2xl font-bold">{waterIntake}ml</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Water from Food</p>
                      <p className="text-2xl font-bold">{foodWaterIntake}ml</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Water Intake</p>
                      <p className="text-2xl font-bold">
                        {getTotalWaterIntake()}ml
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Goal</p>
                      <p className="text-2xl font-bold">
                        {nutritionGoals.water.target}ml
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          (getTotalWaterIntake() /
                            nutritionGoals.water.target) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleWaterIntake(100)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      +100ml
                    </button>
                    <button
                      onClick={() => handleWaterIntake(200)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      +200ml
                    </button>
                    <button
                      onClick={() => handleWaterIntake(300)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      +300ml
                    </button>
                  </div>
                </div>
              </div>

              {/* Meals */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Today&apos;s Meals
                  </h2>
                  <div className="space-y-6">
                    {meals.map((meal, mealIndex) => (
                      <div
                        key={mealIndex}
                        className="border-b last:border-0 pb-6 last:pb-0"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <FaUtensils className="text-gray-400 mr-3" />
                            <h3 className="font-medium text-gray-900">
                              {meal.name}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {meal.time}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedMeal(mealIndex);
                                setIsFoodDatabaseOpen(true);
                              }}
                              className="text-primary hover:text-primary-dark"
                            >
                              <FaPlus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {meal.items.map((item, itemIndex) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {item.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {item.calories} cal • P: {item.protein}g • C:{" "}
                                  {item.carbs}g • F: {item.fat}g • W:{" "}
                                  {item.water}g
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <select
                                  value={
                                    item.servingSizes.find(
                                      (s) =>
                                        s.amount === item.servingSize &&
                                        s.unit === item.servingUnit
                                    )?.id || "100g"
                                  }
                                  onChange={(e) => {
                                    const selectedServing =
                                      item.servingSizes.find(
                                        (s) => s.id === e.target.value
                                      );
                                    if (selectedServing) {
                                      handleServingSizeChange(
                                        mealIndex,
                                        itemIndex,
                                        selectedServing
                                      );
                                    }
                                  }}
                                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                  {item.servingSizes?.map((serving) => (
                                    <option key={serving.id} value={serving.id}>
                                      {serving.label}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() =>
                                    handleRemoveFood(mealIndex, itemIndex)
                                  }
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <FaTrash className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {meal.items.length === 0 && (
                            <div className="text-center py-4 text-gray-500">
                              No items added yet. Click the + button to add
                              food.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Nutrition Goals
                </h2>
                {!isEditingGoals ? (
                  <button
                    onClick={() => {
                      setEditedGoals({
                        calories: nutritionGoals.calories.target,
                        protein: nutritionGoals.protein.target,
                        carbs: nutritionGoals.carbs.target,
                        fat: nutritionGoals.fat.target,
                        water: nutritionGoals.water.target,
                      });
                      setIsEditingGoals(true);
                    }}
                    className="text-primary hover:text-primary-dark"
                  >
                    Edit Goals
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsEditingGoals(false)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateGoals}
                      className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary-dark"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                {Object.entries(nutritionGoals).map(([key, value]) => {
                  const percentage = Math.min(
                    (value.current / value.target) * 100,
                    100
                  );
                  const isAchieved = value.current >= value.target;
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {key} Target
                        </label>
                        <div className="flex items-center space-x-2">
                          {isAchieved && (
                            <span className="text-green-500 text-sm font-medium">
                              ✓ Achieved
                            </span>
                          )}
                          {isEditingGoals ? (
                            <input
                              type="number"
                              value={
                                editedGoals[
                                  key as keyof NutritionGoals
                                ] as number
                              }
                              onChange={(e) =>
                                setEditedGoals({
                                  ...editedGoals,
                                  [key]: e.target.value,
                                })
                              }
                              className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-500">
                              {value.target}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${
                            isAchieved ? "bg-green-500" : "bg-primary"
                          } rounded-full h-2 transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Current: {value.current}</span>
                        <span>Target: {value.target}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <FoodDatabase
        isOpen={isFoodDatabaseOpen}
        onClose={() => {
          setIsFoodDatabaseOpen(false);
          setSelectedMeal(null);
        }}
        onSelectFood={handleSelectFood}
      />
    </div>
  );
};

export default Nutrition;
