const express = require("express");
const router = express.Router();
const {
  getSummary,
  getCategoryTotals,
  getRecentTransactions,
  getMonthlySummary,
  getWeeklySummary,
} = require("../controllers/dashboardController");
const authenticate = require("../middleware/auth");
const { requireMinRole } = require("../middleware/roleCheck");

// All dashboard routes require at least analyst role
router.use(authenticate, requireMinRole("analyst"));

router.get("/summary", getSummary);
router.get("/category-totals", getCategoryTotals);
router.get("/recent", getRecentTransactions);
router.get("/monthly-summary", getMonthlySummary);
router.get("/weekly-summary", getWeeklySummary);

module.exports = router;
