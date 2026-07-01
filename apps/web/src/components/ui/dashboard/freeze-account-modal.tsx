"use client";

import React from "react";
import styles from "./freeze-account-modal.module.css";

interface FreezeAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FreezeAccountModal({ isOpen, onClose }: FreezeAccountModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitles}>
            <h2 className={styles.title}>Freeze Account</h2>
            <p className={styles.subtitle}>Temporarily freeze a security deposit</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.rowGrid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Account Name</label>
              <div className={styles.selectWrapper}>
                <select className={styles.select} defaultValue="">
                  <option value="" disabled></option>
                  <option value="michael">Michael Chen</option>
                  <option value="noah">Noah Brown</option>
                </select>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Freeze Reason</label>
              <div className={styles.selectWrapper}>
                <select className={styles.select} defaultValue="">
                  <option value="" disabled></option>
                  <option value="payment">Payment Delay</option>
                  <option value="violation">Policy Violation</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Additional Notes</label>
            <textarea 
              className={styles.textarea} 
              placeholder="Enter additional notes..." 
              rows={4}
            />
          </div>

          <button className={styles.addNoteBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Note
          </button>

          <div className={styles.infoBox}>
            <div className={styles.infoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div className={styles.infoContent}>
              <h4 className={styles.infoTitle}>Account will be frozen immediately</h4>
              <p className={styles.infoText}>The client will be notified about the freeze and the reason provided.</p>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.submitBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            Freeze Account
          </button>
        </div>
      </div>
    </div>
  );
}
