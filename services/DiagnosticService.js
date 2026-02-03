const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const AlternativeDataService = require("./AlternativeDataService");
require("dotenv").config();

class DiagnosticService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.alternativeService = AlternativeDataService;

    // Quota management: Caching
    this.diagnosisCache = new Map();
    this.cacheExpiry = 3600000; // 1 hour in milliseconds

    // Quota management: Rate limiting
    this.lastGeminiCall = 0;
    this.minCallInterval = 60000; // 1 minute between Gemini calls
    this.dailyCallCount = 0;
    this.maxDailyCalls = 50; // Conservative limit for free tier
    this.lastResetDate = new Date().toDateString();
  }

  /**
   * Fetch deforestation data - tries NASA EONET first, then GFW, then mock
   * @param {string} region - Region to query (e.g., 'Amazon')
   * @returns {Promise<Object>} Deforestation metrics
   */
  async fetchDeforestationData(region = "Amazon") {
    // Try NASA EONET API first (free, no API key required)
    try {
      console.log(`Trying NASA EONET API for ${region}...`);
      const nasaData =
        await this.alternativeService.fetchNASAWildfireData(region);

      // If NASA EONET returned real data (not mock), use it
      if (nasaData.dataSource === "NASA EONET") {
        return nasaData;
      }
    } catch (error) {
      console.log("NASA EONET failed, trying GFW...");
    }

    // Try GFW API as fallback
    try {
      // Only try GFW if we have a real API key
      if (
        process.env.GFW_API_KEY &&
        process.env.GFW_API_KEY !== "your_gfw_api_key"
      ) {
        const url =
          "https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts/latest/query";

        const sql = `
          SELECT COUNT(*) as alert_count,
                 SUM(gfw_integrated_alerts__area_ha) as total_area_ha
          FROM data
          WHERE gfw_integrated_alerts__date >= CURRENT_DATE - INTERVAL '30 days'
          AND iso = 'BRA'
        `;

        const response = await axios.get(url, {
          params: { sql },
          headers: {
            "x-api-key": process.env.GFW_API_KEY,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        });

        const data = response.data?.data?.[0];
        if (data) {
          return {
            alertCount: parseInt(data.alert_count) || 0,
            totalAreaHa: parseFloat(data.total_area_ha) || 0,
            region: region,
            dataSource: "Global Forest Watch",
            timestamp: new Date().toISOString(),
          };
        }
      }
    } catch (error) {
      console.error("GFW API failed:", error.message);
    }

    // Final fallback to realistic mock data
    console.log("Using mock deforestation data...");
    const mockAlertCount = Math.floor(Math.random() * 1000) + 500;
    return {
      alertCount: mockAlertCount,
      totalAreaHa: Math.floor(mockAlertCount * 5),
      region: region,
      dataSource: "Mock Data (Realistic)",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Fetch ocean pH data - uses NOAA alternative (Copernicus is deprecated)
   * @param {string} location - Location to query
   * @returns {Promise<Object>} Ocean pH metrics
   */
  async fetchOceanPHData(location = "Great Barrier Reef") {
    // Use NOAA Ocean Acidification Data System (alternative to Copernicus)
    try {
      console.log(`Fetching ocean pH data from NOAA for ${location}...`);
      const noaaData =
        await this.alternativeService.fetchNOAAOceanData(location);
      return noaaData;
    } catch (error) {
      console.error("Error fetching NOAA ocean data:", error.message);

      // Fallback to scientifically accurate simulated data
      const mockPH = 7.9 + Math.random() * 0.2;
      return {
        pH: mockPH,
        location: location,
        dataSource: "NOAA OCADS (Mock)",
        timestamp: new Date().toISOString(),
        acidificationLevel: mockPH < 8.0 ? "HIGH" : "MODERATE",
        error: error.message,
      };
    }
  }

  /**
   * Fetch air quality data - tries OpenWeather first, then Open-Meteo
   * @param {string} city - City to query
   * @returns {Promise<Object>} Air quality metrics
   */
  async fetchAirQualityData(city = "Lagos") {
    // Try OpenWeather API first
    try {
      console.log(`Trying OpenWeather API for ${city}...`);
      // First get coordinates for the city
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct`;
      const geoResponse = await axios.get(geoUrl, {
        params: {
          q: city,
          limit: 1,
          appid: process.env.OPENWEATHER_API_KEY,
        },
        timeout: 10000,
      });

      const { lat, lon } = geoResponse.data[0] || { lat: 6.5244, lon: 3.3792 }; // Lagos default

      // Get air quality data
      const aqUrl = `http://api.openweathermap.org/data/2.5/air_pollution`;
      const aqResponse = await axios.get(aqUrl, {
        params: {
          lat,
          lon,
          appid: process.env.OPENWEATHER_API_KEY,
        },
        timeout: 10000,
      });

      const aqData = aqResponse.data?.list?.[0] || {};
      const components = aqData.components || {};

      console.log(
        `✅ OpenWeather: AQI ${aqData.main?.aqi}, PM2.5 ${components.pm2_5}`,
      );
      return {
        aqi: aqData.main?.aqi || 3,
        pm25: components.pm2_5 || 0,
        pm10: components.pm10 || 0,
        no2: components.no2 || 0,
        location: city,
        dataSource: "OpenWeather",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("OpenWeather failed:", error.message);

      // Try Open-Meteo as alternative (free, no API key)
      try {
        console.log(`Trying Open-Meteo API for ${city}...`);
        const openMeteoData =
          await this.alternativeService.fetchOpenMeteoAirQuality(city);

        // If Open-Meteo returned real data, use it
        if (openMeteoData.dataSource === "Open-Meteo") {
          return openMeteoData;
        }
      } catch (meteoError) {
        console.error("Open-Meteo failed:", meteoError.message);
      }

      // Final fallback to mock data
      console.log("Using mock air quality data...");
      return {
        aqi: Math.floor(Math.random() * 3) + 3, // AQI 3-5
        pm25: Math.random() * 50 + 25,
        pm10: Math.random() * 80 + 40,
        no2: Math.random() * 40 + 20,
        location: city,
        dataSource: "Mock Data (Realistic)",
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  /**
   * Reset daily call counter if it's a new day
   */
  resetDailyCounterIfNeeded() {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.dailyCallCount = 0;
      this.lastResetDate = today;
      console.log("🔄 Daily Gemini call counter reset");
    }
  }

  /**
   * Generate diagnosis using Gemini 3 Flash with quota management
   * Implements caching and rate limiting to stay within free tier limits
   * @param {Object} metrics - Environmental metrics data
   * @param {string} organType - Type of organ (Lungs/Veins/Skin)
   * @returns {Promise<Object>} Diagnosis object with status and description
   */
  async generateDiagnosis(metrics, organType) {
    // Reset daily counter if needed
    this.resetDailyCounterIfNeeded();

    // Step 1: Check cache first
    const cacheKey = `${organType}-${JSON.stringify(metrics)}`;
    const cached = this.diagnosisCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log("✅ Using cached diagnosis (quota saved)");
      return cached.data;
    }

    // Step 2: Check if we should use Gemini (rate limiting)
    const now = Date.now();
    const timeSinceLastCall = now - this.lastGeminiCall;
    const shouldUseGemini =
      timeSinceLastCall >= this.minCallInterval &&
      this.dailyCallCount < this.maxDailyCalls;

    if (!shouldUseGemini) {
      const reason =
        this.dailyCallCount >= this.maxDailyCalls
          ? `daily limit reached (${this.dailyCallCount}/${this.maxDailyCalls})`
          : `rate limit (${Math.round(timeSinceLastCall / 1000)}s since last call)`;
      console.log(`⏱️ Gemini ${reason} - using rule-based diagnosis`);
      const ruleBased = this.generateRuleBasedDiagnosis(metrics, organType);

      // Cache rule-based diagnosis too
      this.diagnosisCache.set(cacheKey, {
        data: ruleBased,
        timestamp: now,
      });

      return ruleBased;
    }

    // Step 3: Try Gemini API
    try {
      console.log(
        `🤖 Calling Gemini AI (${this.dailyCallCount + 1}/${this.maxDailyCalls} today)`,
      );

      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024,
        },
      });

      // Construct medical-style prompt
      const prompt = `You are a planetary physician examining Earth as a living organism. Analyze the following environmental data and provide a visceral medical diagnosis.

Organ Type: ${organType}
Environmental Metrics: ${JSON.stringify(metrics, null, 2)}

Based on this data, provide a diagnosis in the following JSON format ONLY (no additional text):
{
  "diagnosis": "A short, visceral medical brief (2-3 sentences) describing the organ's condition using medical terminology",
  "status": "INFLAMED or HEALTHY"
}

Guidelines:
- For LUNGS: Deforestation = respiratory distress. High alerts = INFLAMED, low alerts = HEALTHY
- For VEINS: Ocean acidification = circulatory issues. pH < 8.0 = INFLAMED, pH >= 8.1 = HEALTHY
- For SKIN: Air pollution = dermatological damage. High AQI/PM2.5 = INFLAMED, low values = HEALTHY
- Use medical language: "acute inflammation", "chronic degradation", "tissue regeneration", etc.
- Be dramatic but scientifically grounded

Return ONLY the JSON object, nothing else.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON from response
      let diagnosisData;
      try {
        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          diagnosisData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError);
        // Fallback diagnosis
        diagnosisData = {
          diagnosis: `Environmental stress detected in ${organType}. Immediate intervention required.`,
          status: "INFLAMED",
        };
      }

      // Validate status
      if (!["INFLAMED", "HEALTHY"].includes(diagnosisData.status)) {
        diagnosisData.status = "INFLAMED";
      }

      // Update quota tracking
      this.lastGeminiCall = now;
      this.dailyCallCount++;
      console.log(
        `✅ Gemini diagnosis generated (${this.dailyCallCount}/${this.maxDailyCalls} used today)`,
      );

      // Cache the successful result
      this.diagnosisCache.set(cacheKey, {
        data: diagnosisData,
        timestamp: now,
      });

      return diagnosisData;
    } catch (error) {
      console.error("Error generating diagnosis with Gemini:", error.message);
      console.log("Using rule-based diagnosis fallback...");

      // Generate intelligent fallback diagnosis based on metrics
      const fallbackDiagnosis = this.generateRuleBasedDiagnosis(
        metrics,
        organType,
      );

      // Cache the fallback too
      this.diagnosisCache.set(cacheKey, {
        data: fallbackDiagnosis,
        timestamp: now,
      });

      return fallbackDiagnosis;
    }
  }

  /**
   * Generate rule-based diagnosis when Gemini is unavailable
   * @param {Object} metrics - Environmental metrics
   * @param {string} organType - Type of organ
   * @returns {Object} Diagnosis data
   */
  generateRuleBasedDiagnosis(metrics, organType) {
    let diagnosis = "";
    let status = "HEALTHY";
    let severity = "LOW";

    switch (organType) {
      case "Lungs":
        const alertCount = metrics.alertCount || 0;
        if (alertCount > 1000) {
          status = "INFLAMED";
          severity = "CRITICAL";
          diagnosis = `CRITICAL RESPIRATORY DISTRESS: ${alertCount.toLocaleString()} deforestation alerts detected in ${metrics.region}. Massive tissue damage observed. Area affected: ${metrics.totalAreaHa?.toLocaleString() || "N/A"} hectares. Immediate intervention required to prevent irreversible damage.`;
        } else if (alertCount > 500) {
          status = "INFLAMED";
          severity = "HIGH";
          diagnosis = `ACUTE INFLAMMATION: ${alertCount.toLocaleString()} deforestation events compromising respiratory function in ${metrics.region}. Significant tissue degradation detected. Urgent restoration protocols recommended.`;
        } else if (alertCount > 200) {
          status = "INFLAMED";
          severity = "MODERATE";
          diagnosis = `MODERATE STRESS: ${alertCount} deforestation alerts indicate early-stage respiratory compromise in ${metrics.region}. Preventive measures advised to avoid progression.`;
        } else {
          status = "HEALTHY";
          diagnosis = `STABLE CONDITION: Minimal deforestation activity (${alertCount} alerts) in ${metrics.region}. Respiratory function within normal parameters. Continue monitoring.`;
        }
        break;

      case "Veins":
        const pH = metrics.pH || 8.1;
        if (pH < 7.9) {
          status = "INFLAMED";
          severity = "CRITICAL";
          diagnosis = `SEVERE ACIDOSIS: Ocean pH at ${pH.toFixed(3)} in ${metrics.location}. Critical acidification threatening circulatory system integrity. Coral bleaching and marine ecosystem collapse imminent. Emergency alkalinity restoration required.`;
        } else if (pH < 8.0) {
          status = "INFLAMED";
          severity = "HIGH";
          diagnosis = `ACUTE ACIDIFICATION: pH level ${pH.toFixed(3)} detected in ${metrics.location}. Circulatory system under significant stress. ${metrics.acidificationLevel} acidification level compromising vascular health. Immediate buffering intervention needed.`;
        } else if (pH < 8.1) {
          status = "INFLAMED";
          severity = "MODERATE";
          diagnosis = `EARLY ACIDOSIS: pH ${pH.toFixed(3)} in ${metrics.location} indicates moderate circulatory stress. ${metrics.acidificationLevel} acidification detected. Preventive measures recommended.`;
        } else {
          status = "HEALTHY";
          diagnosis = `OPTIMAL CIRCULATION: Ocean pH at ${pH.toFixed(3)} in ${metrics.location}. Vascular system functioning normally. Acidification levels within safe parameters.`;
        }
        break;

      case "Skin":
        const aqi = metrics.aqi || 1;
        const pm25 = metrics.pm25 || 0;
        if (aqi >= 4 || pm25 > 35) {
          status = "INFLAMED";
          severity = "CRITICAL";
          diagnosis = `SEVERE DERMAL TOXICITY: Air Quality Index ${aqi} (Unhealthy) in ${metrics.location}. PM2.5 particulate matter at ${pm25.toFixed(2)} μg/m³. Skin barrier severely compromised. Toxic exposure causing cellular damage. Immediate air purification required.`;
        } else if (aqi >= 3 || pm25 > 25) {
          status = "INFLAMED";
          severity = "HIGH";
          diagnosis = `ACUTE IRRITATION: AQI ${aqi} with PM2.5 at ${pm25.toFixed(2)} μg/m³ in ${metrics.location}. Moderate air pollution causing dermal stress. Protective measures advised.`;
        } else if (aqi >= 2 || pm25 > 12) {
          status = "INFLAMED";
          severity = "MODERATE";
          diagnosis = `MILD INFLAMMATION: AQI ${aqi}, PM2.5 ${pm25.toFixed(2)} μg/m³ in ${metrics.location}. Acceptable air quality but showing early signs of environmental stress. Monitor closely.`;
        } else {
          status = "HEALTHY";
          diagnosis = `HEALTHY EPIDERMIS: Air quality excellent in ${metrics.location}. AQI ${aqi}, PM2.5 ${pm25.toFixed(2)} μg/m³. Skin barrier functioning optimally. No intervention needed.`;
        }
        break;

      default:
        diagnosis = `Environmental monitoring active for ${organType}. Awaiting detailed analysis.`;
        status = "INFLAMED";
    }

    return {
      diagnosis,
      status,
      severity,
      source: "Rule-based diagnostic system",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Perform complete diagnostic scan for an organ
   * @param {Object} organ - Organ document from database
   * @returns {Promise<Object>} Complete diagnostic results
   */
  async performDiagnosticScan(organ) {
    try {
      let metrics;

      // Fetch appropriate metrics based on organ type
      switch (organ.type) {
        case "Lungs":
          metrics = await this.fetchDeforestationData(
            organ.name.includes("Amazon") ? "Amazon" : "Congo",
          );
          break;
        case "Veins":
          metrics = await this.fetchOceanPHData(
            organ.name.includes("Barrier") ? "Great Barrier Reef" : "Ocean",
          );
          break;
        case "Skin":
          metrics = await this.fetchAirQualityData(
            organ.name.includes("Lagos") ? "Lagos" : "Delhi",
          );
          break;
        default:
          throw new Error(`Unknown organ type: ${organ.type}`);
      }

      // Generate diagnosis using Gemini
      const diagnosisResult = await this.generateDiagnosis(metrics, organ.type);

      // Calculate health score based on metrics and diagnosis
      let healthScore = organ.healthScore;

      if (organ.type === "Lungs" && metrics.alertCount) {
        healthScore = Math.max(0, 100 - metrics.alertCount / 10);
      } else if (organ.type === "Veins" && metrics.pH) {
        healthScore = Math.min(100, (metrics.pH - 7.5) * 200);
      } else if (organ.type === "Skin" && metrics.aqi) {
        healthScore = Math.max(0, 100 - metrics.aqi * 15);
      }

      return {
        metrics,
        diagnosis: diagnosisResult.diagnosis,
        status: diagnosisResult.status,
        healthScore: Math.round(healthScore),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error performing diagnostic scan:", error.message);
      throw error;
    }
  }
}

module.exports = new DiagnosticService();
