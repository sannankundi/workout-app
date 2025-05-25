const USDA_API_KEY = "bIls1X9dT6jAfs6l8jpNPhVfQ5ek35l0j4x9R1nl";
const BASE_URL = "https://api.nal.usda.gov/fdc/v1";

// Helper function to round numbers
export const roundNumber = (num: number): number => {
  return Math.round(num * 10) / 10; // Round to 1 decimal place
};

// Helper function to check if foods have exactly the same name
interface FoodName {
  name: string;
}
const hasExactSameName = (food1: FoodName, food2: FoodName): boolean => {
  return food1.name.toLowerCase() === food2.name.toLowerCase();
};

// Helper function to clean food name
const cleanFoodName = (name: string): string => {
  return name
    .replace(/,.*$/, "") // Remove everything after first comma
    .replace(/\(.*?\)/g, "") // Remove text in parentheses
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
};

// Helper function to check if foods are similar
const areSimilarFoods = (food1: FoodName, food2: FoodName): boolean => {
  const name1 = cleanFoodName(food1.name).toLowerCase();
  const name2 = cleanFoodName(food2.name).toLowerCase();
  return name1 === name2;
};

// Helper function to process food nutrients
interface Nutrient {
  nutrientId: number;
  value: number;
}
const processNutrients = (
  nutrients: Nutrient[]
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
} => {
  return {
    calories: roundNumber(
      nutrients.find((n: Nutrient) => n.nutrientId === 1008)?.value || 0
    ), // Energy (kcal)
    protein: roundNumber(
      nutrients.find((n: Nutrient) => n.nutrientId === 1003)?.value || 0
    ), // Protein (g)
    carbs: roundNumber(
      nutrients.find((n: Nutrient) => n.nutrientId === 1005)?.value || 0
    ), // Carbohydrate (g)
    fat: roundNumber(
      nutrients.find((n: Nutrient) => n.nutrientId === 1004)?.value || 0
    ), // Total lipid (g)
    water: roundNumber(
      nutrients.find((n: Nutrient) => n.nutrientId === 1051)?.value || 0
    ), // Water (g)
  };
};

export const searchFoods = async (query: string, page: number = 1) => {
  try {
    // Trim the query and split by whitespace, then join with AND
    const searchTerms = query.trim().split(/\s+/).join(" AND ");
    const pageSize = 25;

    const response = await fetch(
      `${BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(
        searchTerms
      )}&pageSize=${pageSize}&pageNumber=${page}`
    );
    const data = await response.json();

    // Process foods and remove exact duplicates
    const processedFoods = data.foods
      .map((food: any) => {
        const nutrients = processNutrients(food.foodNutrients);
        return {
          id: food.fdcId.toString(),
          name: food.description,
          ...nutrients,
          servingSize: 100,
          servingUnit: "g",
          servingSizes:
            food.foodPortions?.map((portion: any) => ({
              amount: portion.amount,
              unit: portion.measureUnit.name,
              gramWeight: portion.gramWeight,
              id: portion.id,
            })) || [],
        };
      })
      .filter((food: any) => food.calories > 0);

    // Remove exact duplicates (keeping the first occurrence)
    const uniqueFoods = processedFoods.reduce((acc: any[], current: any) => {
      const isExactDuplicate = acc.some((food: any) =>
        hasExactSameName(food, current)
      );
      if (!isExactDuplicate) {
        acc.push(current);
      }
      return acc;
    }, []);

    return uniqueFoods;
  } catch (error) {
    console.error("Error searching foods:", error);
    return [];
  }
};

export const getFoodDetails = async (fdcId: string | number) => {
  try {
    const response = await fetch(
      `${BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`
    );
    const data = await response.json();

    const nutrients = processNutrients(data.foodNutrients);

    return {
      id: data.fdcId.toString(),
      name: data.description,
      ...nutrients,
      servingSize: 100,
      servingUnit: "g",
      servingSizes:
        data.foodPortions?.map((portion: any) => ({
          amount: portion.amount,
          unit: portion.measureUnit.name,
          gramWeight: portion.gramWeight,
          id: portion.id,
        })) || [],
    };
  } catch (error) {
    console.error("Error getting food details:", error);
    return null;
  }
};
