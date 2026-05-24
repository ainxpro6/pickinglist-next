"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function ErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "Terjadi kesalahan yang tidak diketahui.";

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}>
      <div className="glass-card" style={{
        maxWidth: "500px",
        width: "100%",
        textAlign: "center",
        padding: "3rem 2.5rem",
      }}>
        {/* Icon */}
        <div className="error-icon" style={{ color: "#ef4444" }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 15h8" />
            <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
            <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
          </svg>
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          fontSize: "1.5rem",
          color: "var(--color-text-primary)",
          marginBottom: "0.75rem",
        }}>
          Oops, Gagal!
        </h2>

        {/* Message */}
        <p style={{
          color: "var(--color-text-secondary)",
          fontSize: "0.95rem",
          marginBottom: "2rem",
          lineHeight: 1.6,
        }}>
          {message}
        </p>

        {/* CTA */}
        <Link href="/" className="btn-primary" style={{ textDecoration: "none", display: "flex" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          Coba Lagi
        </Link>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div className="spinner" style={{ width: 32, height: 32, borderColor: "var(--color-primary-200)", borderTopColor: "var(--color-primary-500)" }}></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
