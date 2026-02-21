export const buildings = [
  "PRESTIGE POLYGON",
  "PRESTIGE PALLADIUM",
  "PRESTIGE METROPOLITAN",
  "PRESTIGE COSMOPOLITAN",
  "PRESTIGE CYBER TOWERS"
];

export const getBuildingConfig = (buildingName) => {
  // Default fallback
  const config = {
    hasTr3: true,
    hasInc3: true,
    hasHtOilTemp: true,
    hasHtTap: false,
    hasLtTap: true,
  };

  switch (buildingName) {
    case "PRESTIGE POLYGON":
      config.hasTr3 = true;
      config.hasInc3 = true;
      config.hasHtOilTemp = true;
      config.hasHtTap = false;
      config.hasLtTap = true;
      break;
    case "PRESTIGE PALLADIUM":
    case "PRESTIGE COSMOPOLITAN":
      config.hasTr3 = false;
      config.hasInc3 = false;
      config.hasHtOilTemp = true;
      config.hasHtTap = false;
      config.hasLtTap = true;
      break;
    case "PRESTIGE METROPOLITAN":
      config.hasTr3 = false;
      config.hasInc3 = false;
      config.hasHtOilTemp = true;
      config.hasHtTap = true;
      config.hasLtTap = false;
      break;
    case "PRESTIGE CYBER TOWERS":
      config.hasTr3 = false;
      config.hasInc3 = false;
      config.hasHtOilTemp = false;
      config.hasHtTap = true;
      config.hasLtTap = false;
      break;
    default:
      break;
  }

  return config;
};