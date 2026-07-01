"use client";

import React, { useState } from "react";
import styles from "./export-excel-modal.module.css";

interface ExportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportExcelModal({ isOpen, onClose }: ExportExcelModalProps) {
  const [exportType, setExportType] = useState<"all" | "filtered">("filtered");
  const [fileFormat, setFileFormat] = useState<"xlsx" | "csv">("xlsx");

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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                className={`${styles.radioCard} ${exportType === "all" ? styles.radioActive : ""}`}
                onClick={() => setExportType("all")}
              >
                <div className={styles.radioTitle}>All Invoices</div>
                <div className={styles.radioDesc}>Export complete invoice list</div>
              </div>
              <div 
                className={`${styles.radioCard} ${exportType === "filtered" ? styles.radioActive : ""}`}
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
                className={`${styles.formatCard} ${fileFormat === "xlsx" ? styles.radioActive : ""}`}
                onClick={() => setFileFormat("xlsx")}
              >
                Excel (.xlsx)
              </div>
              <div 
                className={`${styles.formatCard} ${fileFormat === "csv" ? styles.radioActive : ""}`}
                onClick={() => setFileFormat("csv")}
              >
                CSV (.csv)
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.downloadBtn}>Download</button>
        </div>
      </div>
    </div>
  );
}
