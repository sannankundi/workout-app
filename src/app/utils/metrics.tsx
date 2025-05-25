// Conversion constants
const KG_TO_LBS = 2.20462;
const CM_TO_INCHES = 0.393701;

/**
 * Convert weight between metric (kg) and imperial (lbs)
 * @param {number | string} value - The weight value to convert
 * @param {string} fromSystem - The system to convert from ('metric' or 'imperial')
 * @param {string} toSystem - The system to convert to ('metric' or 'imperial')
 * @returns {number | string} The converted weight value
 */
export const convertWeight = (
  value: number | string,
  fromSystem: string,
  toSystem: string
): number | string => {
  if (!value) return "";

  // Convert string to number if needed
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (fromSystem === toSystem) return numValue;

  if (fromSystem === "metric" && toSystem === "imperial") {
    // Convert kg to lbs (multiply by 2.20462)
    return Number((numValue * KG_TO_LBS).toFixed(1));
  } else if (fromSystem === "imperial" && toSystem === "metric") {
    // Convert lbs to kg (divide by 2.20462)
    return Number((numValue / KG_TO_LBS).toFixed(1));
  }

  return numValue;
};

/**
 * Convert height between metric (cm) and imperial (inches)
 * @param {number | string} value - The height value to convert
 * @param {string} fromSystem - The system to convert from ('metric' or 'imperial')
 * @param {string} toSystem - The system to convert to ('metric' or 'imperial')
 * @returns {number | string} The converted height value
 */
export const convertHeight = (
  value: number | string,
  fromSystem: string,
  toSystem: string
): number | string => {
  if (!value) return "";

  // Convert string to number if needed
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (fromSystem === toSystem) return numValue;

  if (fromSystem === "metric" && toSystem === "imperial") {
    // Convert cm to inches (multiply by 0.393701)
    return Number((numValue * CM_TO_INCHES).toFixed(1));
  } else if (fromSystem === "imperial" && toSystem === "metric") {
    // Convert inches to cm (divide by 0.393701)
    return Number((numValue / CM_TO_INCHES).toFixed(1));
  }

  return numValue;
};

/**
 * Format weight with appropriate unit
 * @param {number | string} value - The weight value
 * @param {string} system - The measurement system ('metric' or 'imperial')
 * @returns {string} The formatted weight with unit
 */
export const formatWeight = (
  value: number | string,
  system: string
): string => {
  if (!value) return "";
  return `${value} ${system === "metric" ? "kg" : "lbs"}`;
};

/**
 * Format height with appropriate unit
 * @param {number | string} value - The height value
 * @param {string} system - The measurement system ('metric' or 'imperial')
 * @returns {string} The formatted height with unit
 */
export const formatHeight = (
  value: number | string,
  system: string
): string => {
  if (!value) return "";
  return `${value} ${system === "metric" ? "cm" : "in"}`;
};
