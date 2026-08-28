"use client";

import { useEffect, useRef } from "react";
import { pdf } from "@react-pdf/renderer";
import { EncounterPDF } from "./encounter-pdf";

export function AutoDownloader({ filename, encounterData }: { filename: string, encounterData: any }) {
  const isDownloading = useRef(false);

  useEffect(() => {
    if (isDownloading.current) return;
    isDownloading.current = true;

    const downloadPdf = async () => {
      try {
        const blob = await pdf(<EncounterPDF data={encounterData} />).toBlob();
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // After save, try to close the tab or go back
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.close();
        }
      } catch (err) {
        console.error("PDF generation failed:", err);
      }
    };

    downloadPdf();
  }, [filename, encounterData]);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center space-y-4 max-w-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <h3 className="font-semibold text-lg">Generating PDF...</h3>
        <p className="text-sm text-muted-foreground">Please wait while your document is being prepared for download.</p>
      </div>
    </div>
  );
}
