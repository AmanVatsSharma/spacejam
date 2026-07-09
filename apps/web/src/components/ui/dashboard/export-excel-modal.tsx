"use client";

import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { toast } from "sonner";
import styles from "./export-excel-modal.module.css";
import { EXPORT_DEPOSITS } from "@/lib/apollo/operations";

interface ExportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FileFormat = "csv" | "json";

const FORMAT_MIME: Record<FileFormat, string> = {
  csv: "text/csv;charset=utf-8;",
  json: "application/json;charset=utf-8;",
};

const FORMAT_EXTENSION: Record<FileFormat, string> = {
  csv: "csv",
  json: "json",
};

/**
 * Trigger a client-side file download for the given string payload.
 * Creates a temporary object URL and anchor element, clicks it, then revokes.
 */
function downloadFile(content: string, format: FileFormat) {
  const mime = FORMAT_MIME[format];
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const stamp = new Date().toISOString().slice(0, 10);
  link.download = `deposits-export-${stamp}.${FORMAT_EXTENSION[format]}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Give the browser a tick before revoking so the download can start.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function ExportExcelModal({ isOpen, onClose }: ExportExcelModalProps) {
  const [exportType, setExportType] = useState<"all" | "filtered">("filtered");
  const [fileFormat, setFileFormat] = useState<FileFormat>("csv");
  const [downloading, setDownloading] = useState(false);

  const [exportDeposits] = useMutation(EXPORT_DEPOSITS);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data } = await exportDeposits({
        variables: { format: fileFormat },
      });
      const payload: string | undefined = data?.exportDeposits;
      if (!payload) {
        toast.error("Export returned no data");
        return;
      }
      downloadFile(payload, fileFormat);
      toast.success("Export downloaded");
      onClose();
    } catch (err) {
      toast.error(
        `Failed to export: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitles}>
            <h2 className={styles.title}>Export to Excel</h2>
            <p className={styles.subtitle}>Choose export options</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.sectionGroup}>
            <h3 className={styles.sectionTitle}>Export Type</h3>
            <div className={styles.radioList}>
              <div
                className={`${styles.radioCard} ${
                  exportType === "all" ? styles.radioActive : ""
                }`}
                onClick={() => setExportType("all")}
              >
                <div className={styles.radioTitle}>All Invoices</div>
                <div className={styles.radioDesc}>
                  Export complete invoice list
                </div>
              </div>
              <div
                className={`${styles.radioCard} ${
                  exportType === "filtered" ? styles.radioActive : ""
                }`}
                onClick={() => setExportType("filtered")}
              >
                <div className={styles.radioTitle}>Filtered Results</div>
                <div className={styles.radioDesc}>Export current filtered view</div>
              </div>
            </div>
          </div>

          <div className={styles.sectionGroup}>
            <h3 className={styles.sectionTitle}>File Format</h3>
            <div className={styles.formatGrid}>
              <div
                className={`${styles.formatCard} ${
                  fileFormat === "csv" ? styles.radioActive : ""
                }`}
                onClick={() => setFileFormat("csv")}
              >
                CSV (.csv)
              </div>
              <div
                className={`${styles.formatCard} ${
                  fileFormat === "json" ? styles.radioActive : ""
                }`}
                onClick={() => setFileFormat("json")}
              >
                JSON (.json)
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={downloading}
          >
            Cancel
          </button>
          <button
            className={styles.downloadBtn}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? "Preparing…" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}
