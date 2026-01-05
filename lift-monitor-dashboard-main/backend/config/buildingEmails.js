// Building Admin Email Mapping
// TODO: Replace dummy emails with actual building admin emails once provided by client
export const BUILDING_ADMIN_EMAILS = {
  "PRESTIGE POLYGON": {
    email: "polygon@prestigeconstructions.co.in", // TODO: Update with actual email
    adminName: "Polygon Admin",
  },
  "PRESTIGE PALLADIUM": {
    email: "Palladium@prestigeconstructions.co.in", // TODO: Update with actual email
    adminName: "Palladium Admin",
  },
  "PRESTIGE METROPOLITAN": {
    email: "PMMETROPOLITAN@prestigeconstructions.co.in", // TODO: Update with actual email
    adminName: "Metropolitan Admin",
  },
  "PRESTIGE COSMOPOLITAN": {
    email: "cosmopolitan@prestigeconstructions.co.in", // TODO: Update with actual email
    adminName: "Cosmopolitan Admin",
  },
  "PRESTIGE CYBER TOWERS": {
    email: "cybertower@prestigeconstructions.co.in", // TODO: Update with actual email
    adminName: "Cyber Towers Admin",
  },
};

// Email configuration from environment variables
export const EMAIL_CONFIG = {
  senderEmail: process.env.GMAIL_USER || "atlanwa.logs@gmail.com",
  senderPassword: process.env.GMAIL_PASSWORD || "",
  senderName: "Atlanwa Lift Monitor",
  ccEmails: ["atlanwa.logs@gmail.com"], // CC emails for all reports
};

// Function to get building email config
export const getBuildingEmailConfig = (buildingName) => {
  return BUILDING_ADMIN_EMAILS[buildingName] || null;
};

// Function to get all building emails
export const getAllBuildingEmails = () => {
  return Object.entries(BUILDING_ADMIN_EMAILS).map(([building, config]) => ({
    building,
    ...config,
  }));
};
