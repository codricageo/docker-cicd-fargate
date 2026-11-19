const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const APP_VERSION = process.env.APP_VERSION || "v2.0";

// Sample menu data (no database)
const menu = [
  { id: 1, name: "Test CI/CD", price: 100 },
  { id: 2, name: "Veg", price: 149 },
  { id: 3, name: "Test Alfredo", price: 249 },
  { id: 4, name: "LKsioadjsia Fries", price: 99 },
  { id: 5, name: "asdasdsa Salad", price: 200 },
  { id: 6, name: "asdsada Platteasdsadsar", price: 499 },
  { id: 7, name: "New Dish", price: 299 }
];

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// API: Get menu
app.get("/api/menu", (req, res) => {
  res.json(menu);
});

// API: Health check (for ALB)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// API: Version check (for CI/CD validation)
app.get("/version", (req, res) => {
  res.json({
    version: APP_VERSION
  });
});

app.listen(PORT, () => {
  console.log(`Food Menu Service running on port ${PORT}`);
});
