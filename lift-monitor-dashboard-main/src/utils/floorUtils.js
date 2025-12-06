/**
 * Parse floor value to a numeric representation
 * Handles special floor names like G (Ground), B1, B2 (Basements), etc.
 *
 * @param {string|number} floor - The floor value to parse
 * @returns {number} - Numeric representation of the floor
 */
export const parseFloor = (floor) => {
  if (floor === undefined || floor === null) {
    return NaN;
  }

  const floorStr = String(floor).toUpperCase().trim();

  // Ground floor variations
  if (
    floorStr === "G" ||
    floorStr === "GF" ||
    floorStr === "GROUND" ||
    floorStr === "0"
  ) {
    return 0;
  }

  // Basement floors (B1 = -1, B2 = -2, etc.)
  if (floorStr.startsWith("B") || floorStr.startsWith("-B")) {
    const basementMatch = floorStr.match(/B(\d+)/i);
    if (basementMatch) {
      return -parseInt(basementMatch[1], 10);
    }
  }

  // Lower ground floor
  if (floorStr === "LG" || floorStr === "LOWER GROUND") {
    return -1;
  }

  // Upper ground floor
  if (floorStr === "UG" || floorStr === "UPPER GROUND") {
    return 1;
  }

  // Mezzanine floor
  if (floorStr === "M" || floorStr === "MZ" || floorStr === "MEZZANINE") {
    return 0.5;
  }

  // Regular numeric floors
  const numericFloor = parseInt(floorStr, 10);
  if (!isNaN(numericFloor)) {
    return numericFloor;
  }

  // If all else fails, return NaN
  return NaN;
};

/**
 * Format floor number for display
 *
 * @param {string|number} floor - The floor value
 * @returns {string} - Formatted floor string for display
 */
export const formatFloor = (floor) => {
  if (floor === undefined || floor === null) {
    return "-";
  }
  return String(floor).toUpperCase();
};
