const Record = require("../models/Record");

// GET /api/dashboard/summary
// Returns: total income, total expense, net balance
const getSummary = async (req, res, next) => {
  try {
    const result = await Record.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;

    result.forEach((r) => {
      if (r._id === "income") totalIncome = r.total;
      if (r._id === "expense") totalExpense = r.total;
    });

    res.json({
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/category-totals
// Returns: totals grouped by category and type
const getCategoryTotals = async (req, res, next) => {
  try {
    const { type } = req.query;
    const match = { isDeleted: false };
    if (type && ["income", "expense"].includes(type)) {
      match.type = type;
    }

    const result = await Record.aggregate([
      { $match: match },
      {
        $group: {
          _id: { category: "$category", type: "$type" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id.category",
          type: "$_id.type",
          total: 1,
          count: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/recent
// Returns: last N transactions (default 10)
const getRecentTransactions = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const records = await Record.find()
      .sort({ date: -1 })
      .limit(limit)
      .populate("createdBy", "name email");

    res.json(records);
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/monthly-summary
// Returns: income and expense totals per month for the current year (or a given year)
const getMonthlySummary = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const result = await Record.aggregate([
      {
        $match: {
          isDeleted: false,
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          type: "$_id.type",
          total: 1,
        },
      },
      { $sort: { month: 1 } },
    ]);

    // Format into a 12-month array for easy consumption
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
    }));

    result.forEach(({ month, type, total }) => {
      const entry = months[month - 1];
      if (type === "income") entry.income = total;
      if (type === "expense") entry.expense = total;
    });

    // Attach net for each month
    months.forEach((m) => {
      m.net = m.income - m.expense;
    });

    res.json({ year, months });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/weekly-summary
// Returns: last 7 days income & expense
const getWeeklySummary = async (req, res, next) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const result = await Record.aggregate([
      {
        $match: {
          isDeleted: false,
          date: { $gte: sevenDaysAgo, $lte: today },
        },
      },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          day: "$_id.day",
          type: "$_id.type",
          total: 1,
        },
      },
      { $sort: { day: 1 } },
    ]);

    // Build a map of all 7 days
    const dayMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dayMap[key] = { day: key, income: 0, expense: 0 };
    }

    result.forEach(({ day, type, total }) => {
      if (dayMap[day]) {
        dayMap[day][type] = total;
      }
    });

    const days = Object.values(dayMap).map((d) => ({
      ...d,
      net: d.income - d.expense,
    }));

    res.json(days);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSummary,
  getCategoryTotals,
  getRecentTransactions,
  getMonthlySummary,
  getWeeklySummary,
};
