"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadStep } from "@/components/UploadStep";
import { parseCsvFile } from "@/lib/csv";

export default function UploadPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File is larger than 10MB. Please split it first.");
      return;
    }
    try {
      const result = await parseCsvFile(file);
      if (result.rows.length === 0) {
        setError("This CSV has no data rows.");
        return;
      }
      
      // Clear previous sessions
      sessionStorage.removeItem("groweasy_results");
      
      // Store in session storage to pass across client pages
      sessionStorage.setItem("groweasy_filename", file.name);
      sessionStorage.setItem("groweasy_parsed_csv", JSON.stringify(result));
      
      router.push("/import/preview");
    } catch {
      setError("Couldn't parse that file. Please check it's a valid CSV.");
    }
  };

  return <UploadStep onFileSelected={handleFileSelected} error={error} />;
}
