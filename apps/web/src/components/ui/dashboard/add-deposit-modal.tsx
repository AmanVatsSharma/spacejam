"use client";

import React, { useMemo, useState, FormEvent } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import styles from "./add-deposit-modal.module.css";
import { CREATE_DEPOSIT, GET_DEPOSITS, GET_CENTERS } from "@/lib/apollo/operations";
import { ClientSelect, type SelectedClient } from "@/components/ui/client-select";

interface AddDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Center = { id: string; name: string };

const DEPOSIT_TYPES = [
  { value: "SECURITY", label: "Security" },
  { value: "ADVANCE", label: "Advance" },
  { value: "OTHER", label: "Other" },
];

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank Transfer" },
];

const emptyForm = {
  customerId: "",
  customerName: "",
  centerId: "",
  amount: "",
  type: "SECURITY",
  referenceNumber: "",
  notes: "",
};

export function AddDepositModal({ isOpen, onClose }: AddDepositModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const { data: centersData } = useQuery(GET_CENTERS);
  const centers = useMemo<Center[]>(
    () => (centersData?.centers as Center[] | undefined) ?? [],
    [centersData],
  );

  const [createDeposit] = useMutation(CREATE_DEPOSIT, {
    refetchQueries: [{ query: GET_DEPOSITS }],
  });

  const update = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const reset = () => setForm(emptyForm);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation: a client must be selected.
    if (!form.customerId.trim() || !form.customerName.trim()) {
      toast.error("Please select a client");
      return;
    }
    const amountNum = Number(form.amount);
    if (!form.amount || Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error("A valid deposit amount is required");
      return;
    }

    setSubmitting(true);
    try {
      const input: Record<string, unknown> = {
        customerId: form.customerId.trim(),
        customerName: form.customerName.trim(),
        amount: amountNum,
        depositType: form.type,
      };
      if (form.centerId) input.centerId = form.centerId;
      if (form.referenceNumber.trim())
        input.referenceNumber = form.referenceNumber.trim();
      if (form.notes.trim()) input.notes = form.notes.trim();

      await createDeposit({ variables: { input } });
      toast.success("Deposit added successfully");
      reset();
      onClose();
    } catch (err) {
      toast.error(
        `Failed to add deposit: ${
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
            <h2 className={styles.title}>Add Deposit</h2>
            <p className={styles.subtitle}>
              Add a new security deposit for a client
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
          <div className={styles.formGroup}>
            <label className={styles.label}>Client</label>
            <ClientSelect
              value={form.customerId}
              onChange={(client: SelectedClient | null) => {
                update("customerId", client?.id || "");
                update("customerName", client?.name || "");
              }}
              placeholder="Search and select a client..."
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Deposit Amount</label>
            <div className={styles.inputIconWrapper}>
              <span className={styles.inputPrefix}>₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={styles.inputWithPrefix}
                placeholder="0"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Deposit Type</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={form.type}
                onChange={(e) => update("type", e.target.value)}
              >
                {DEPOSIT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Center</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={form.centerId}
                onChange={(e) => update("centerId", e.target.value)}
              >
                <option value="">Select a center</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Reference Number</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Transaction / reference number"
              value={form.referenceNumber}
              onChange={(e) => update("referenceNumber", e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Payment Mode</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Notes (optional)</label>
            <textarea
              className={styles.input}
              placeholder="Any additional notes about this deposit"
              rows={3}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              style={{ resize: "vertical" }}
            />
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
              disabled={submitting}
            >
              {submitting ? "Adding…" : "Add Deposit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
