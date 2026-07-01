"use client";

import React from "react";
import styles from "./send-reminder-modal.module.css";

interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SendReminderModal({ isOpen, onClose }: SendReminderModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitles}>
            <h2 className={styles.title}>Send Reminder</h2>
            <p className={styles.subtitle}>Send a reminder to a client about their deposit</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Reminder Type</label>
            <div className={styles.selectWrapper}>
              <select className={styles.select} defaultValue="payment">
                <option value="payment">Payment Due Reminder</option>
                <option value="overdue">Overdue Reminder</option>
                <option value="release">Release Update</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Communication Method</label>
            <div className={styles.selectWrapper}>
              <div className={styles.inputPrefix}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <select className={styles.selectWithPrefix} defaultValue="email">
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Reminder Message</label>
            <textarea 
              className={styles.textarea} 
              placeholder="Enter reminder message..." 
              rows={4}
            />
            <p className={styles.helpText}>Personalize your message or use the default template</p>
          </div>

          <div className={styles.infoBox}>
            <div className={styles.infoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <div className={styles.infoContent}>
              <h4 className={styles.infoTitle}>Reminder will be sent immediately</h4>
              <p className={styles.infoText}>The client will receive this notification via the selected communication method.</p>
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
            Send Reminder
          </button>
        </div>
      </div>
    </div>
  );
}
