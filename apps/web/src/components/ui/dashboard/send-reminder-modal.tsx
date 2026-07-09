"use client";

import React, { useMemo, useState, FormEvent } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import styles from "./send-reminder-modal.module.css";
import { SEND_DEPOSIT_REMINDER, GET_DEPOSITS } from "@/lib/apollo/operations";

interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  depositId?: string;
}

type Deposit = {
  id: string;
  customerName: string;
  referenceNumber: string;
  amount: number;
};

const REMINDER_TYPES = [
  { value: "payment", label: "Payment Due Reminder" },
  { value: "overdue", label: "Overdue Reminder" },
  { value: "release", label: "Release Update" },
];

const COMM_METHODS = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
];

const defaultTemplate = (
  reminderType: string,
  customerName?: string,
) => {
  const name = customerName?.trim() || "there";
  switch (reminderType) {
    case "overdue":
      return `Hi ${name}, your deposit payment is overdue. Please complete it at your earliest convenience.`;
    case "release":
      return `Hi ${name}, there's an update regarding your deposit release. Please contact us for details.`;
    case "payment":
    default:
      return `Hi ${name}, this is a friendly reminder that your deposit payment is due.`;
  }
};

export function SendReminderModal({
  isOpen,
  onClose,
  depositId,
}: SendReminderModalProps) {
  const [reminderType, setReminderType] = useState("payment");
  const [commMethod, setCommMethod] = useState("email");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data, loading } = useQuery(GET_DEPOSITS);
  const deposits = useMemo<Deposit[]>(
    () => (data?.deposits as Deposit[] | undefined) ?? [],
    [data],
  );

  // If depositId is provided, use it. Otherwise pick the first deposit by default.
  const [selectedId, setSelectedId] = useState<string>("");

  const effectiveId = depositId || selectedId;

  const selectedDeposit = useMemo(
    () => deposits.find((d) => d.id === effectiveId),
    [deposits, effectiveId],
  );

  const [sendReminder] = useMutation(SEND_DEPOSIT_REMINDER);

  const handleClose = () => {
    setReminderType("payment");
    setCommMethod("email");
    setMessage("");
    setSelectedId("");
    onClose();
  };

  const handleTypeChange = (value: string) => {
    setReminderType(value);
    // Refresh template only while the user hasn't typed a custom message.
    setMessage((prev) =>
      prev.trim()
        ? prev
        : defaultTemplate(value, selectedDeposit?.customerName),
    );
  };

  const handleDepositChange = (value: string) => {
    setSelectedId(value);
    const dep = deposits.find((d) => d.id === value);
    if (!message.trim()) {
      setMessage(defaultTemplate(reminderType, dep?.customerName));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!depositId && !effectiveId) {
      toast.error("Please select a deposit");
      return;
    }

    setSubmitting(true);
    try {
      await sendReminder({
        variables: { id: effectiveId, reminderType },
      });
      toast.success("Reminder sent");
      handleClose();
    } catch (err) {
      toast.error(
        `Failed to send reminder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitles}>
            <h2 className={styles.title}>Send Reminder</h2>
            <p className={styles.subtitle}>
              Send a reminder to a client about their deposit
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

        <form className={styles.body} onSubmit={handleSubmit}>
          {!depositId ? (
            <div className={styles.formGroup}>
              <label className={styles.label}>Deposit</label>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.select}
                  value={selectedId}
                  onChange={(e) => handleDepositChange(e.target.value)}
                  disabled={loading || deposits.length === 0}
                >
                  <option value="" disabled>
                    {loading
                      ? "Loading deposits…"
                      : deposits.length === 0
                        ? "No deposits available"
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
          ) : selectedDeposit ? (
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
                  {selectedDeposit.referenceNumber || selectedDeposit.id}
                </p>
              </div>
            </div>
          ) : null}

          <div className={styles.formGroup}>
            <label className={styles.label}>Reminder Type</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={reminderType}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                {REMINDER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Communication Method</label>
            <div className={styles.selectWrapper}>
              <div className={styles.inputPrefix}>
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
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <select
                className={styles.selectWithPrefix}
                value={commMethod}
                onChange={(e) => setCommMethod(e.target.value)}
              >
                {COMM_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Reminder Message</label>
            <textarea
              className={styles.textarea}
              placeholder="Enter reminder message..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className={styles.helpText}>
              Personalize your message or use the default template
            </p>
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
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <div className={styles.infoContent}>
              <h4 className={styles.infoTitle}>
                Reminder will be sent immediately
              </h4>
              <p className={styles.infoText}>
                The client will receive this notification via the selected
                communication method.
              </p>
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || (!depositId && !effectiveId)}
            >
              {submitting ? (
                "Sending…"
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
                  Send Reminder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
