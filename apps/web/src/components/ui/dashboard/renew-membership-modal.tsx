"use client";

import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { toast } from "sonner";
import styles from "./renew-membership-modal.module.css";
import { RENEW_CONTRACT } from "@/lib/apollo/operations";

interface RenewMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName?: string;
  currentPlan?: string;
  /** Contract to renew. If absent, submit is rejected with a toast. */
  contractId?: string;
}

export function RenewMembershipModal({
  isOpen,
  onClose,
  clientName,
  currentPlan,
  contractId,
}: RenewMembershipModalProps) {
  const [duration, setDuration] = useState<number>(6);
  const [saving, setSaving] = useState(false);

  const [renewContract] = useMutation(RENEW_CONTRACT);

  if (!isOpen) return null;

  const getAmount = (months: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(20000 * months);
  };

  const handleRenew = async () => {
    if (!contractId) {
      toast.error("No contract selected");
      return;
    }
    // Compute the new end date: one year from today (ISO string).
    const newEndDate = new Date();
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    setSaving(true);
    try {
      const { errors } = await renewContract({
        variables: { id: contractId, newEndDate: newEndDate.toISOString() },
      });
      if (errors && errors.length) {
        toast.error(errors[0].message);
        return;
      }
      toast.success("Membership renewed");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to renew membership");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitles}>
            <h2 className={styles.title}>Renew Membership</h2>
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
          <div className={styles.currentPlanBox}>
            <div className={styles.planLabel}>Current Plan</div>
            <div className={styles.planName}>{currentPlan}</div>
          </div>

          <div className={styles.durationSection}>
            <h3 className={styles.sectionTitle}>Renewal Duration</h3>
            <div className={styles.durationGrid}>
              {[3, 6, 12].map((months) => (
                <div 
                  key={months} 
                  className={`${styles.durationTile} ${duration === months ? styles.durationActive : ""}`}
                  onClick={() => setDuration(months)}
                >
                  <span className={styles.durationNumber}>{months}</span>
                  <span className={styles.durationLabel}>months</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <div className={styles.summaryLeft}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Duration
              </div>
              <div className={styles.summaryRightBlack}>{duration} months</div>
            </div>
            <div className={styles.summaryRow}>
              <div className={styles.summaryLeft}>
                <span style={{ fontWeight: 600, marginRight: '8px', fontSize: '14px' }}>$</span>
                Amount
              </div>
              <div className={styles.summaryRightBlack}>{getAmount(duration)}</div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.generateBtn}
            onClick={handleRenew}
            disabled={saving}
          >
            {saving ? "Renewing..." : "Generate Renewal Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
