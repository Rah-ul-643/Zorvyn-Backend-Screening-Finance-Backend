require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Record = require("../models/Record");

const MONGO_URI = process.env.MONGO_URI;

const users = [
  {
    name: "Admin User",
    email: "admin@finance.com",
    password: "admin123",
    role: "admin",
  },
  {
    name: "Analyst User",
    email: "analyst@finance.com",
    password: "analyst123",
    role: "analyst",
  },
  {
    name: "Viewer User",
    email: "viewer@finance.com",
    password: "viewer123",
    role: "viewer",
  },
];

const categories = ["Salary", "Rent", "Food", "Transport", "Utilities", "Entertainment", "Healthcare", "Investments"];

function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  // Clear existing data
  await User.deleteMany({});
  await Record.deleteMany({});
  console.log("Cleared existing data");

  // Create users
  const createdUsers = await User.create(users);
  const admin = createdUsers.find((u) => u.role === "admin");
  console.log("Users created");

  // Create sample records
  const records = [];
  const start = new Date("2024-01-01");
  const end = new Date();

  for (let i = 0; i < 60; i++) {
    const type = Math.random() > 0.4 ? "expense" : "income";
    records.push({
      amount: randomBetween(50, 5000),
      type,
      category: categories[Math.floor(Math.random() * categories.length)],
      date: randomDate(start, end),
      description: `Sample ${type} record #${i + 1}`,
      createdBy: admin._id,
    });
  }

  await Record.create(records);
  console.log("60 sample records created");

  console.log("\n--- Seed complete ---");
  console.log("Demo accounts:");
  users.forEach((u) => console.log(`  [${u.role}] ${u.email} / ${u.password}`));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
