"use client";

import React from "react";
import styles from "./add-deposit-modal.module.css";

interface AddDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDepositModal({ isOpen, onClose }: AddDepositModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitles}>
            <h2 className={styles.title}>Add Deposit</h2>
            <p className={styles.subtitle}>Add a new security deposit for a client</p>
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
            <label className={styles.label}>Client Name</label>
            <input type="text" className={styles.input} placeholder="Enter client name" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Deposit Amount</label>
            <div className={styles.inputIconWrapper}>
              <span className={styles.inputPrefix}>₹</span>
              <input type="number" className={styles.inputWithPrefix} placeholder="0" />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Plan</label>
            <input type="text" className={styles.input} placeholder="Enter plan" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Seat</label>
            <input type="text" className={styles.input} placeholder="Enter seat" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Center</label>
            <div className={styles.selectWrapper}>
              <select className={styles.select} defaultValue="">
                <option value="" disabled>Select a center</option>
                <option value="chandigarh">Chandigarh Hub</option>
                <option value="mumbai">Mumbai Office</option>
                <option value="delhi">Delhi Center</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Payment Mode</label>
            <div className={styles.selectWrapper}>
              <select className={styles.select} defaultValue="cash">
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.submitBtn}>Add Deposit</button>
        </div>
      </div>
    </div>
  );
}
