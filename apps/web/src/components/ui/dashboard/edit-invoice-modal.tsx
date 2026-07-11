"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import styles from "./edit-invoice-modal.module.css";
import { GET_INVOICE, UPDATE_INVOICE, GET_INVOICES } from "@/lib/apollo/operations";

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: string;
}

type InvoiceData = {
  customerName?: string | null;
  customerEmail?: string | null;
  amount?: number | null;
  tax?: number | null;
  totalAmount?: number | null;
  issueDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
};

/** Convert an ISO date string (or null) to the yyyy-MM-dd value a date input needs. */
const toDateInput = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export function EditInvoiceModal({ isOpen, onClose, invoiceId }: EditInvoiceModalProps) {
  const [taxMode, setTaxMode] = useState<"exclusive" | "inclusive">("exclusive");

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    amount: "",
    tax: "",
    issueDate: "",
    dueDate: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const skip = !isOpen || !invoiceId;
  const { data: invoiceData, loading } = useQuery(GET_INVOICE, {
    variables: { id: invoiceId },
    skip,
  });

  // Seed the form from fetched data using useEffect (Apollo 3.14+ removed onCompleted support)
  useEffect(() => {
    const inv = invoiceData?.invoice as InvoiceData | undefined;
    if (!inv || seeded) return;
    setForm({
      customerName: inv.customerName ?? "",
      customerEmail: inv.customerEmail ?? "",
      amount: inv.amount != null ? String(inv.amount) : "",
      tax: inv.tax != null ? String(inv.tax) : "",
      issueDate: toDateInput(inv.issueDate),
      dueDate: toDateInput(inv.dueDate),
      notes: inv.notes ?? "",
    });
    setSeeded(true);
  }, [invoiceData, seeded]);

  const [updateInvoice] = useMutation(UPDATE_INVOICE, {
    refetchQueries: [{ query: GET_INVOICES }],
  });

  const update = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleClose = () => {
    setSeeded(false);
    onClose();
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!invoiceId) {
      toast.error("Cannot save: missing invoice id");
      return;
    }

    if (!form.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setSubmitting(true);
    try {
      const input: Record<string, unknown> = {
        customerName: form.customerName.trim(),
      };
      if (form.customerEmail.trim()) input.customerEmail = form.customerEmail.trim();
      if (form.amount) {
        const amountNum = Number(form.amount);
        if (!Number.isNaN(amountNum)) input.amount = amountNum;
      }
      if (form.tax) {
        const taxNum = Number(form.tax);
        if (!Number.isNaN(taxNum)) input.tax = taxNum;
      }
      if (form.issueDate) input.issueDate = new Date(form.issueDate).toISOString();
      if (form.dueDate) input.dueDate = new Date(form.dueDate).toISOString();
      if (form.notes.trim()) input.notes = form.notes.trim();

      await updateInvoice({ variables: { id: invoiceId, input } });
      toast.success("Invoice updated");
      handleClose();
    } catch (err) {
      toast.error(
        `Failed to update invoice: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const subtotal = Number(form.amount) || 0;
  const taxAmount = Number(form.tax) || 0;
  const total = subtotal + taxAmount;

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(n);

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitles}>
            <h2 className={styles.title}>Edit Invoice</h2>
            <p className={styles.subtitle}>{invoiceId ?? "—"}</p>
          </div>
          <button className={styles.closeBtn} onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form className={styles.body} onSubmit={handleSave}>
          {/* Main Info Box */}
          <div className={styles.sectionBox}>
            <div className={styles.formGroup}>
              <label className={styles.label}>INVOICE DATE</label>
              <input
                type="date"
                className={styles.input}
                value={form.issueDate}
                onChange={(e) => update("issueDate", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>DUE DATE</label>
              <input
                type="date"
                className={styles.input}
                value={form.dueDate}
                onChange={(e) => update("dueDate", e.target.value)}
                disabled={loading}
              />
            </div>

            <div className={styles.amountDivider} />

            <div className={styles.amountWrap}>
              <div className={styles.amountLabel}>AMOUNT DUE</div>
              <div className={styles.amountValue}>{formatINR(total)}</div>
            </div>
          </div>

          {/* Bill To */}
          <div className={styles.sectionBox}>
            <h3 className={styles.sectionTitle}>Bill To</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>CUSTOMER NAME</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Customer name"
                value={form.customerName}
                onChange={(e) => update("customerName", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>EMAIL</label>
              <input
                type="email"
                className={styles.input}
                placeholder="customer@example.com"
                value={form.customerEmail}
                onChange={(e) => update("customerEmail", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className={styles.sectionBox}>
            <h3 className={styles.sectionTitle}>Pricing Breakdown</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>AMOUNT</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={styles.input}
                placeholder="0"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                disabled={loading}
              />
            </div>

            <div className={styles.pricingRow}>
              <span className={styles.pricingLabel}>Subtotal</span>
              <span className={styles.pricingValue}>{formatINR(subtotal)}</span>
            </div>

            <div className={styles.taxInputWrap}>
              <span className={styles.pricingLabel}>Tax</span>
              <div className={styles.taxInputInner}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={styles.smallInput}
                  placeholder="0"
                  value={form.tax}
                  onChange={(e) => update("tax", e.target.value)}
                  disabled={loading}
                />
                <span className={styles.percentSign}>₹</span>
              </div>
            </div>
            <div className={styles.pricingRow}>
              <span className={styles.pricingLabel}>Tax Amount</span>
              <span className={styles.pricingValue}>{formatINR(taxAmount)}</span>
            </div>

            <div className={styles.taxToggleWrap}>
              <div
                className={`${styles.taxToggleBtn} ${taxMode === "exclusive" ? styles.taxToggleActive : ""}`}
                onClick={() => setTaxMode("exclusive")}
              >
                Exclusive
              </div>
              <div
                className={`${styles.taxToggleBtn} ${taxMode === "inclusive" ? styles.taxToggleActive : ""}`}
                onClick={() => setTaxMode("inclusive")}
              >
                Inclusive
              </div>
            </div>

            <div className={styles.pricingDivider} />

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalValue}>{formatINR(total)}</span>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className={styles.sectionBox}>
            <h3 className={styles.sectionTitle}>Notes & Terms</h3>
            <textarea
              className={styles.textarea}
              rows={3}
              placeholder="Add payment terms, bank details, or additional notes..."
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              disabled={loading}
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
            <button type="submit" className={styles.saveBtn} disabled={submitting || loading}>
              {submitting ? "Saving…" : loading ? "Loading…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
