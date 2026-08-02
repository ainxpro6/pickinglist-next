"use client";

import Link from "next/link";
import { useState } from "react";
import { usePickingListStore } from "@/lib/store";

interface ControlBarProps {
  title?: string;
}

export default function ControlBar({ title = "Hasil Preview" }: ControlBarProps) {
  const [isExporting, setIsExporting] = useState(false);
  const rows = usePickingListStore((s) => s.rows);

  const handleDownloadPDF = async () => {
    if (isExporting || rows.length === 0) return;
    setIsExporting(true);

    try {
      // Dynamically import jsPDF + autotable to prevent SSR issues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { jsPDF } = await import("jspdf") as any;
      await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const headers = ["NAMA PRODUK", "VARIAN", "SKU", "QTY"];
      const bodyData = rows.map((row) => [
        row["Nama Produk"] || row["Nama produk"] || "",
        row["Varian"] || row["Nama varian"] || "-",
        row["SKU"] || "",
        String(row["Qty"] ?? ""),
      ]);

      // A4 width = 210mm, margins 5mm each side = 200mm usable
      const pageWidth = 200;
      const colWidths = [
        pageWidth * 0.50,  // Nama Produk
        pageWidth * 0.20,  // Varian
        pageWidth * 0.20,  // SKU
        pageWidth * 0.10,  // Qty
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (doc as any).autoTable({
        head: [headers],
        body: bodyData,
        startY: 5,
        margin: { left: 5, right: 5, top: 5, bottom: 5 },
        tableWidth: pageWidth,
        columnStyles: {
          0: { cellWidth: colWidths[0], fontSize: 9, font: "helvetica" },
          1: { cellWidth: colWidths[1], fontSize: 10, font: "helvetica" },
          2: { cellWidth: colWidths[2], fontSize: 9, font: "helvetica" },
          3: { cellWidth: colWidths[3], fontSize: 14, font: "courier", fontStyle: "bold", halign: "center" },
        },
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: "bold",
          fontSize: 9,
          halign: "center",
          valign: "middle",
          lineWidth: 0.3,
          lineColor: [0, 0, 0],
          cellPadding: 2,
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          lineWidth: 0.3,
          lineColor: [0, 0, 0],
          cellPadding: { top: 1.5, right: 2, bottom: 1.5, left: 2 },
          valign: "middle",
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        styles: {
          overflow: "linebreak",
          cellWidth: "wrap",
        },
        theme: "grid",
      });

      doc.save("picking_list.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="glass-bar no-print" style={{
      maxWidth: "210mm",
      margin: "0 auto 25px auto",
      padding: "15px 25px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}>
      <div style={{
        fontSize: "1.1rem",
        fontWeight: 600,
        color: "var(--color-text-primary)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontFamily: "var(--font-heading)",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <polyline points="9 15 12 18 15 15" />
          <line x1="12" y1="12" x2="12" y2="18" />
        </svg>
        {title}
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Link href="/" className="btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Upload Ulang
        </Link>

        <button
          onClick={() => window.print()}
          className="btn-primary"
          style={{ width: "auto", padding: "0.5rem 1.25rem" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Cetak
        </button>

        <button
          onClick={handleDownloadPDF}
          disabled={isExporting || rows.length === 0}
          style={{
            width: "auto",
            padding: "0.5rem 1.25rem",
            background: isExporting
              ? "linear-gradient(135deg, #6ee7b7, #34d399)"
              : "linear-gradient(135deg, #10b981, #059669)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontWeight: 500,
            fontSize: "0.9rem",
            cursor: isExporting ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            opacity: isExporting ? 0.8 : 1,
            transition: "all 0.2s",
            boxShadow: "0 4px 10px rgba(16, 185, 129, 0.3)",
            fontFamily: "var(--font-body)",
          }}
        >
          {isExporting ? (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animation: "spin 1s linear infinite" }}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Mengunduh...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}
