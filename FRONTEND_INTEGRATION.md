# 🌍 Aiye Frontend Integration Guide

Complete API documentation for integrating with the Aiye Planetary Operating Room backend system.

## 📋 Table of Contents

- [Base URL & Environment](#base-url--environment)
- [API Endpoints](#api-endpoints)
- [Request/Response Schemas](#requestresponse-schemas)
- [Error Handling](#error-handling)
- [Code Examples](#code-examples)
- [Real-time Updates](#real-time-updates)
- [Best Practices](#best-practices)

---

## 🔗 Base URL & Environment

### Development

```
http://localhost:3000
```

### Production

```
https://your-production-domain.com
```

### Environment Variables (Frontend)

```env
VITE_API_BASE_URL=http://localhost:3000
REACT_APP_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

---

## 📡 API Endpoints

### 1. Health Check

#### `GET /health`

Check if the API is operational.

**Response:**

```json
{
  "success": true,
  "status": "healthy",
  "uptime": 12345.67,
  "timestamp": "2026-01-30T20:00:00.000Z"
}
```

---

### 2. Organs API

#### `GET /api/organs`

Get all organs with their current state.

**Response:**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "65f1234567890abcdef12345",
      "name": "Amazon Lungs",
      "type": "Lungs",
      "healthScore": 35,
      "symptomState": "INFLAMED",
      "currentFundingUSD": 12500,
      "targetFundingUSD": 500000,
      "fundingPercentage": 2.5,
      "lastMetricValue": {
        "alertCount": 245,
        "totalAreaHa": 1225,
        "region": "Amazon",
        "dataSource": "NASA EONET"
      },
      "diagnosis": "Critical deforestation detected...",
      "lastUpdated": "2026-01-30T19:45:00.000Z",
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-01-30T19:45:00.000Z"
    }
  ],
  "timestamp": "2026-01-30T20:00:00.000Z"
}
```

**Organ Types:**

- `Lungs` - Deforestation/Forest health
- `Veins` - Ocean pH/Acidification
- `Skin` - Air quality/Soil health

**Symptom States:**

- `HEALTHY` - Organ is in good condition
- `INFLAMED` - Organ is experiencing stress/damage
- `HEALING` - Organ is recovering

---

#### `GET /api/organs/:id`

Get a single organ by ID.

**Parameters:**

- `id` (path) - MongoDB ObjectId of the organ

**Response:** Same structure as single organ in GET /api/organs

**Error Response (404):**

```json
{
  "success": false,
  "message": "Organ not found"
}
```

---

#### `GET /api/organs/quota-status`

Get Gemini API quota status and usage information.

**Response:**

```json
{
  "success": true,
  "data": {
    "dailyCallsUsed": 12,
    "dailyCallsLimit": 50,
    "remainingCalls": 38,
    "percentageUsed": "24.0",
    "lastResetDate": "Fri Jan 30 2026",
    "lastGeminiCall": "2026-01-30T19:30:00.000Z",
    "cacheSize": 3,
    "cacheExpiryMinutes": 60,
    "minCallIntervalSeconds": 60,
    "status": "AVAILABLE",
    "message": "38 Gemini calls remaining today"
  },
  "timestamp": "2026-01-30T20:00:00.000Z"
}
```

**Status Values:**

- `AVAILABLE` - Quota available for Gemini calls
- `QUOTA_EXCEEDED` - Daily limit reached, using fallback diagnosis

---

#### `POST /api/organs/:id/diagnose`

Run diagnostic scan on a specific organ.

**Parameters:**

- `id` (path) - MongoDB ObjectId of the organ

**Response:**

```json
{
  "success": true,
  "data": {
    "organId": "65f1234567890abcdef12345",
    "organName": "Amazon Lungs",
    "diagnosticResult": {
      "metrics": {
        "alertCount": 245,
        "totalAreaHa": 1225,
        "region": "Amazon",
        "dataSource": "NASA EONET",
        "timestamp": "2026-01-30T20:00:00.000Z"
      },
      "diagnosis": "Critical deforestation detected in Amazon region...",
      "status": "INFLAMED",
      "healthScore": 35,
      "timestamp": "2026-01-30T20:00:00.000Z"
    },
    "updatedOrgan": {
      "id": "65f1234567890abcdef12345",
      "name": "Amazon Lungs",
      "type": "Lungs",
      "healthScore": 35,
      "symptomState": "INFLAMED",
      "diagnosis": "Critical deforestation detected...",
      "lastMetricValue": { ... }
    }
  }
}
```

---

#### `POST /api/organs/diagnose-all`

Run diagnostic scan on all organs sequentially.

**Response:**

```json
{
  "success": true,
  "message": "Diagnostic scan completed for 3 organs",
  "data": [
    {
      "organId": "65f1234567890abcdef12345",
      "organName": "Amazon Lungs",
      "status": "success",
      "diagnosis": "Critical deforestation detected..."
    },
    {
      "organId": "65f1234567890abcdef12346",
      "organName": "Great Barrier Reef Veins",
      "status": "success",
      "diagnosis": "Ocean acidification levels concerning..."
    },
    {
      "organId": "65f1234567890abcdef12347",
      "organName": "Lagos Skin",
      "status": "success",
      "diagnosis": "Air quality severely degraded..."
    }
  ]
}
```

---

### 3. Vials API (Payments)

#### `POST /api/vials/initialize`

Initialize a payment transaction for an organ.

**Request Body:**

```json
{
  "organId": "65f1234567890abcdef12345",
  "amount": 100,
  "currency": "USD",
  "email": "donor@example.com",
  "name": "John Doe"
}
```

**Field Descriptions:**

- `organId` (required) - MongoDB ObjectId of the organ to fund
- `amount` (required) - Payment amount (number)
- `currency` (optional) - Currency code (default: "USD")
- `email` (required) - Donor email address
- `name` (required) - Donor full name

**Response:**

```json
{
  "success": true,
  "data": {
    "vialId": "65f9876543210fedcba98765",
    "paymentLink": "https://checkout.flutterwave.com/v3/hosted/pay/abc123xyz",
    "txRef": "VIAL-65f1234567890abcdef12345-1738267200000"
  }
}
```

**Usage:**

1. Call this endpoint to initialize payment
2. Redirect user to `paymentLink` URL
3. User completes payment on Flutterwave
4. Flutterwave sends webhook to backend
5. Backend updates organ funding automatically

---

#### `GET /api/vials/:organId`

Get all successful vials (donations) for an organ.

**Parameters:**

- `organId` (path) - MongoDB ObjectId of the organ

**Response:**

```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "_id": "65f9876543210fedcba98765",
      "organId": "65f1234567890abcdef12345",
      "transactionRef": "VIAL-65f1234567890abcdef12345-1738267200000",
      "amountUSD": 100,
      "currency": "USD",
      "donorEmail": "donor@example.com",
      "donorName": "John Doe",
      "status": "SUCCESS",
      "processedAt": "2026-01-30T19:00:00.000Z",
      "createdAt": "2026-01-30T18:55:00.000Z",
      "updatedAt": "2026-01-30T19:00:00.000Z"
    }
  ]
}
```

**Note:** Only returns vials with status "SUCCESS" (limit: 50 most recent)

---

### 4. Verification API

#### `POST /api/verify`

Verify restoration image using Gemini Vision AI.

**Request Body:**

```json
{
  "organId": "65f1234567890abcdef12345",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "ngoName": "Green Earth Initiative",
  "description": "Reforestation project showing new tree growth in Amazon region"
}
```

**Field Descriptions:**

- `organId` (required) - MongoDB ObjectId of the organ
- `imageBase64` (required) - Base64 encoded image with data URL prefix or raw base64
- `ngoName` (optional) - Name of NGO submitting verification
- `description` (optional) - Description of restoration effort

**Supported Image Formats:**

- JPEG, PNG, WebP
- Max size: 50MB (base64 encoded)
- Recommended: < 5MB for faster processing

**Response:**

```json
{
  "success": true,
  "data": {
    "organId": "65f1234567890abcdef12345",
    "organName": "Amazon Lungs",
    "previousState": "INFLAMED",
    "newState": "HEALING",
    "verification": {
      "verified": true,
      "confidence": 85,
      "analysis": "Image shows healthy new tree growth with diverse vegetation...",
      "recommendation": "PARTIAL"
    }
  }
}
```

**Verification Recommendations:**

- `APPROVE` - Organ marked as HEALTHY (+20 health score)
- `PARTIAL` - Organ marked as HEALING (+10 health score)
- `REJECT` - Organ state unchanged

---

## 📦 Request/Response Schemas

### TypeScript Interfaces

```typescript
// Organ Interface
interface Organ {
  id: string;
  name: string;
  type: "Lungs" | "Veins" | "Skin";
  healthScore: number; // 0-100
  symptomState: "HEALTHY" | "INFLAMED" | "HEALING";
  currentFundingUSD: number;
  targetFundingUSD: number;
  fundingPercentage: number;
  lastMetricValue: Record<string, any>;
  diagnosis: string;
  lastUpdated: string; // ISO 8601
  createdAt: string;
  updatedAt: string;
}

// Vial Interface
interface Vial {
  _id: string;
  organId: string;
  transactionRef: string;
  amountUSD: number;
  currency: string;
  donorEmail: string;
  donorName: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Quota Status Interface
interface QuotaStatus {
  dailyCallsUsed: number;
  dailyCallsLimit: number;
  remainingCalls: number;
  percentageUsed: string;
  lastResetDate: string;
  lastGeminiCall: string | null;
  cacheSize: number;
  cacheExpiryMinutes: number;
  minCallIntervalSeconds: number;
  status: "AVAILABLE" | "QUOTA_EXCEEDED";
  message: string;
}

// API Response Wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}
```

---

## ⚠️ Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid webhook signature)
- `404` - Not Found (organ/vial not found)
- `500` - Internal Server Error

### Common Error Scenarios

#### 1. Organ Not Found (404)

```json
{
  "success": false,
  "message": "Organ not found"
}
```

#### 2. Invalid Request Body (400)

```json
{
  "success": false,
  "message": "organId and imageBase64 are required"
}
```

#### 3. Diagnostic Scan Failed (500)

```json
{
  "success": false,
  "message": "Diagnostic scan failed",
  "error": "API timeout error"
}
```

### Error Handling Best Practices

```typescript
async function fetchOrgans() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/organs`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Unknown error");
    }

    return data.data;
  } catch (error) {
    console.error("Failed to fetch organs:", error);
    throw error;
  }
}
```

---

## 💻 Code Examples

### React/Next.js Examples

#### 1. Fetch All Organs

```typescript
import { useState, useEffect } from "react";

interface Organ {
  id: string;
  name: string;
  type: string;
  healthScore: number;
  symptomState: string;
  currentFundingUSD: number;
  targetFundingUSD: number;
  fundingPercentage: number;
  diagnosis: string;
}

export function useOrgans() {
  const [organs, setOrgans] = useState<Organ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrgans() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organs`,
        );
        const data = await response.json();

        if (data.success) {
          setOrgans(data.data);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError("Failed to fetch organs");
      } finally {
        setLoading(false);
      }
    }

    fetchOrgans();
  }, []);

  return { organs, loading, error };
}
```

#### 2. Run Diagnostic Scan

```typescript
async function runDiagnosticScan(organId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organs/${organId}/diagnose`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    return data.data;
  } catch (error) {
    console.error('Diagnostic scan failed:', error);
    throw error;
  }
}

// Usage in component
function DiagnosticButton({ organId }: { organId: string }) {
  const [loading, setLoading] = useState(false);

  const handleDiagnose = async () => {
    setLoading(true);
    try {
      const result = await runDiagnosticScan(organId);
      console.log('Diagnostic result:', result);
      // Update UI with result
    } catch (error) {
      alert('Failed to run diagnostic scan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDiagnose} disabled={loading}>
      {loading ? 'Scanning...' : 'Run Diagnostic'}
    </button>
  );
}
```

#### 3. Initialize Payment

```typescript
async function initializePayment(
  organId: string,
  amount: number,
  email: string,
  name: string
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vials/initialize`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organId,
          amount,
          currency: 'USD',
          email,
          name,
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    // Redirect to payment link
    window.location.href = data.data.paymentLink;
  } catch (error) {
    console.error('Payment initialization failed:', error);
    throw error;
  }
}

// Usage in component
function DonateButton({ organ }: { organ: Organ }) {
  const handleDonate = async () => {
    const email = prompt('Enter your email:');
    const name = prompt('Enter your name:');
    const amount = parseFloat(prompt('Enter donation amount (USD):') || '0');

    if (email && name && amount > 0) {
      await initializePayment(organ.id, amount, email, name);
    }
  };

  return <button onClick={handleDonate}>Donate to {organ.name}</button>;
}
```

#### 4. Upload and Verify Image

```typescript
async function verifyRestorationImage(
  organId: string,
  imageFile: File,
  ngoName: string,
  description: string
) {
  // Convert image to base64
  const base64Image = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organId,
          imageBase64: base64Image,
          ngoName,
          description,
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    return data.data;
  } catch (error) {
    console.error('Image verification failed:', error);
    throw error;
  }
}

// Usage in component
function ImageVerificationForm({ organId }: { organId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [ngoName, setNgoName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      const result = await verifyRestorationImage(
        organId,
        file,
        ngoName,
        description
      );
      alert(`Verification ${result.verification.verified ? 'successful' : 'failed'}`);
    } catch (error) {
      alert('Failed to verify image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <input
        type="text"
        placeholder="NGO Name"
        value={ngoName}
        onChange={(e) => setNgoName(e.target.value)}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button type="submit" disabled={loading || !file}>
        {loading ? 'Verifying...' : 'Submit for Verification'}
      </button>
    </form>
  );
}
```

#### 5. Check Quota Status

```typescript
async function getQuotaStatus() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organs/quota-status`
    );
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    return data.data;
  } catch (error) {
    console.error('Failed to fetch quota status:', error);
    throw error;
  }
}

// Usage in component
function QuotaStatusBadge() {
  const [quota, setQuota] = useState<QuotaStatus | null>(null);

  useEffect(() => {
    getQuotaStatus().then(setQuota);
  }, []);

  if (!quota) return null;

  return (
    <div className={quota.status === 'AVAILABLE' ? 'text-green-600' : 'text-red-600'}>
      <p>Gemini API: {quota.remainingCalls}/{quota.dailyCallsLimit} calls remaining</p>
      <p>Cache: {quota.cacheSize} items</p>
    </div>
  );
}
```

---

## 🔄 Real-time Updates

### Polling Pattern

Since the backend doesn't have WebSocket support, use polling for real-time updates:

```typescript
function useRealtimeOrgans(intervalMs: number = 30000) {
  const [organs, setOrgans] = useState<Organ[]>([]);

  useEffect(() => {
    async function fetchOrgans() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organs`
        );
        const data = await response.json();
        if (data.success) {
          setOrgans(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch organs:', error);
      }
    }

    // Initial fetch
    fetchOrgans();

    // Poll every intervalMs
    const interval = setInterval(fetchOrgans, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return organs;
}

// Usage
function OrganDashboard() {
  const organs = useRealtimeOrgans(30000); // Poll every 30 seconds

  return (
    <div>
      {organs.map((organ) => (
        <OrganCard key={organ.id} organ={organ} />
      ))}
    </div>
  );
}
```

### Optimistic Updates

For better UX, update UI optimistically before API response:

```typescript
function useDonation() {
  const [organs, setOrgans] = useState<Organ[]>([]);

  const donate = async (organId: string, amount: number) => {
    // Optimistic update
    setOrgans((prev) =>
      prev.map((organ) =>
        organ.id === organId
          ? {
              ...organ,
              currentFundingUSD: organ.currentFundingUSD + amount,
              fundingPercentage:
                ((organ.currentFundingUSD + amount) / organ.targetFundingUSD) *
                100,
            }
          : organ,
      ),
    );

    try {
      // Actual API call
      await initializePayment(organId, amount, "user@example.com", "User");
    } catch (error) {
      // Revert on error
      setOrgans((prev) =>
        prev.map((organ) =>
          organ.id === organId
            ? {
                ...organ,
                currentFundingUSD: organ.currentFundingUSD - amount,
                fundingPercentage:
                  ((organ.currentFundingUSD - amount) /
                    organ.targetFundingUSD) *
                  100,
              }
            : organ,
        ),
      );
      throw error;
    }
  };

  return { organs, donate };
}
```

---

## ✅ Best Practices

### 1. Environment Variables

Always use environment variables for the API base URL:

```typescript
// .env.local (Next.js)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

// .env (Vite/React)
VITE_API_BASE_URL=http://localhost:3000

// Usage
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ||
                     process.env.VITE_API_BASE_URL ||
                     'http://localhost:3000';
```

### 2. API Client Abstraction

Create a centralized API client:

```typescript
// lib/api-client.ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "API request failed");
    }

    return data.data;
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "API request failed");
    }

    return data.data;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Usage
const organs = await apiClient.get<Organ[]>("/api/organs");
```

### 3. Loading States

Always show loading states for better UX:

```typescript
function OrganList() {
  const { organs, loading, error } = useOrgans();

  if (loading) return <div>Loading organs...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!organs.length) return <div>No organs found</div>;

  return (
    <div>
      {organs.map((organ) => (
        <OrganCard key={organ.id} organ={organ} />
      ))}
    </div>
  );
}
```

### 4. Error Boundaries

Wrap components in error boundaries:

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <OrganDashboard />
    </ErrorBoundary>
  );
}
```

### 5. CORS Configuration

Ensure your frontend domain is allowed in backend CORS settings. The backend already has CORS enabled for all origins in development.

### 6. Image Optimization

Compress images before uploading for verification:

```typescript
async function compressImage(file: File, maxSizeMB: number = 5): Promise<File> {
  // Use a library like browser-image-compression
  const options = {
    maxSizeMB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  const compressedFile = await imageCompression(file, options);
  return compressedFile;
}
```

### 7. Caching Strategy

Implement client-side caching to reduce API calls:

```typescript
// Using React Query
import { useQuery } from "@tanstack/react-query";

function useOrgans() {
  return useQuery({
    queryKey: ["organs"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/organs`);
      const data = await response.json();
      return data.data;
    },
    staleTime: 60000, // 1 minute
    cacheTime: 300000, // 5 minutes
  });
}
```

---

## 🎯 Quick Reference

### Base Endpoints

| Method | Endpoint                   | Description              |
| ------ | -------------------------- | ------------------------ |
| GET    | `/health`                  | Health check             |
| GET    | `/api/organs`              | Get all organs           |
| GET    | `/api/organs/:id`          | Get single organ         |
| GET    | `/api/organs/quota-status` | Get quota status         |
| POST   | `/api/organs/:id/diagnose` | Diagnose organ           |
| POST   | `/api/organs/diagnose-all` | Diagnose all organs      |
| POST   | `/api/vials/initialize`    | Initialize payment       |
| GET    | `/api/vials/:organId`      | Get organ donations      |
| POST   | `/api/verify`              | Verify restoration image |

### Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-01-30T20:00:00.000Z"
}
```

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error"
}
```

---

## 📞 Support

For issues or questions:

- Check the main [README.md](./README.md)
- Review the [Postman Collection](./Aiye-API.postman_collection.json)
- Test endpoints using the health check: `GET /health`

---

**Built with 💚 for Planet Earth**
