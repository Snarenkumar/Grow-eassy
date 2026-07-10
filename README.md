# GrowEasy AI CSV Importer

> **AI-powered CRM lead importer** — Upload any CSV file (Facebook Lead Ads, Google Ads, Excel, real-estate CRM dumps, manually-built spreadsheets) and let AI map it into GrowEasy's canonical CRM lead format.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![Gemini](https://img.shields.io/badge/Gemini%202.0-Flash-blue?logo=google)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)

---

## ✨ Key Features

| Feature | Details |
|---|---|
| **Drag & Drop Upload** | Drop any `.csv` file or click to browse. Up to 10 MB. |
| **Client-Side Preview** | PapaParse renders a sticky-header, horizontally-scrollable table — no AI processing yet. |
| **Streamed AI Mapping** | Rows are batched (20 per batch, 3 concurrent workers) and streamed via NDJSON SSE to the frontend for real-time progress. |
| **Retry Mechanism** | Each batch automatically retries up to 2× with exponential backoff on Gemini API failures. |
| **Inline Cell Editing** | Double-click any cell in the results table to correct values before downloading. |
| **Visual Analytics** | SVG donut chart (imported vs. skipped ratio) and bar chart (CRM status distribution). |
| **Dark Mode** | Toggle between light and dark themes with system preference detection. |
| **Download Formats** | Export mapped leads as CRM-ready CSV or JSON. |
| **SEO/GEO/AEO** | JSON-LD structured data, `robots.txt`, `sitemap.xml`, `llms.txt` (for AI search engines), and FAQ accordion. |
| **Test CSV Included** | A pre-built messy CSV with edge cases is downloadable directly from the UI. |

---

## 🗂 Project Structure

```
├── public/
│   ├── groweasy-test-leads.csv   # Downloadable test file
│   ├── llms.txt                  # GEO: AI search engine documentation
│   ├── robots.txt                # SEO: crawler rules
│   └── sitemap.xml               # SEO: sitemap
├── samples/
│   ├── facebook-lead-ads-export.csv
│   └── manual-spreadsheet.csv
├── src/
│   ├── app/
│   │   ├── api/extract/route.ts  # Backend: SSE streaming extraction endpoint
│   │   ├── globals.css           # Design system (light + dark palettes)
│   │   ├── layout.tsx            # SEO metadata + JSON-LD
│   │   └── page.tsx              # Main orchestrator (upload → preview → process → results)
│   ├── components/
│   │   ├── MappingVisual.tsx     # SVG field-mapping diagram
│   │   ├── PreviewStep.tsx       # Raw CSV preview table
│   │   ├── ProcessingStep.tsx    # Batch progress indicators
│   │   ├── ResultsStep.tsx       # Editable results + charts + downloads
│   │   ├── StepIndicator.tsx     # Header step dots
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       └── Button.tsx
│   └── lib/
│       ├── csv.ts                # PapaParse wrapper + CSV export
│       ├── gemini.ts             # Gemini SDK client + batch processing + retry
│       ├── prompt.ts             # System + user prompts for field mapping
│       ├── types.ts              # CRM record types + event types
│       └── utils.ts              # cn() utility
├── .env.local                    # GEMINI_API_KEY (not committed)
├── .env.example                  # Template for env vars
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Gemini API Key** (get one free at [aistudio.google.com](https://aistudio.google.com))

### 1. Clone the repository

```bash
git clone https://github.com/Snarenkumar/Grow-eassy.git
cd Grow-eassy
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
npm run build
npm start
```

---

## 🧪 How to Test

1. **Download the test CSV** directly from the UI or use `public/groweasy-test-leads.csv`.
2. **Drag & Drop** the file into the upload zone.
3. **Preview** the raw data table — verify columns and row count.
4. Click **"Confirm & Run AI Mapping"**.
5. Watch the progress bar and batch status indicators update in real time.
6. On the **Results** screen:
   - Check the donut chart and status distribution.
   - Double-click any cell to edit it inline.
   - Download as **CSV** or **JSON**.

### Sample CSV files included

| File | Description |
|---|---|
| `samples/facebook-lead-ads-export.csv` | Simulated Facebook Lead Ads export with multiple emails |
| `samples/manual-spreadsheet.csv` | Manually built sheet with inconsistent columns |
| `public/groweasy-test-leads.csv` | Full edge-case test file (mixed dates, missing contacts, duplicate phones) |

---

## 🧠 AI Prompt Engineering

The system prompt in `src/lib/prompt.ts` instructs Gemini to:

- Map arbitrary column names using synonyms and content inference
- Normalize dates to `new Date()`-compatible formats
- Extract country codes (default `+91` for Indian numbers)
- Merge extra emails/phones into `crm_note`
- Enforce strict enum values for `crm_status` and `data_source`
- Skip rows without email or phone
- Return minified JSON for efficient parsing

---

## 🌐 SEO, GEO & AEO

| Type | Implementation |
|---|---|
| **SEO** | `<title>`, `<meta description>`, Open Graph tags, JSON-LD `WebApplication` schema, `robots.txt`, `sitemap.xml` |
| **GEO** (Generative Engine Optimization) | `/llms.txt` documents the CRM schema and AI rules so AI search engines can index and summarize the tool |
| **AEO** (Answer Engine Optimization) | FAQ accordion section with structured Q&A for direct answer extraction by search engines |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS v4 |
| Backend | Next.js API Routes (Node.js runtime) |
| AI | Google Gemini 2.0 Flash via `@google/generative-ai` |
| CSV Parsing | PapaParse |
| Icons | Lucide React |

---

## 📝 Position Applied For

**Software Developer Intern**

---

## 📄 License

This project was built as an assignment submission for GrowEasy.
