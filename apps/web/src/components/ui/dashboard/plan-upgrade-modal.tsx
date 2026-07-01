"use client";

import React, { useState } from "react";
import styles from "./plan-upgrade-modal.module.css";

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName?: string;
}

export function PlanUpgradeModal({ isOpen, onClose, clientName = "Startup Ventures" }: PlanUpgradeModalProps) {
  const [duration, setDuration] = useState("3 months");
  const [plan, setPlan] = useState("Private Cabin");

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitles}>
            <h2 className={styles.title}>Plan Upgrade</h2>
            <p className={styles.subtitle}>{clientName}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.twoCol}>
            {/* Left Col - Current Plan */}
            <div className={styles.currentPlanBox}>
              <div className={styles.planLabel}>Current Plan</div>
              <div className={styles.planName}>Hot Desk</div>
              <div className={styles.planPrice}>₹ 10,000</div>
              
              <ul className={styles.amenitiesList}>
                <li>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Shared workspace
                </li>
                <li>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  WiFi access
                </li>
                <li>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Coffee/Tea
                </li>
              </ul>
            </div>

            {/* Right Col - Upgrade Form */}
            <div className={styles.upgradeFormBox}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Upgrade plan</label>
                <div className={styles.selectWrapper}>
                  <select className={styles.select} value={plan} onChange={(e) => setPlan(e.target.value)}>
                    <option value="Private Cabin">Private Cabin</option>
                    <option value="Dedicated Desk">Dedicated Desk</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Duration</label>
                <div className={styles.selectWrapper}>
                  <select className={styles.select} value={duration} onChange={(e) => setDuration(e.target.value)}>
                    <option value="3 months">3 months</option>
                    <option value="6 months">6 months</option>
                    <option value="12 months">12 months</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Amenities</label>
                <div className={styles.checkboxGrid}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" className={styles.checkbox} defaultChecked /> WiFi
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" className={styles.checkbox} defaultChecked /> AC
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" className={styles.checkbox} defaultChecked /> Projector
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" className={styles.checkbox} defaultChecked /> Coffee
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" className={styles.checkbox} defaultChecked /> Whiteboard
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" className={styles.checkbox} defaultChecked /> Printer
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.summaryBox}>
            <span className={styles.summaryLabel}>Additional Monthly Cost</span>
            <span className={styles.summaryPrice}>+ ₹ 10,000</span>
          </div>

          <div className={styles.benefitsBox}>
            <div className={styles.benefitsTitle}>Benefits of Upgrading</div>
            <ul className={styles.benefitsList}>
              <li>Enhanced workspace amenities</li>
              <li>Increased productivity and privacy</li>
              <li>Professional image for clients</li>
              <li>Priority support and services</li>
            </ul>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.generateBtn}>Confirm Upgrade & Generate Invoice</button>
        </div>
      </div>
    </div>
  );
}
