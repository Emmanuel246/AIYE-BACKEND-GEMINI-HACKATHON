const mongoose = require("mongoose");
require("dotenv").config();
const Organ = require("../models/Organ");

const seedOrgans = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB");

    // Clear existing organs
    await Organ.deleteMany({});
    console.log("Cleared existing organs");

    // Define the three organs
    const organs = [
      {
        name: "Amazon Lungs",
        type: "Lungs",
        healthScore: 35,
        symptomState: "INFLAMED",
        currentFundingUSD: 0,
        targetFundingUSD: 500000,
        lastMetricValue: {
          deforestationAlerts: 0,
          region: "Amazon Basin",
          dataSource: "Global Forest Watch",
        },
        diagnosis: "Awaiting initial diagnostic scan...",
      },
      {
        name: "Great Barrier Reef Veins",
        type: "Veins",
        healthScore: 42,
        symptomState: "INFLAMED",
        currentFundingUSD: 0,
        targetFundingUSD: 750000,
        lastMetricValue: {
          pH: 0,
          location: "Great Barrier Reef",
          dataSource: "Copernicus Marine",
        },
        diagnosis: "Awaiting initial diagnostic scan...",
      },
      {
        name: "Lagos Skin",
        type: "Skin",
        healthScore: 28,
        symptomState: "INFLAMED",
        currentFundingUSD: 0,
        targetFundingUSD: 300000,
        lastMetricValue: {
          aqi: 0,
          pm25: 0,
          location: "Lagos, Nigeria",
          dataSource: "OpenWeather",
        },
        diagnosis: "Awaiting initial diagnostic scan...",
      },
    ];

    // Insert organs
    const createdOrgans = await Organ.insertMany(organs);
    console.log(`Successfully seeded ${createdOrgans.length} organs:`);
    createdOrgans.forEach((organ) => {
      console.log(
        `  - ${organ.name} (${organ.type}): Health Score ${organ.healthScore}`,
      );
    });

    // Close connection
    await mongoose.connection.close();
    console.log("Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedOrgans();
