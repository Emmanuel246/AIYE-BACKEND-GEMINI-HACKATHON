const Organ = require("../models/Organ");
const diagnosticService = require("../services/DiagnosticService");

/**
 * Get all organs with their current state
 * @route GET /api/organs
 */
const getAllOrgans = async (req, res) => {
  try {
    const organs = await Organ.find({}).sort({ type: 1 });

    // Format response with full state including diagnosis
    const organsWithState = organs.map((organ) => ({
      id: organ._id,
      name: organ.name,
      type: organ.type,
      healthScore: organ.healthScore,
      symptomState: organ.symptomState,
      currentFundingUSD: organ.currentFundingUSD,
      targetFundingUSD: organ.targetFundingUSD,
      fundingPercentage: organ.fundingPercentage,
      lastMetricValue: organ.lastMetricValue,
      diagnosis: organ.diagnosis,
      lastUpdated: organ.lastUpdated,
      createdAt: organ.createdAt,
      updatedAt: organ.updatedAt,
    }));

    res.status(200).json({
      success: true,
      count: organsWithState.length,
      data: organsWithState,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching organs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch organs",
      error: error.message,
    });
  }
};

/**
 * Get a single organ by ID
 * @route GET /api/organs/:id
 */
const getOrganById = async (req, res) => {
  try {
    const { id } = req.params;
    const organ = await Organ.findById(id);

    if (!organ) {
      return res.status(404).json({
        success: false,
        message: "Organ not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: organ._id,
        name: organ.name,
        type: organ.type,
        healthScore: organ.healthScore,
        symptomState: organ.symptomState,
        currentFundingUSD: organ.currentFundingUSD,
        targetFundingUSD: organ.targetFundingUSD,
        fundingPercentage: organ.fundingPercentage,
        lastMetricValue: organ.lastMetricValue,
        diagnosis: organ.diagnosis,
        lastUpdated: organ.lastUpdated,
        createdAt: organ.createdAt,
        updatedAt: organ.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching organ:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch organ",
      error: error.message,
    });
  }
};

/**
 * Run diagnostic scan on a specific organ
 * @route POST /api/organs/:id/diagnose
 */
const diagnoseOrgan = async (req, res) => {
  try {
    const { id } = req.params;
    const organ = await Organ.findById(id);

    if (!organ) {
      return res.status(404).json({
        success: false,
        message: "Organ not found",
      });
    }

    console.log(`Running diagnostic scan on ${organ.name}...`);

    // Perform diagnostic scan
    const diagnosticResult =
      await diagnosticService.performDiagnosticScan(organ);

    // Update organ with diagnostic results
    organ.lastMetricValue = diagnosticResult.metrics;
    organ.diagnosis = diagnosticResult.diagnosis;
    organ.symptomState = diagnosticResult.status;
    organ.healthScore = diagnosticResult.healthScore;
    organ.lastUpdated = new Date();

    await organ.save();

    console.log(
      `✓ Diagnostic complete: ${organ.name} - ${diagnosticResult.status}`,
    );

    res.status(200).json({
      success: true,
      data: {
        organId: organ._id,
        organName: organ.name,
        diagnosticResult: {
          metrics: diagnosticResult.metrics,
          diagnosis: diagnosticResult.diagnosis,
          status: diagnosticResult.status,
          healthScore: diagnosticResult.healthScore,
          timestamp: diagnosticResult.timestamp,
        },
        updatedOrgan: {
          id: organ._id,
          name: organ.name,
          type: organ.type,
          healthScore: organ.healthScore,
          symptomState: organ.symptomState,
          diagnosis: organ.diagnosis,
          lastMetricValue: organ.lastMetricValue,
        },
      },
    });
  } catch (error) {
    console.error("Error diagnosing organ:", error);
    res.status(500).json({
      success: false,
      message: "Diagnostic scan failed",
      error: error.message,
    });
  }
};

/**
 * Run diagnostic scan on all organs
 * @route POST /api/organs/diagnose-all
 */
const diagnoseAllOrgans = async (req, res) => {
  try {
    const organs = await Organ.find({});
    const results = [];

    console.log(`Running diagnostic scan on all ${organs.length} organs...`);

    for (const organ of organs) {
      try {
        const diagnosticResult =
          await diagnosticService.performDiagnosticScan(organ);

        organ.lastMetricValue = diagnosticResult.metrics;
        organ.diagnosis = diagnosticResult.diagnosis;
        organ.symptomState = diagnosticResult.status;
        organ.healthScore = diagnosticResult.healthScore;
        organ.lastUpdated = new Date();

        await organ.save();

        results.push({
          organId: organ._id,
          organName: organ.name,
          status: "success",
          diagnosis: diagnosticResult.diagnosis,
        });

        console.log(`✓ ${organ.name}: ${diagnosticResult.status}`);
      } catch (error) {
        console.error(`✗ Error diagnosing ${organ.name}:`, error.message);
        results.push({
          organId: organ._id,
          organName: organ.name,
          status: "error",
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Diagnostic scan completed for ${results.length} organs`,
      data: results,
    });
  } catch (error) {
    console.error("Error diagnosing all organs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to diagnose all organs",
      error: error.message,
    });
  }
};

/**
 * Get Gemini API quota status
 * @route GET /api/organs/quota-status
 */
const getQuotaStatus = async (req, res) => {
  try {
    const quotaInfo = {
      dailyCallsUsed: diagnosticService.dailyCallCount,
      dailyCallsLimit: diagnosticService.maxDailyCalls,
      remainingCalls:
        diagnosticService.maxDailyCalls - diagnosticService.dailyCallCount,
      percentageUsed: (
        (diagnosticService.dailyCallCount / diagnosticService.maxDailyCalls) *
        100
      ).toFixed(1),
      lastResetDate: diagnosticService.lastResetDate,
      lastGeminiCall:
        diagnosticService.lastGeminiCall > 0
          ? new Date(diagnosticService.lastGeminiCall).toISOString()
          : null,
      cacheSize: diagnosticService.diagnosisCache.size,
      cacheExpiryMinutes: diagnosticService.cacheExpiry / 1000 / 60,
      minCallIntervalSeconds: diagnosticService.minCallInterval / 1000,
      status:
        diagnosticService.dailyCallCount < diagnosticService.maxDailyCalls
          ? "AVAILABLE"
          : "QUOTA_EXCEEDED",
      message:
        diagnosticService.dailyCallCount < diagnosticService.maxDailyCalls
          ? `${diagnosticService.maxDailyCalls - diagnosticService.dailyCallCount} Gemini calls remaining today`
          : "Daily quota reached. Using rule-based diagnosis.",
    };

    res.status(200).json({
      success: true,
      data: quotaInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching quota status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quota status",
      error: error.message,
    });
  }
};

module.exports = {
  getAllOrgans,
  getOrganById,
  diagnoseOrgan,
  diagnoseAllOrgans,
  getQuotaStatus,
};
