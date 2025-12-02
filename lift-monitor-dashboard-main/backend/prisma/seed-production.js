import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting production database setup...");

  // Clear all existing data
  console.log("🗑️  Clearing existing data...");
  await prisma.serviceLog.deleteMany({});
  await prisma.panelLog.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("✅ All tables cleared");

  // Create default admin user
  console.log("👤 Creating default admin user...");
  const hashedPassword = await bcrypt.hash("Atlanwa@20", 10);

  const adminUser = await prisma.user.create({
    data: {
      email: "atlanwabms",
      password: hashedPassword,
      name: "Atlanwa Admin",
      role: "admin",
      privileges: ["view", "create", "edit", "delete"],
      assignedBuildings: [], // empty means all buildings for admin
    },
  });

  console.log("✅ Default admin user created:");
  console.log("   Username: atlanwabms");
  console.log("   Password: Atlanwa@20");
  console.log("   Role: admin");

  console.log("\n🎉 Production database setup complete!");
  console.log("\n📋 Summary:");
  console.log("   - All tables are empty");
  console.log("   - Default admin user created");
  console.log("\n⚠️  IMPORTANT: Change the admin password after first login!");
}

main()
  .catch((e) => {
    console.error("❌ Error during setup:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });