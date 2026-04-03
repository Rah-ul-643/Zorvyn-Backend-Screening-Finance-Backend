const Record = require("../models/Record");

// POST /api/records  (admin only)
const createRecord = async (req, res, next) => {
  try {
    const { amount, type, category, date, description } = req.body;

    if (!amount || !type || !category || !date) {
      return res
        .status(400)
        .json({ message: "amount, type, category, and date are required" });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res
        .status(400)
        .json({ message: "amount must be a positive number" });
    }

    if (!["income", "expense"].includes(type)) {
      return res
        .status(400)
        .json({ message: 'type must be "income" or "expense"' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const record = await Record.create({
      amount,
      type,
      category,
      date: parsedDate,
      description: description || "",
      createdBy: req.user._id,
    });

    res.status(201).json({ message: "Record created", record });
  } catch (err) {
    next(err);
  }
};

// GET /api/records  (viewer, analyst, admin)
const getRecords = async (req, res, next) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (type) {
      if (!["income", "expense"].includes(type)) {
        return res
          .status(400)
          .json({ message: 'type must be "income" or "expense"' });
      }
      filter.type = type;
    }

    if (category) {
      filter.category = { $regex: category, $options: "i" };
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { category: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const [records, total] = await Promise.all([
      Record.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("createdBy", "name email"),
      Record.countDocuments(filter),
    ]);

    res.json({
      records,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/records/:id  (viewer, analyst, admin)
const getRecordById = async (req, res, next) => {
  try {
    const record = await Record.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }
    res.json(record);
  } catch (err) {
    next(err);
  }
};

// PUT /api/records/:id  (admin only)
const updateRecord = async (req, res, next) => {
  try {
    const { amount, type, category, date, description } = req.body;

    if (amount !== undefined) {
      if (typeof amount !== "number" || amount <= 0) {
        return res
          .status(400)
          .json({ message: "amount must be a positive number" });
      }
    }

    if (type && !["income", "expense"].includes(type)) {
      return res
        .status(400)
        .json({ message: 'type must be "income" or "expense"' });
    }

    const updates = {};
    if (amount !== undefined) updates.amount = amount;
    if (type) updates.type = type;
    if (category) updates.category = category;
    if (date) updates.date = new Date(date);
    if (description !== undefined) updates.description = description;

    const record = await Record.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({ message: "Record updated", record });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/records/:id  (admin only — soft delete)
const deleteRecord = async (req, res, next) => {
  try {
    const record = await Record.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({ message: "Record deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
};
