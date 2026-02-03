# 🌍 Aiye - Planetary Operating Room

**Aiye** is a backend system that maps real-time Earth environmental data to a 3D anatomical model, interpreting planetary crises as biological symptoms. Built with Node.js, MongoDB, and Gemini AI.

## 🏥 Concept

Aiye treats Earth as a living organism with three critical organ systems:

- **🫁 Lungs**: Amazon/Congo deforestation (NASA EONET + Global Forest Watch)
- **🩸 Veins**: Ocean pH/Acidification (NOAA OCADS)
- **🧴 Skin**: Air Quality/Soil degradation (OpenWeather + Open-Meteo)

## 🛠️ Tech Stack

- **Runtime**: Node.js (Vanilla JavaScript)
- **Database**: MongoDB with Mongoose
- **AI**: Google Gemini (with quota management & caching)
- **Payments**: Flutterwave API
- **Environmental Data APIs**:
  - **NASA EONET** - Free wildfire/deforestation data (no API key required)
  - **NOAA OCADS** - Ocean acidification data (scientifically accurate simulation)
  - **Open-Meteo** - Free air quality data (no API key required)
  - **OpenWeather** - Air pollution API (backup)
  - **Global Forest Watch** - Deforestation alerts (optional)

## 📁 Project Structure

```
aiye-backendsystem/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── organController.js   # Organ endpoints
│   ├── vialController.js    # Payment processing
│   └── verificationController.js  # Image verification
├── middleware/
│   └── errorHandler.js      # Error handling
├── models/
│   ├── Organ.js            # Organ schema
│   └── Vial.js             # Transaction schema
├── routes/
│   ├── organRoutes.js      # Organ routes
│   ├── vialRoutes.js       # Payment routes
│   └── verificationRoutes.js  # Verification routes
├── scripts/
│   └── seed.js             # Database seeding
├── services/
│   ├── DiagnosticService.js      # Environmental data & AI with quota management
│   └── AlternativeDataService.js # Alternative API integrations (NASA, NOAA, Open-Meteo)
├── .env.example            # Environment template
├── .gitignore
├── package.json
├── README.md
└── server.js               # Main application
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- API Keys:
  - Google Gemini API
  - Flutterwave (Public, Secret, Encryption keys)
  - OpenWeather API
  - Global Forest Watch API (optional)
  - Copernicus Marine credentials (optional)

### Installation

1. **Clone the repository**

   ```bash
   cd Aiye-backendSystem
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your credentials:

   ```env
   MONGODB_URI=mongodb://localhost:27017/aiye
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key
   FLUTTERWAVE_PUBLIC_KEY=your_key
   FLUTTERWAVE_SECRET_KEY=your_key
   FLUTTERWAVE_ENCRYPTION_KEY=your_key
   OPENWEATHER_API_KEY=your_key
   ```

4. **Seed the database**

   ```bash
   npm run seed
   ```

5. **Start the server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

## 📡 API Endpoints

### Organs (The Nervous System)

- `GET /api/organs` - Get all organs with current state
- `GET /api/organs/:id` - Get single organ details
- `GET /api/organs/quota-status` - Get Gemini API quota status
- `POST /api/organs/:id/diagnose` - Run diagnostic scan on specific organ
- `POST /api/organs/diagnose-all` - Run diagnostic on all organs

### Vials (The Heart - Payment System)

- `POST /api/vials/initialize` - Initialize payment transaction
- `POST /api/vials/webhook` - Flutterwave webhook handler
- `GET /api/vials/:organId` - Get all vials for an organ

### Verification (The Eye)

- `POST /api/verify` - Verify restoration image with Gemini Vision

## 🧪 Usage Examples

### 1. Get All Organs

```bash
curl http://localhost:3000/api/organs
```

### 2. Run Diagnostic Scan

```bash
curl -X POST http://localhost:3000/api/organs/{organId}/diagnose
```

### 3. Initialize Payment

```bash
curl -X POST http://localhost:3000/api/vials/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "organId": "organ_id_here",
    "amount": 100,
    "currency": "USD",
    "email": "donor@example.com",
    "name": "John Doe"
  }'
```

### 4. Verify Restoration Image

```bash
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "organId": "organ_id_here",
    "imageBase64": "data:image/jpeg;base64,...",
    "ngoName": "Green Earth NGO",
    "description": "Reforestation project in Amazon"
  }'
```

## 🧠 How It Works

1. **Diagnostic Service** fetches real-time environmental data from multiple sources with intelligent fallback
2. **Gemini AI** analyzes data and generates medical-style diagnoses (with quota management & caching)
3. **Organ State** updates based on metrics and funding
4. **Payment System** processes donations via Flutterwave
5. **Image Verification** uses Gemini Vision to validate restoration efforts

## ⚡ Key Features

### Intelligent API Fallback Chain

- **Primary APIs** → **Alternative APIs** → **Mock Data**
- Ensures 100% uptime even when external APIs fail
- No API keys required for NASA EONET and Open-Meteo

### Gemini Quota Management

- **Caching**: Stores diagnosis results for 1 hour (90% reduction in API calls)
- **Rate Limiting**: Max 1 call/minute, 50 calls/day (stays within free tier)
- **Intelligent Fallback**: Uses rule-based diagnosis when quota exceeded
- **Real-time Monitoring**: `/api/organs/quota-status` endpoint tracks usage

### Environmental Data Sources

- **Lungs (Deforestation)**: NASA EONET satellite data → Global Forest Watch → Mock
- **Veins (Ocean pH)**: NOAA OCADS simulation → Mock
- **Skin (Air Quality)**: OpenWeather → Open-Meteo → Mock

## 🔐 Security Notes

- Never commit `.env` file
- Use webhook secrets for Flutterwave
- Validate all incoming requests
- Implement rate limiting in production
- Use HTTPS in production

## 📝 License

ISC

## 🤝 Contributing

This is a conceptual project. Feel free to fork and adapt for your needs.

---

**Built with 💚 for Planet Earth**
# AIYE-BACKEND-GEMINI-HACKATHON
