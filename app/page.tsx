"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DropZone from "@/components/DropZone";
import Footer from "@/components/Footer";
import { usePickingListStore } from "@/lib/store";

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"warning" | "danger">("warning");

  const setRows = usePickingListStore((s) => s.setRows);
  const router = useRouter();

  const showAlert = (message: string, type: "warning" | "danger" = "warning") => {
    setAlertMessage(message);
    setAlertType(type);
  };

  const clearAlert = () => setAlertMessage("");

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setUrl("");
    clearAlert();
  }, []);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (e.target.value.length > 0) {
      setSelectedFile(null);
    }
    clearAlert();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile && url.trim() === "") {
      showAlert("⚠️ Harap upload file ATAU masukkan link!", "warning");
      return;
    }

    setIsProcessing(true);
    clearAlert();

    try {
      const formData = new FormData();

      if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("pdf_url", url.trim());
      }

      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data) {
        setRows(result.data);
        router.push("/preview");
      } else {
        showAlert(result.message || "Terjadi kesalahan saat memproses file.", "danger");
      }
    } catch (error) {
      console.error("Processing error:", error);
      showAlert("Terjadi kesalahan koneksi. Silakan coba lagi.", "danger");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{ maxWidth: "600px", width: "100%" }}>
        <div className="glass-card" style={{ padding: "2.5rem" }}>
          {/* Header */}
          <h1 style={{
            textAlign: "center",
            marginBottom: "1.5rem",
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: "1.5rem",
            color: "var(--color-primary-600)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <polyline points="9 15 12 12 15 15" />
            </svg>
            Upload Picking List
          </h1>

          {/* Alert */}
          {alertMessage && (
            <div className={`alert alert-${alertType}`} style={{ marginBottom: "1rem" }}>
              {alertMessage}
              <button
                onClick={clearAlert}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  opacity: 0.6,
                  color: "inherit",
                  lineHeight: 1,
                }}
                aria-label="Close alert"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Drop Zone */}
            <DropZone
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              onClearFile={handleClearFile}
            />

            {/* Divider */}
            <div className="divider" style={{ margin: "1.5rem 0" }}>
              <span>Or Paste Link</span>
            </div>

            {/* URL Input */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div className="url-input-wrapper">
                <span className="url-input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </span>
                <input
                  type="url"
                  value={url}
                  onChange={handleUrlChange}
                  className="url-input"
                  placeholder="Paste Link PDF Desty di sini..."
                  autoComplete="off"
                  id="url-input"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`btn-primary ${isProcessing ? "processing" : ""}`}
              disabled={isProcessing}
              id="submit-button"
            >
              <span className="btn-text" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Lihat Preview
              </span>
              <div className="spinner-overlay">
                <div className="spinner"></div>
              </div>
            </button>
          </form>
        </div>

        <Footer />
      </div>
    </div>
  );
}
