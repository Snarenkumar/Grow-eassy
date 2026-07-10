"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, Sun, Moon, ChevronDown, UploadCloud, Eye, Sparkles, TableProperties, Pencil, FileDown, ShieldCheck, Zap, Globe, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "What CSV formats are supported?",
    a: "Any UTF-8 encoded .csv file works — Facebook Lead Ads exports, Google Ads, Salesforce, HubSpot, Excel saves, or manually built spreadsheets. Column names don't need to match; the AI maps them by content.",
  },
  {
    q: "Does GrowEasy store my uploaded data?",
    a: "No. Files are parsed in-browser (client side). The rows are sent to Gemini only for field-extraction and are not stored on any server. Session data is cleared when you restart.",
  },
  {
    q: "What happens to rows with no email and no phone?",
    a: "They are automatically moved to a Skipped Leads section with a clear reason. You can review all skipped entries before downloading. Skipped rows are never silently dropped.",
  },
  {
    q: "Can I edit the mapped data before downloading?",
    a: "Yes. In the Results view every cell is double-click editable. Press Enter to save a change or Escape to cancel. The download reflects all inline edits.",
  },
  {
    q: "Which Gemini model is used?",
    a: "gemini-2.5-flash — Google's fastest multimodal model with a large context window, perfect for batch CSV processing with minimal latency.",
  },
];

const HOW_TO_STEPS = [
  {
    step: "01",
    icon: UploadCloud,
    title: "Upload Your CSV",
    url: "/import",
    desc: "Drag-and-drop any CSV file onto the uploader or click to browse. Works with any column layout — Facebook Ads, Excel, Google Sheets, or raw CRM exports.",
    hint: "👉 Go to /import to start",
  },
  {
    step: "02",
    icon: Eye,
    title: "Preview Raw Data",
    url: "/import/preview",
    desc: "A full scrollable table renders your raw CSV instantly in the browser, with a row-count and column summary. No data leaves the browser at this stage.",
    hint: "Automatically shown after upload",
  },
  {
    step: "03",
    icon: Sparkles,
    title: "Run AI Mapping",
    url: "/import/process",
    desc: "Click 'Map with Gemini AI'. Rows are processed in batches of 20 rows sequentially. A live progress bar shows batch status, retries, and completion.",
    hint: "Powered by gemini-2.5-flash",
  },
  {
    step: "04",
    icon: TableProperties,
    title: "Review Results",
    url: "/import/results",
    desc: "The Results page shows: ingestion stats, cleaned phone counts, CRM status distribution, a skipped-leads audit log, and the full mapped database table.",
    hint: "Automatically shown when done",
  },
  {
    step: "05",
    icon: Pencil,
    title: "Edit Inline",
    url: "/import/results",
    desc: "Double-click any cell in the results table to fix or update a value. Press Enter to confirm or Escape to cancel. All edits persist until download.",
    hint: "Any cell is editable",
  },
  {
    step: "06",
    icon: FileDown,
    title: "Export CRM CSV / JSON",
    url: "/import/results",
    desc: "Download the final, cleaned CRM-ready file as .csv (for GrowEasy, HubSpot, or any CRM) or as .json for developer integrations.",
    hint: "Export CSV or JSON formats",
  },
];

const FEATURES = [
  { icon: Zap, title: "Real-time Streaming", desc: "NDJSON streaming delivers batch results as they arrive — no waiting for all rows to complete." },
  { icon: ShieldCheck, title: "Zero Storage", desc: "All data stays in your browser session. Nothing is logged, stored, or retained server-side." },
  { icon: Globe, title: "Any CSV layout", desc: "Column names are matched by AI content inference — no schema templates required." },
  { icon: CheckCircle2, title: "Smart Validation", desc: "Phone cleaning, country code inference, duplicate merging, and status enum enforcement built in." },
];

