"use client";

import React, { useState, FormEvent } from "react";
import { useMutation } from "@apollo/client";
import { toast } from "sonner";
import styles from "./generate-invoice-modal.module.css";
import { CREATE_INVOICE, GET_INVOICES } from "@/lib/apollo/operations";
import { ClientSelect, type SelectedClient } from "@/components/ui/client-select";

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyForm = {
  customerId: "",
  customerName: "",
  customerEmail: "",
  amount: "",
  planName: "",
  dueDate: "",
  notes: "",
};

export function GenerateInvoiceModal({ isOpen, onClose }: GenerateInvoiceModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [createInvoice] = useMutation(CREATE_INVOICE, {
    refetchQueries: [{ query: GET_INVOICES }],
  });

  const update = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const reset = () => setForm(emptyForm);

  const handleClose = () => {
    reset();
    onClose();
  };

  const buildInput = (status: string) => {
    const amountNum = Number(form.amount);
    const input: Record<string, unknown> = {
      customerId: form.customerId.trim(),
      customerName: form.customerName.trim(),
      amount: amountNum,
      status,
      issueDate: new Date().toISOString(),
    };
    if (form.customerEmail.trim()) input.customerEmail = form.customerEmail.trim();
    if (form.planName.trim()) input.planName = form.planName.trim();
    if (form.dueDate) input.dueDate = new Date(form.dueDate).toISOString();
    if (form.notes.trim()) input.notes = form.notes.trim();
    return { input, amountNum };
  };

  const handleSubmit = async (e: FormEvent, status: string) => {
    e.preventDefault();

    if (!form.customerId.trim() || !form.customerName.trim()) {
      toast.error("Please select a client");
      return;
    }
    const amountNum = Number(form.amount);
    if (!form.amount || Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error("A valid invoice amount is required");
      return;
    }

    setSubmitting(true);
    try {
      const { input } = buildInput(status);
      await createInvoice({ variables: { input } });
      toast.success(
        status === "DRAFT" ? "Invoice draft saved" : "Invoice generated successfully",
      );
      reset();
      onClose();
    } catch (err) {
      toast.error(
        `Failed to generate invoice: ${
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
            <h2 className={styles.title}>Generate Invoice</h2>
            <p className={styles.subtitle}>Create and review invoice details</p>
          </div>
        </div>

        <form className={styles.body} onSubmit={(e) => handleSubmit(e, "SENT")}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Client Details</h3>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Client</label>
            <ClientSelect
              value={form.customerId}
              onChange={(client: SelectedClient | null) => {
                update("customerId", client?.id || "");
                update("customerName", client?.name || "");
                update("customerEmail", client?.email || "");
              }}
              placeholder="Search and select a client..."
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              placeholder="client@example.com"
              value={form.customerEmail}
              onChange={(e) => update("customerEmail", e.target.value)}
            />
          </div>

          <div className={styles.sectionHeader} style={{ marginTop: '24px' }}>
            <h3 className={styles.sectionTitle}>Invoice Details</h3>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Plan Name</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Hot Desk - Monthly"
              value={form.planName}
              onChange={(e) => update("planName", e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={styles.input}
              placeholder="0"
              value={form.amount}
              onChange={(e) => update("amount", e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Due Date</label>
            <input
              type="date"
              className={styles.input}
              value={form.dueDate}
              onChange={(e) => update("dueDate", e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Notes</label>
            <textarea
              className={styles.textarea}
              rows={3}
              placeholder="Add payment terms or additional notes..."
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>

          <div className={styles.divider}></div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.textBtn}
              onClick={(e) => handleSubmit(e as unknown as FormEvent, "DRAFT")}
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Save Draft"}
            </button>
            <div className={styles.footerRight}>
              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={submitting}
              >
                {submitting ? "Generating…" : "Generate Invoice"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
