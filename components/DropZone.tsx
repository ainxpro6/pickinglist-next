"use client";

import { useRef, useState, useCallback } from "react";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
}

export default function DropZone({ onFileSelect, selectedFile, onClearFile }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith(".pdf")) {
      return (
        <svg className="file-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    }
    return (
      <svg className="file-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    );
  };

  return (
    <div>
      <div
        className={`drop-zone ${isDragOver ? "dragover" : ""}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClick(); }}
        aria-label="Upload file area"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="drop-zone-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 16 12 12 8 16" />
              <line x1="12" y1="12" x2="12" y2="21" />
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              <polyline points="16 16 12 12 8 16" />
            </svg>
          </span>
          <div style={{ color: "var(--color-text-secondary)", fontWeight: 500, fontSize: "0.95rem" }}>
            Seret file atau klik di sini
          </div>
          <div style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
            Format: .xls, .xlsx, .pdf (Max: 10MB)
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.xlsx,.xls"
          onChange={handleChange}
          style={{ display: "none" }}
          id="file-input"
        />
      </div>

      {selectedFile && (
        <div className="file-preview-pill">
          {getFileIcon(selectedFile.name)}
          <span className="file-name">{selectedFile.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearFile();
              if (inputRef.current) inputRef.current.value = "";
            }}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "0 0 0 4px",
              fontSize: "1.1rem",
              lineHeight: 1,
            }}
            aria-label="Remove file"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
