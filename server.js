const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/database");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// Import routes
const organRoutes = require("./routes/organRoutes");
const vialRoutes = require("./routes/vialRoutes");
const verificationRoutes = require("./routes/verificationRoutes");

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Aiye Backend System - Planetary Operating Room",
    version: "1.0.0",
    status: "operational",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/organs", organRoutes);
app.use("/api/vials", vialRoutes);
app.use("/api/verify", verificationRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log("🌍 AIYE - Planetary Operating Room");
  console.log("=".repeat(60));
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log("=".repeat(60));
  console.log("Available Endpoints:");
  console.log("  GET    /api/organs              - Get all organs");
  console.log("  GET    /api/organs/quota-status - Get Gemini quota status");
  console.log("  GET    /api/organs/:id          - Get single organ");
  console.log("  POST   /api/organs/:id/diagnose - Run diagnostic scan");
  console.log("  POST   /api/organs/diagnose-all - Scan all organs");
  console.log("  POST   /api/vials/initialize    - Initialize payment");
  console.log("  POST   /api/vials/webhook       - Flutterwave webhook");
  console.log("  GET    /api/vials/:organId      - Get organ vials");
  console.log("  POST   /api/verify              - Verify restoration image");
  console.log("=".repeat(60));
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  // Close server & exit process
  process.exit(1);
});

module.exports = app;
