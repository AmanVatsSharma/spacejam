"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import styles from "./freeze-account-modal.module.css";
import { FREEZE_DEPOSIT, GET_DEPOSITS } from "@/lib/apollo/operations";

interface FreezeAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  depositId?: string;
}

type Deposit = {
  id: string;
  customerName: string;
  referenceNumber: string;
  amount: number;
  status: string;
};

const FREEZE_REASONS = [
  { value: "", label: "" },
  { value: "payment", label: "Payment Delay" },
  { value: "violation", label: "Policy Violation" },
  { value: "other", label: "Other" },
];

export function FreezeAccountModal({
  isOpen,
  onClose,
  depositId,
}: FreezeAccountModalProps) {
  const [selectedId, setSelectedId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data, loading } = useQuery(GET_DEPOSITS);
  const deposits = useMemo<Deposit[]>(
    () => (data?.deposits as Deposit[] | undefined) ?? [],
    [data],
  );

  const effectiveId = depositId || selectedId;
  const selectedDeposit = useMemo(
    () => deposits.find((d) => d.id === effectiveId),
    [deposits, effectiveId],
  );

  const [freezeDeposit] = useMutation(FREEZE_DEPOSIT, {
    refetchQueries: [{ query: GET_DEPOSITS }],
  });

  const handleClose = () => {
    setSelectedId("");
    setReason("");
    setNotes("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!effectiveId) {
      toast.error("Please select a deposit to freeze");
      return;
    }
    setSubmitting(true);
    try {
      await freezeDeposit({ variables: { id: effectiveId } });
      toast.success("Deposit frozen successfully");
      handleClose();
    } catch (err) {
      toast.error(
        `Failed to freeze deposit: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.overlay} transition-opacity duration-200`} onClick={handleClose}>
      <div className={`${styles.modal} transition-all duration-200`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitles}>
            <h2 className={styles.title}>Freeze Account</h2>
            <p className={styles.subtitle}>
              Temporarily freeze a security deposit
            </p>
          </div>
          <button className={styles.closeBtn} onClick={handleClose}>
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
          {/* Deposit info / selection */}
          {depositId && selectedDeposit ? (
            <div className={styles.infoBox}>
              <div className={styles.infoIcon}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className={styles.infoContent}>
                <h4 className={styles.infoTitle}>
                  {selectedDeposit.customerName || "Unknown customer"}
                </h4>
                <p className={styles.infoText}>
                  {selectedDeposit.referenceNumber || selectedDeposit.id} · ₹
                  {Number(selectedDeposit.amount ?? 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ) : (
            <div className={styles.rowGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Account Name</label>
                <div className={styles.selectWrapper}>
                  <select
                    className={styles.select}
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    disabled={loading || deposits.length === 0}
                  >
                    <option value="" disabled>
                      {loading
                        ? "Loading…"
                        : deposits.length === 0
                          ? "No deposits"
                          : "Select a deposit"}
                    </option>
                    {deposits.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.customerName || "Unknown"} —{" "}
                        {d.referenceNumber || d.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Freeze Reason</label>
                <div className={styles.selectWrapper}>
                  <select
                    className={styles.select}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    {FREEZE_REASONS.map((r) => (
                      <option key={r.value} value={r.value} disabled={r.value === ""}>
                        {r.label === "" ? "Select reason" : r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Additional Notes</label>
            <textarea
              className={styles.textarea}
              placeholder="Enter additional notes..."
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className={styles.infoBox}>
            <div className={styles.infoIcon}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div className={styles.infoContent}>
              <h4 className={styles.infoTitle}>Account will be frozen immediately</h4>
              <p className={styles.infoText}>
                This will freeze the deposit. The customer won&apos;t be able to
                use it. The client will be notified about the freeze and the
                reason provided.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancelBtn}
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className={styles.submitBtn}
            onClick={handleConfirm}
            disabled={submitting || !effectiveId}
          >
            {submitting ? (
              "Freezing…"
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                Freeze Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
