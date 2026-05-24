"use client";

import Link from "next/link";

interface ControlBarProps {
  title?: string;
}

export default function ControlBar({ title = "Hasil Preview" }: ControlBarProps) {
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
        <button onClick={() => window.print()} className="btn-primary" style={{ width: "auto", padding: "0.5rem 1.25rem" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Cetak
        </button>
      </div>
    </div>
  );
}
