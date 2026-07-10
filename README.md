# GrowEasy AI CSV Importer

> **AI-powered CRM lead importer** — Upload any CSV file (Facebook Lead Ads, Google Ads, Excel, real-estate CRM dumps, custom spreadsheets) and let Gemini map it into GrowEasy's canonical CRM lead format.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Gemini](https://img.shields.io/badge/Gemini-2.5--flash-blue?logo=google)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)

---

## URL Structure and Routing

Every step of the import workflow has its own URL you can navigate to directly:

| URL | Step | Description |
|---|---|---|
| `/` | Home | Landing page with How-to guide, FAQ, schema reference |
| `/import` | Step 1 | Upload — Drag-and-drop or click to select a CSV file |
| `/import/preview` | Step 2 | Preview — Review raw CSV table before processing |
| `/import/process` | Step 3 | Process — Live batch AI extraction with progress bar |
| `/import/results` | Step 4 | Results — Review, edit inline, download CSV/JSON |

Navigation is enforced: if you visit /import/preview without having uploaded a file, you are redirected back to /import automatically.

---

## Quick Start

### 1. Clone the repo

```
git clone https://github.com/Snarenkumar/Grow-eassy.git
cd Grow-eassy
```

### 2. Install dependencies

```
npm install
```

### 3. Add your Gemini API key

Create .env.local in the project root:

```
GEMINI_API_KEY=AIzaSy_YOUR_KEY_HERE
```

Get a free key at: https://aistudio.google.com/apikey
Valid keys start with AIzaSy (39 characters).

NOTE: If you hit 429 errors, wait 1 minute. The app auto-retries with exponential backoff.

### 4. Run the dev server

```
npm run dev
```

Open http://localhost:3000

---

## How to Use — Step by Step

### Step 1 — Upload (/import)

- Go to http://localhost:3000/import
- Drag-and-drop any .csv file onto the uploader, or click to open a file picker
- Files up to 10 MB are supported
- A sample CSV is at /groweasy-test-leads.csv

### Step 2 — Preview (/import/preview)

- A scrollable table renders the raw CSV with original column names
- Row and column counts are shown in the header
- Click "Map with Gemini AI" to start processing
- Click "Change file" to go back and upload a different file

### Step 3 — Process (/import/process)

- Rows are split into batches of 20 and sent to gemini-2.5-flash sequentially
- Live progress bar shows pending/running/retrying/done/failed per batch
- Up to 3 auto-retries per batch with exponential backoff (5s, 10s, 20s)
- Automatically navigates to results when complete

### Step 4 — Results (/import/results)

- Summary bar: Total rows, Imported, Skipped, Success rate, Mapped field count
- Lead Distribution donut: Visual imported vs skipped ratio
- CRM Status bar chart: Distribution of statuses
- Audit Report: Phone-cleaning counts, country codes added, skipped-row reasons
- Skipped log: Each skipped row's reason
- Inline editing: Double-click any cell, press Enter to save or Escape to cancel
- Download CRM CSV: Clean GrowEasy CRM format
- Download JSON: Same data as JSON for developer use

---

## Project Structure

```
src/
  app/
    layout.tsx              Root layout: fonts, SEO metadata, JSON-LD
    page.tsx                Homepage: hero, how-to steps, schema table, FAQ, CTA
    globals.css             Design system: CSS tokens, dark mode, typography
    import/
      layout.tsx            Importer shell: header, step indicator, dark mode toggle
      page.tsx              Step 1: UploadStep component
      preview/
        page.tsx            Step 2: PreviewStep component
      process/
        page.tsx            Step 3: Streams /api/extract, updates BatchProgress
      results/
        page.tsx            Step 4: ResultsStep component
    api/
      extract/
        route.ts            POST -> NDJSON streaming, batch Gemini calls
  components/
    ui/                     Button, Badge, Tooltip, Progress, ProgressBar
    UploadStep.tsx          Drag-and-drop upload + download test CSV
    PreviewStep.tsx         Raw CSV table preview
    ProcessingStep.tsx      Live batch progress tracker
    ResultsStep.tsx         Stats, charts, editable table, exports
  lib/
    types.ts                CrmRecord, ExtractEvent, SkippedRow, ExtractionSummary
    csv.ts                  Client-side CSV parser (papaparse)
    gemini.ts               Gemini API: model config, retry logic, JSON extraction
    utils.ts                cn() helper
public/
  groweasy-test-leads.csv   7-row sample with edge cases
  robots.txt                SEO: allow all + sitemap reference
  sitemap.xml               SEO: 5 URLs with lastmod and priority
  llms.txt                  GEO: site context for AI crawlers
```

---

## CRM Field Reference

| CRM Field | Example Input Columns | Notes |
|---|---|---|
| name | Full Name, Client, Lead Name | Title-cased |
| email | Email, E-mail, Contact | Primary; extras go to crm_note |
| country_code | Country Code, Prefix | Default: +91 |
| mobile_without_country_code | Phone, Mobile, Contact No. | Strips +91, spaces, brackets |
| company | Company, Organisation | Trimmed |
| city | City, Location | From location field |
| state | State, Province | If available |
| country | Country | Default: India |
| lead_owner | Assigned To, Sales Owner | Name or email |
| crm_status | Status, Stage | -> GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE |
| crm_note | Notes, Remarks | Merged with pipe separator |
| data_source | Source, Channel | -> leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots |
| possession_time | Timeline, Possession | As-is |
| description | Description, Requirements | Trimmed |

---

## Troubleshooting

**429 Too Many Requests**
Gemini free-tier rate limit hit. App retries automatically with 5s/10s/20s backoff. Affected rows are moved to Skipped.

**All rows skipped**
Check .env.local — GEMINI_API_KEY must start with AIzaSy. Keys starting with AQ. are OAuth tokens, not API keys.

**CSV not parsing**
File must be UTF-8 encoded with at least one header row. Files over 10 MB are rejected — split first.
