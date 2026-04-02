const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const authenticate = require("../middleware/auth");
const { requireRole } = require("../middleware/roleCheck");

// All user management routes are admin-only
router.use(authenticate, requireRole("admin"));

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
