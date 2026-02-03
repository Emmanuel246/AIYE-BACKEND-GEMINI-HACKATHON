const express = require("express");
const router = express.Router();
const {
  getAllOrgans,
  getOrganById,
  diagnoseOrgan,
  diagnoseAllOrgans,
  getQuotaStatus,
} = require("../controllers/organController");

// GET /api/organs - Get all organs
router.get("/", getAllOrgans);

// GET /api/organs/quota-status - Get Gemini API quota status
router.get("/quota-status", getQuotaStatus);

// GET /api/organs/:id - Get single organ
router.get("/:id", getOrganById);

// POST /api/organs/:id/diagnose - Run diagnostic on specific organ
router.post("/:id/diagnose", diagnoseOrgan);

// POST /api/organs/diagnose-all - Run diagnostic on all organs
router.post("/diagnose-all", diagnoseAllOrgans);

module.exports = router;
