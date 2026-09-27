# NINJA — Personal Web Command Center

> **"One command. Infinite possibilities."**
> Your web, simplified.

NINJA is a modern, high-speed Personal Web Command Center. Instead of manually navigating through dozens of ad-riddled single-purpose utility websites, users can type natural language instructions, upload files when needed, and NINJA routes the command to the appropriate native tool or automated workflow.

---

## ⚡ Highlights

* **Unified Natural Language Command Interface**: Type `Compress this PDF`, `Create a QR code for my Instagram`, `Calculate EMI for 500000 at 9 percent for 5 years`, `Open WhatsApp`, or `Resize this image to 1080x1080`.
* **Hybrid Intelligent Routing**: Server-side Gemini 3.8 Flash SDK (`@google/genai`) coupled with instantaneous offline regex token heuristic engines for zero-latency execution.
* **Over 30+ Core Built-in Utilities**:
  * **File Tools**: Real PDF Compressor, PDF Merger, PDF Splitter, Image Resizer (with social presets), Image Converter (JPG/PNG/WEBP), File Inspector.
  * **Generators**: Crisp Vector SVG & PNG QR Code Generator, CSPRNG Password Generator, UUID v4 Generator, Lorem Ipsum, Color Palette.
  * **Calculators**: Amortization Loan EMI Calculator, Math Expression Calculator, Percentage Calculator, GST Splitter, Age & Date Difference, Unit & Currency Converter.
  * **AI Intelligence**: Document Summarizer, Polyglot Multilingual Translator, ATS Resume Architect, Tone Rewriter.
  * **Developer Tools**: JSON Formatter & Validator, Base64 Encoder/Decoder, JWT Debugger, Regex Tester, Unix Timestamp Converter.
  * **Web Launcher**: Direct official routing to WhatsApp Web, Instagram, YouTube, LinkedIn, GitHub, Gmail, and Google Maps.
* **Pipelines & Workflows**: Multi-step chained pipelines (e.g. *Resize to 1080x1080 → Convert to JPG → Compress*).
* **Private File Workspace**: Store, preview, inspect metadata, download, and delete files with live storage quotas.
* **Security & Auth**: PBKDF2/Scrypt cryptographic password hashing, HMAC-SHA256 session tokens, RBAC roles (User and Admin), server-side input sanitization.
* **PWA & Offline First**: Installable on Desktop, Android, and iOS Safari (`standalone` display mode, service worker caching, custom brand icons).
* **Admin Governance**: Telemetry dashboard, real-time memory usage, file processing counts, and tool toggles.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- npm or yarn

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/ninja.git
cd ninja

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the project root:
```bash
cp .env.example .env
```
Fill in the credentials:
```env
GEMINI_API_KEY="your_gemini_api_key"
JWT_SECRET="your_secure_random_jwt_secret"
MONGODB_URI="mongodb+srv://..." # Optional: defaults to embedded JSON store
```

### 4. Running Locally
```bash
# Starts both Express API and Vite frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verified User Journeys

1. **User Journey 1: QR Code Generation**
   - Type `"Create a QR code"` in the command bar.
   - Enter your URL or Instagram link.
   - Instantly download crisp vector SVG or high-res 1000px PNG.

2. **User Journey 2: PDF Compression**
   - Attach a PDF or drop it into the command bar.
   - Type `"Compress this PDF"`.
   - Backend cleans streams, compresses internal objects, shows reduction percentage (e.g. -75%), and provides direct download.

3. **User Journey 3: Loan EMI Calculation**
   - Type `"Calculate EMI for 500000 at 9 percent for 5 years"`.
   - NINJA parses Principal (5,00,000), Rate (9%), and Tenure (5 years).
   - Displays exact monthly EMI, total interest payable, visual principal-to-interest bar, and copyable summary.

4. **User Journey 4: Web Launcher**
   - Type `"Open WhatsApp"`, `"Open Instagram"`, or `"Open GitHub"`.
   - NINJA detects the web action and routes directly to the official platform.

5. **User Journey 5: AI Summarization**
   - Drop a PDF or paste article text.
   - Type `"Summarize this document"`.
   - Gemini 3.8 Flash extracts key executive findings and bullet points.

6. **User Journey 6: Authentication & Workspace Persistence**
   - Sign in with user or demo admin (`admin@ninja.local` / `admin123`).
   - All processed files persist in the private workspace and execution history is stored.

---

## 🛡️ Architecture & Security

- **Zero Client API Key Leakage**: Gemini API is strictly invoked on the backend via Express routes (`/api/ai/*`). The client bundle never contains secrets.
- **Allowlisted Command Registry**: AI suggestions are validated against an allowlist of registered tool IDs, preventing arbitrary execution.
- **Fail-Safe Local Matching**: If offline or if an API key is not configured, the local pattern recognition engine continues to route calculations and file conversions smoothly.

---

## 📦 Production Deployment

### Build
```bash
npm run build
```

### Start Production Server
```bash
npm start
```
Runs on `0.0.0.0:3000` with Express serving static assets from `dist/` and all REST API endpoints.
