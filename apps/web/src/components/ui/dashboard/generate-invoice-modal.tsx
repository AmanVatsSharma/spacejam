"use client";

import React from "react";
import styles from "./generate-invoice-modal.module.css";

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GenerateInvoiceModal({ isOpen, onClose }: GenerateInvoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitles}>
            <h2 className={styles.title}>Generate Invoice</h2>
            <p className={styles.subtitle}>Create and review invoice details</p>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Client Details</h3>
            <button className={styles.changeClientBtn}>Change Client</button>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Name</label>
            <input type="text" className={styles.input} defaultValue="Acme Corporation" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input type="email" className={styles.input} defaultValue="contact@acme.com" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>GST Number</label>
            <input type="text" className={styles.input} defaultValue="29ABCDE1234F1Z5" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Address</label>
            <textarea className={styles.textarea} rows={3}></textarea>
          </div>

          <div className={styles.sectionHeader} style={{ marginTop: '24px' }}>
            <h3 className={styles.sectionTitle}>Invoice Details</h3>
          </div>
          <div className={styles.divider}></div>
        </div>

        <div className={styles.footer}>
          <button className={styles.textBtn} onClick={onClose}>Save Draft</button>
          <div className={styles.footerRight}>
            <button className={styles.textBtn}>Download Preview</button>
            <button className={styles.primaryBtn}>Generate Invoice</button>
          </div>
        </div>
      </div>
    </div>
  );
}
