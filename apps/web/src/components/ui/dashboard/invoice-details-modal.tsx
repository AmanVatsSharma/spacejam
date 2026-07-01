"use client";

import React from "react";
import styles from "./invoice-details-modal.module.css";

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: string;
  clientName?: string;
  amount?: number;
}

export function InvoiceDetailsModal({ isOpen, onClose, invoiceId = "INV-0052", clientName = "Patel Enterprises", amount = 50000 }: InvoiceDetailsModalProps) {
  if (!isOpen) return null;

  const formatINR = (n: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitles}>
            <h2 className={styles.title}>Invoice Details</h2>
            <p className={styles.subtitle}>{invoiceId}</p>
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
              <span className={styles.summaryValueBlack}>{clientName}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Amount</span>
              <span className={styles.summaryValueOrange}>{formatINR(amount)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Due Date</span>
              <span className={styles.summaryValueBlack}>24 Nov</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Status</span>
              <span className={styles.statusBadge}>Overdue by 7 days</span>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Invoice Items</h3>
          <div className={styles.itemsBox}>
            <div className={styles.itemRow}>
              <div className={styles.itemLeft}>
                <div className={styles.itemName}>Hot Desk - Monthly</div>
                <div className={styles.itemDesc}>1 × ₹20,000</div>
              </div>
              <div className={styles.itemAmount}>{formatINR(20000)}</div>
            </div>
            <div className={styles.itemRow}>
              <div className={styles.itemLeft}>
                <div className={styles.itemName}>Meeting Room Credits</div>
                <div className={styles.itemDesc}>10 hours × ₹500</div>
              </div>
              <div className={styles.itemAmount}>{formatINR(5000)}</div>
            </div>
            <div className={styles.totalRow}>
              <div className={styles.totalLabel}>Total</div>
              <div className={styles.totalAmount}>{formatINR(amount)}</div>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Payment History</h3>
          <div className={styles.emptyHistory}>
            No payment received yet
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.sendReminderBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            Send Reminder
          </button>
          
          <div className={styles.footerRow}>
            <button className={styles.downloadBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download
            </button>
            <button className={styles.markPaidBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Mark Paid
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
