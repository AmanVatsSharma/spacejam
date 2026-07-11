"use client";

import React from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import styles from "./invoice-details-modal.module.css";
import { GET_INVOICE, MARK_INVOICE_PAID, GET_INVOICES } from "@/lib/apollo/operations";

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: string;
  /** Fallbacks used only while the real invoice data is still loading. */
  clientName?: string;
  amount?: number;
}

type Invoice = {
  id: string;
  invoiceNumber?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  planName?: string | null;
  amount?: number | null;
  tax?: number | null;
  totalAmount?: number | null;
  status?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  paidDate?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
};

const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const formatDate = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const statusLabel = (status?: string | null): string => {
  switch (status) {
    case "PAID":
      return "Paid";
    case "DRAFT":
      return "Draft";
    case "OVERDUE":
      return "Overdue";
    case "SENT":
      return "Sent";
    default:
      return status ?? "—";
  }
};

export function InvoiceDetailsModal({
  isOpen,
  onClose,
  invoiceId,
  clientName,
  amount,
}: InvoiceDetailsModalProps) {
  const skip = !isOpen || !invoiceId;

  const { data, loading } = useQuery(GET_INVOICE, {
    variables: { id: invoiceId },
    skip,
  });
  const invoice = data?.invoice as Invoice | undefined;

  const [markPaid, { loading: markingPaid }] = useMutation(MARK_INVOICE_PAID, {
    refetchQueries: [{ query: GET_INVOICES }, { query: GET_INVOICE, variables: { id: invoiceId } }],
  });

  if (!isOpen) return null;

  const displayName = invoice?.customerName ?? clientName ?? "—";
  const displayAmount = invoice?.totalAmount ?? invoice?.amount ?? amount ?? 0;
  const isPaid = invoice?.status === "PAID";

  const handleMarkPaid = async () => {
    if (!invoiceId) {
      toast.error("Cannot mark paid: missing invoice id");
      return;
    }
    try {
      await markPaid({ variables: { id: invoiceId, paymentMethod: "BANK_TRANSFER" } });
      toast.success("Invoice marked as paid");
    } catch (err) {
      toast.error(
        `Failed to mark paid: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleSendReminder = () => {
    toast.success("Reminder sent");
  };

  const handleDownload = () => {
    if (!invoice) {
      toast.error("No invoice data to download");
      return;
    }
    const lines = [
      `Invoice: ${invoice.invoiceNumber ?? invoice.id}`,
      `Customer: ${invoice.customerName ?? "—"}`,
      `Email: ${invoice.customerEmail ?? "—"}`,
      `Plan: ${invoice.planName ?? "—"}`,
      `Amount: ${formatINR(invoice.amount ?? 0)}`,
      `Tax: ${formatINR(invoice.tax ?? 0)}`,
      `Total: ${formatINR(invoice.totalAmount ?? 0)}`,
      `Status: ${statusLabel(invoice.status)}`,
      `Issue Date: ${formatDate(invoice.issueDate)}`,
      `Due Date: ${formatDate(invoice.dueDate)}`,
      `Paid Date: ${formatDate(invoice.paidDate)}`,
      `Payment Method: ${invoice.paymentMethod ?? "—"}`,
      `Notes: ${invoice.notes ?? "—"}`,
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoice.invoiceNumber ?? invoice.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitles}>
            <h2 className={styles.title}>Invoice Details</h2>
            <p className={styles.subtitle}>{invoice?.invoiceNumber ?? invoiceId ?? "—"}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Client</span>
              <span className={styles.summaryValueBlack}>{displayName}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Amount</span>
              <span className={styles.summaryValueOrange}>{formatINR(displayAmount)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Due Date</span>
              <span className={styles.summaryValueBlack}>
                {formatDate(invoice?.dueDate)}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Status</span>
              <span className={styles.statusBadge}>{statusLabel(invoice?.status)}</span>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Invoice Items</h3>
          <div className={styles.itemsBox}>
            {loading ? (
              <div className={styles.emptyHistory}>Loading…</div>
            ) : invoice ? (
              <>
                {invoice.planName && (
                  <div className={styles.itemRow}>
                    <div className={styles.itemLeft}>
                      <div className={styles.itemName}>{invoice.planName}</div>
                      <div className={styles.itemDesc}>Plan charge</div>
                    </div>
                    <div className={styles.itemAmount}>
                      {formatINR(invoice.amount ?? 0)}
                    </div>
                  </div>
                )}
                {(invoice.tax ?? 0) > 0 && (
                  <div className={styles.itemRow}>
                    <div className={styles.itemLeft}>
                      <div className={styles.itemName}>Tax</div>
                      <div className={styles.itemDesc}>Applicable taxes</div>
                    </div>
                    <div className={styles.itemAmount}>
                      {formatINR(invoice.tax ?? 0)}
                    </div>
                  </div>
                )}
                <div className={styles.totalRow}>
                  <div className={styles.totalLabel}>Total</div>
                  <div className={styles.totalAmount}>
                    {formatINR(invoice.totalAmount ?? invoice.amount ?? 0)}
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.emptyHistory}>No invoice data</div>
            )}
          </div>

          <h3 className={styles.sectionTitle}>Payment History</h3>
          <div className={styles.emptyHistory}>
            {isPaid && invoice?.paidDate
              ? `Paid on ${formatDate(invoice.paidDate)}${
                  invoice.paymentMethod ? ` via ${invoice.paymentMethod}` : ""
                }`
              : "No payment received yet"}
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.sendReminderBtn}
            onClick={handleSendReminder}
            disabled={isPaid}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            Send Reminder
          </button>

          <div className={styles.footerRow}>
            <button className={styles.downloadBtn} onClick={handleDownload}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download
            </button>
            <button
              className={styles.markPaidBtn}
              onClick={handleMarkPaid}
              disabled={markingPaid || isPaid}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {markingPaid ? "Marking…" : isPaid ? "Paid" : "Mark Paid"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