export default function HomePage() {
  const [isDark, setIsDark] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = saved === "dark" || (!saved && prefersDark);
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      {/* ── HEADER ── */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 44 44" className="h-10 w-10 shrink-0 rounded-xl shadow-md">
              <g clipPath="url(#logo_a)">
                <rect width="43" height="43" x="0.5" y="0.5" fill="#0F0F0F" rx="9.594" />
                <path fill="#FBFBFB" d="m28.282 22.731-21.5 21.501-6.795-6.794 21.5-21.501z" />
                <path fill="#FBFBFB" d="M8.877 15.938H28.28v6.795H8.877z" />
                <path fill="#FBFBFB" d="M28.28 15.938V35.34h-6.794V15.938z" />
                <path fill="#FBFBFB" d="M28.28 15.938V35.34h-6.793V15.938z" />
              </g>
              <defs><clipPath id="logo_a"><rect width="43" height="43" x="0.5" y="0.5" fill="#fff" rx="9.594" /></clipPath></defs>
            </svg>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-ink text-lg tracking-tighter uppercase leading-none">GrowEasy</span>
                <span className="px-2 py-0.5 text-[9px] font-mono font-black uppercase bg-accent text-accent-ink rounded tracking-wider leading-none">CSV Importer</span>
              </div>
              <p className="text-[10px] font-mono text-ink-faint mt-1 uppercase tracking-wider">Intelligent Lead Parser</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/import"
              className="px-4 py-2 text-xs font-mono font-black uppercase tracking-wider bg-accent text-accent-ink rounded-lg hover:opacity-90 transition-all shadow-sm hidden sm:inline-flex items-center gap-1.5"
            >
              Start Importing <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg border border-border bg-surface hover:bg-paper text-ink-muted transition-all"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── HERO ── */}
        <section className="border-b-4 border-ink bg-surface" aria-label="Hero">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 flex flex-col items-center text-center space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-paper text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              GrowEasy · AI Lead Ingestion Console
            </span>
            <h1 className="font-display font-black text-5xl sm:text-7xl uppercase tracking-tighter text-ink leading-none max-w-3xl">
              Turn Any CSV Into{" "}
              <span className="bg-accent text-accent-ink px-3 py-1 inline-block rounded">
                CRM-Ready
              </span>{" "}
              Leads
            </h1>
            <p className="text-sm sm:text-base text-ink-muted max-w-2xl leading-relaxed font-medium">
              Upload Facebook Lead Ads exports, Google Ads CSVs, real-estate spreadsheets, or any custom format.
              Our Gemini-powered engine maps column names, cleans phone numbers, resolves statuses, and exports a clean CRM lead file — instantly.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link
                href="/import"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-ink px-8 py-4 text-sm font-black uppercase tracking-wider shadow-lg hover:opacity-90 active:scale-95 transition-all"
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="/groweasy-test-leads.csv"
                download
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-surface text-ink px-8 py-4 text-sm font-bold hover:bg-paper transition-all active:scale-95"
              >
                <Download className="h-4 w-4 text-ink-faint" /> Download Sample CSV
              </a>
            </div>
            <p className="text-[11px] font-mono text-ink-faint">
              No account required · Processes in browser · Free Gemini API tier
            </p>
          </div>
        </section>

        {/* ── FEATURE CHIPS ── */}
        <section className="border-b border-border bg-paper" aria-label="Features">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map((f, i) => (
                <div key={i} className="p-5 border-2 border-border bg-surface rounded-xl flex gap-3.5 items-start hover:border-ink transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent bg-accent-soft text-accent">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-mono text-xs font-black uppercase tracking-wider text-ink">{f.title}</p>
                    <p className="text-[11px] text-ink-muted mt-1 leading-normal">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW TO USE ── */}
        <section className="border-b border-border bg-surface" id="how-to-use" aria-label="How to use the importer">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 space-y-10">
            <div className="border-b-4 border-ink pb-4 flex flex-col md:flex-row md:items-end justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent bg-accent-soft px-2 py-0.5 rounded">Step-by-Step Guide</span>
                <h2 className="text-3xl font-display font-black uppercase text-ink mt-1 tracking-tight">How to Use GrowEasy</h2>
              </div>
              <p className="text-sm text-ink-muted max-w-sm font-medium leading-relaxed">Six clear steps from file upload to CRM-ready export. Each step has its own URL you can navigate to directly.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {HOW_TO_STEPS.map((s, i) => (
                <Link
                  href={s.url}
                  key={i}
                  className="group p-5 border-2 border-border bg-surface rounded-xl flex flex-col gap-3 hover:border-ink hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-4xl font-black text-ink/10 leading-none">{s.step}</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-paper group-hover:border-accent group-hover:bg-accent-soft group-hover:text-accent text-ink-muted transition-all">
                      <s.icon className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base text-ink uppercase tracking-tight">{s.title}</h3>
                    <p className="text-[12px] text-ink-muted mt-1.5 leading-relaxed">{s.desc}</p>
                  </div>
                  <div className="mt-auto pt-2 border-t border-border">
                    <span className="text-[10px] font-mono text-ink-faint uppercase tracking-wider">{s.hint}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── CRM FIELD MAPPING TABLE ── */}
        <section className="border-b border-border bg-paper" aria-label="CRM schema reference">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 space-y-8">
            <div className="border-b-4 border-ink pb-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent bg-accent-soft px-2 py-0.5 rounded">Schema Reference</span>
              <h2 className="text-3xl font-display font-black uppercase text-ink mt-1 tracking-tight">Target CRM Fields</h2>
            </div>
            <div className="overflow-x-auto rounded-xl border-2 border-border">
              <table className="min-w-full border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b-2 border-border bg-surface">
                    <th className="px-5 py-3 text-left font-black uppercase text-ink-muted border-r border-border">CRM Field</th>
                    <th className="px-5 py-3 text-left font-black uppercase text-ink-muted border-r border-border">Example Input Column Names</th>
                    <th className="px-5 py-3 text-left font-black uppercase text-ink-muted">AI Transformation</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["name", "Client Name, Full Name, Lead", "Trim whitespace, title-case"],
                    ["email", "Contact Email, Email Address, E-mail", "Primary extracted; extras → crm_note"],
                    ["country_code", "Country Code, Prefix", "Defaults to +91 if Indian number detected"],
                    ["mobile_without_country_code", "Phone, Mobile, Contact No.", "Strip +91, spaces, dashes, brackets"],
                    ["company", "Company Name, Organisation", "Cleaned, trimmed"],
                    ["city", "Location, City, District", "Mapped from location field"],
                    ["state", "State, Province", "Mapped if available"],
                    ["country", "Country", "Defaults to India if not provided"],
                    ["lead_owner", "Assigned To, Sales Owner", "Email or name of assignee"],
                    ["crm_status", "Status, Stage, Lead Status", "Maps to GOOD_LEAD_FOLLOW_UP / DID_NOT_CONNECT / BAD_LEAD / SALE_DONE"],
                    ["crm_note", "Remarks, Notes, Comments", "Merged with extra emails/phones separated by ' | '"],
                    ["data_source", "Campaign Source, Source, Channel", "Maps to leads_on_demand / meridian_tower / eden_park / varah_swamy / sarjapur_plots"],
                    ["possession_time", "Possession Needed, Timeline", "Extracted as-is"],
                    ["description", "Description, Requirements", "Cleaned, trimmed"],
                  ].map(([field, examples, transform], i) => (
                    <tr key={i} className="border-b border-border hover:bg-surface transition-colors">
                      <td className="px-5 py-3 font-bold text-accent border-r border-border whitespace-nowrap">{field}</td>
                      <td className="px-5 py-3 text-ink-muted border-r border-border">{examples}</td>
                      <td className="px-5 py-3 text-ink-muted">{transform}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="border-b border-border bg-surface" aria-label="FAQ">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 space-y-8">
            <div className="border-b-4 border-ink pb-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent bg-accent-soft px-2 py-0.5 rounded">Q&amp;A</span>
              <h2 className="text-3xl font-display font-black uppercase text-ink mt-1 tracking-tight">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-3">
              {FAQS.map((faq, idx) => (
                <div key={idx} className="border-2 border-border bg-surface rounded-xl overflow-hidden transition-all">
                  <button
                    onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-paper/40 transition-colors"
                  >
                    <span className="text-sm font-black font-display uppercase tracking-tight text-ink">{faq.q}</span>
                    <ChevronDown className={cn("h-4 w-4 text-ink-faint transition-transform duration-200 shrink-0 ml-4", faqOpen === idx && "rotate-180")} />
                  </button>
                  {faqOpen === idx && (
                    <div className="px-5 pb-4 pt-2 text-xs text-ink-muted leading-relaxed border-t-2 border-border bg-paper/20 font-mono">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="bg-ink" aria-label="Call to action">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 flex flex-col items-center text-center space-y-6">
            <h2 className="font-display font-black text-4xl sm:text-5xl uppercase tracking-tighter text-paper leading-none">
              Ready to import<br />
              <span className="text-accent">your leads?</span>
            </h2>
            <p className="text-sm text-paper/60 font-mono max-w-md">
              No signup. No server uploads. Drop your CSV and get a clean CRM file in seconds.
            </p>
            <Link
              href="/import"
              className="inline-flex items-center gap-2 rounded-xl bg-accent text-accent-ink px-10 py-4 text-sm font-black uppercase tracking-wider shadow-lg hover:opacity-90 active:scale-95 transition-all"
            >
              Launch Importer <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border py-8 bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-faint font-mono">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 44 44" className="h-6 w-6 rounded-md">
              <rect width="43" height="43" x="0.5" y="0.5" fill="#0F0F0F" rx="9.594" />
              <path fill="#FBFBFB" d="m28.282 22.731-21.5 21.501-6.795-6.794 21.5-21.501z" />
              <path fill="#FBFBFB" d="M8.877 15.938H28.28v6.795H8.877z" />
              <path fill="#FBFBFB" d="M28.28 15.938V35.34h-6.794V15.938z" />
            </svg>
            <span>GrowEasy CSV Importer · Software Developer Assignment</span>
          </div>
          <div className="flex gap-5">
            <Link href="/import" className="hover:text-accent">Launch App</Link>
            <a href="/groweasy-test-leads.csv" download className="hover:text-accent">Sample CSV</a>
            <a href="/llms.txt" className="hover:text-accent">llms.txt</a>
            <a href="/sitemap.xml" className="hover:text-accent">Sitemap</a>
            <a href="https://groweasy.ai" target="_blank" rel="noopener noreferrer" className="hover:text-accent">groweasy.ai</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
