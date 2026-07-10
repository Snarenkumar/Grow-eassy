"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { StepIndicator } from "@/components/StepIndicator";
import { Sun, Moon } from "lucide-react";
import Link from "next/link";

export default function ImporterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkTheme = document.documentElement.classList.contains("dark") || 
      localStorage.getItem("theme") === "dark" || 
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDarkTheme) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const getStep = () => {
    if (pathname === "/import") return 1;
    if (pathname === "/import/preview") return 2;
    if (pathname === "/import/process") return 3;
    if (pathname === "/import/results") return 4;
    return 1;
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 44 44" className="h-10 w-10 shrink-0 rounded-xl shadow-md">
              <g clipPath="url(#groweasy_svg__a)">
                <rect width="43" height="43" x="0.5" y="0.5" fill="#0F0F0F" rx="9.594"></rect>
                <path fill="#FBFBFB" d="m28.282 22.731-21.5 21.501-6.795-6.794 21.5-21.501z"></path>
                <path fill="#FBFBFB" d="M8.877 15.938H28.28v6.795H8.877z"></path>
                <path fill="#FBFBFB" d="M28.28 15.938V35.34h-6.794V15.938z"></path>
                <path fill="#FBFBFB" d="M28.28 15.938V35.34h-6.793V15.938z"></path>
              </g>
              <defs>
                <clipPath id="groweasy_svg__a">
                  <rect width="43" height="43" x="0.5" y="0.5" fill="#fff" rx="9.594"></rect>
                </clipPath>
              </defs>
            </svg>
            <div>
              <div className="flex items-center">
                <span className="font-display font-black text-ink text-lg tracking-tighter uppercase leading-none">
                  GrowEasy
                </span>
                <span className="ml-2 px-2 py-0.5 text-[9px] font-mono font-black uppercase bg-accent text-accent-ink rounded tracking-wider leading-none shadow-sm">
                  CSV Importer
                </span>
              </div>
              <p className="text-[10px] font-mono text-ink-faint mt-1 uppercase tracking-wider">
                Intelligent Lead Parser
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <StepIndicator current={getStep()} />
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-border bg-surface hover:bg-paper text-ink-muted transition-all hover:scale-105 animate-fade-up"
              aria-label="Toggle theme mode"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="bg-surface rounded-2xl border-2 border-border shadow-card p-6 sm:p-8">
          {children}
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-ink-faint bg-surface">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>Built for the GrowEasy Software Developer Assignment.</p>
          <div className="flex gap-4">
            <a href="/llms.txt" className="hover:text-accent font-mono">llms.txt</a>
            <a href="/sitemap.xml" className="hover:text-accent font-mono">sitemap</a>
            <a href="https://groweasy.ai" target="_blank" rel="noopener noreferrer" className="hover:text-accent font-semibold">groweasy.ai</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
