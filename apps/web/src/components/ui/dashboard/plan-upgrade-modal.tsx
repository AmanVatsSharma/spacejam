"use client";

import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { toast } from "sonner";
import styles from "./plan-upgrade-modal.module.css";
import { UPDATE_LEAD } from "@/lib/apollo/operations";

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName?: string;
  /** Lead to record the plan upgrade against. If absent, submit is rejected with a toast. */
  leadId?: string;
}

export function PlanUpgradeModal({ isOpen, onClose, clientName, leadId }: PlanUpgradeModalProps) {
  const [duration, setDuration] = useState("3 months");
  const [plan, setPlan] = useState("Private Cabin");
  const [saving, setSaving] = useState(false);

  const [updateLead] = useMutation(UPDATE_LEAD);

  if (!isOpen) return null;

  const handleConfirmUpgrade = async () => {
    if (!leadId) {
      toast.error("No lead selected");
      return;
    }
    const notes = `Plan upgrade discussed: ${plan} for ${duration}`;
    setSaving(true);
    try {
      const { errors } = await updateLead({
        variables: { id: leadId, input: { status: "Negotiation", notes } },
      });
      if (errors && errors.length) {
        toast.error(errors[0].message);
        return;
      }
      toast.success("Lead updated with plan upgrade");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update lead");
    } finally {
      setSaving(false);
    }
  };

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
          <button
            className={styles.generateBtn}
            onClick={handleConfirmUpgrade}
            disabled={saving}
          >
            {saving ? "Updating..." : "Confirm Upgrade & Generate Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
