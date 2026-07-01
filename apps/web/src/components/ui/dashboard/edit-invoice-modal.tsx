"use client";

import React, { useState } from "react";
import styles from "./edit-invoice-modal.module.css";

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: string;
}

export function EditInvoiceModal({ isOpen, onClose, invoiceId = "INV-0052" }: EditInvoiceModalProps) {
  const [taxMode, setTaxMode] = useState<"exclusive" | "inclusive">("exclusive");

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitles}>
            <h2 className={styles.title}>Edit Invoice</h2>
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
          {/* Main Info Box */}
          <div className={styles.sectionBox}>
            <div className={styles.formGroup}>
              <label className={styles.label}>INVOICE NUMBER</label>
              <input type="text" className={styles.input} defaultValue="676" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>INVOICE DATE</label>
              <input type="text" className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>DUE DATE</label>
              <input type="text" className={styles.input} />
            </div>
            
            <div className={styles.amountDivider} />
            
            <div className={styles.amountWrap}>
              <div className={styles.amountLabel}>AMOUNT DUE</div>
              <div className={styles.amountValue}>₹7,080.00</div>
            </div>
          </div>

          {/* Bill To */}
          <div className={styles.sectionBox}>
            <h3 className={styles.sectionTitle}>Bill To</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>CUSTOMER NAME</label>
              <input type="text" className={styles.input} defaultValue="Dikshita Bansal" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>EMAIL</label>
              <input type="email" className={styles.input} defaultValue="dikshita@example.com" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>PHONE</label>
              <input type="text" className={styles.input} defaultValue="+91 98765 43210" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>GSTIN</label>
              <input type="text" className={styles.input} defaultValue="03BWYPB21G4C1ZW" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>ADDRESS</label>
              <input type="text" className={styles.input} />
            </div>
          </div>

          {/* Services / Line Items */}
          <div className={styles.sectionBox}>
            <h3 className={styles.sectionTitle}>Services / Line Items</h3>
            <div className={styles.lineItemBox}>
              <div className={styles.formGroup}>
                <label className={styles.label}>ITEM 1</label>
                <input type="text" className={styles.input} defaultValue="Open Workstation" style={{ marginBottom: "8px" }} />
                <input type="text" className={styles.input} defaultValue="Membership: Feb 2025" />
              </div>
              <div className={styles.rowGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>QTY</label>
                  <input type="number" className={styles.input} defaultValue={1} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>PRICE</label>
                  <input type="text" className={styles.input} defaultValue="6000" />
                </div>
              </div>
              <div className={styles.itemAmountWrap}>
                <span className={styles.itemAmountLabel}>AMOUNT</span>
                <span className={styles.itemAmountValue}>₹6,000</span>
              </div>
            </div>
            <button className={styles.addServiceBtn}>
              + Add Service
            </button>
          </div>

          {/* Pricing Breakdown */}
          <div className={styles.sectionBox}>
            <h3 className={styles.sectionTitle}>Pricing Breakdown</h3>
            <div className={styles.pricingRow}>
              <span className={styles.pricingLabel}>Subtotal</span>
              <span className={styles.pricingValue}>₹6,000.00</span>
            </div>
            
            <div className={styles.pricingRow}>
              <div className={styles.taxInputWrap}>
                <span className={styles.pricingLabel}>CGST</span>
                <div className={styles.taxInputInner}>
                  <input type="text" className={styles.smallInput} defaultValue="9" />
                  <span className={styles.percentSign}>%</span>
                </div>
              </div>
              <span className={styles.pricingValue}>₹540.00</span>
            </div>

            <div className={styles.pricingRow}>
              <div className={styles.taxInputWrap}>
                <span className={styles.pricingLabel}>SGST</span>
                <div className={styles.taxInputInner}>
                  <input type="text" className={styles.smallInput} defaultValue="9" />
                  <span className={styles.percentSign}>%</span>
                </div>
              </div>
              <span className={styles.pricingValue}>₹540.00</span>
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
              <span className={styles.totalValue}>₹7,080.00</span>
            </div>
          </div>

          {/* Business Details */}
          <div className={styles.sectionBox}>
            <h3 className={styles.sectionTitle}>Business Details</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>COMPANY NAME</label>
              <input type="text" className={styles.input} defaultValue="D B A" />
            </div>
            <div className={styles.rowGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.label}>PAN</label>
                <input type="text" className={styles.input} defaultValue="AALPD789Z" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>SAC CODE</label>
                <input type="text" className={styles.input} defaultValue="11222" />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>GSTIN</label>
              <input type="text" className={styles.input} defaultValue="03AAUPD7892F1ZZ" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>ADDRESS</label>
              <input type="text" className={styles.input} />
            </div>
          </div>

          {/* Notes & Terms */}
          <div className={styles.sectionBox}>
            <h3 className={styles.sectionTitle}>Notes & Terms</h3>
            <textarea 
              className={styles.textarea} 
              rows={3} 
              placeholder="Add payment terms, bank details, or additional notes..." 
            />
          </div>

          {/* Contact Information */}
          <div className={styles.sectionBox}>
            <h3 className={styles.sectionTitle}>Contact Information</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>PHONE</label>
              <input type="text" className={styles.input} defaultValue="9915739268" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>WEBSITE</label>
              <input type="text" className={styles.input} defaultValue="www.spacejam.in" />
            </div>
          </div>

        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
