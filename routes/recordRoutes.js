const express = require("express");
const router = express.Router();
const {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} = require("../controllers/recordController");
const authenticate = require("../middleware/auth");
const { requireRole, requireMinRole } = require("../middleware/roleCheck");

// All record routes require authentication
router.use(authenticate);

// Read: viewer, analyst, admin
router.get("/", requireMinRole("viewer"), getRecords);
router.get("/:id", requireMinRole("viewer"), getRecordById);

// Write: admin only
router.post("/", requireRole("admin"), createRecord);
router.put("/:id", requireRole("admin"), updateRecord);
router.delete("/:id", requireRole("admin"), deleteRecord);

module.exports = router;
