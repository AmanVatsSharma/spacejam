"use client";

import React, { useState } from "react";
import styles from "./approve-release-modal.module.css";

interface ApproveReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApproveReleaseModal({ isOpen, onClose }: ApproveReleaseModalProps) {
  const [batchAction, setBatchAction] = useState("");

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitles}>
            <h2 className={styles.title}>Approve Release Requests</h2>
            <p className={styles.subtitle}>Review and approve pending release requests for security deposits</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          {/* Summary Box */}
          <div className={styles.summaryBox}>
            <div className={styles.summaryLeft}>
              <div className={styles.summaryIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <div className={styles.summaryInfo}>
                <div className={styles.summaryTitle}>2 Pending Requests</div>
                <div className={styles.summaryTotal}>Total: ₹11,500</div>
              </div>
            </div>
            <div className={styles.statusBadge}>Awaiting Approval</div>
          </div>

          {/* Pending Requests List */}
          <div className={styles.sectionGroup}>
            <h3 className={styles.sectionTitle}>Pending Requests</h3>
            <div className={styles.requestList}>
              {/* Item 1 */}
              <div className={styles.requestItem}>
                <div className={styles.requestItemTop}>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    <span className={styles.userName}>Michael Chen</span>
                  </div>
                  <div className={styles.actionButtons}>
                    <button className={styles.approveBtn}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      Approve
                    </button>
                    <button className={styles.rejectBtn}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>
                <div className={styles.requestDetails}>
                  <div className={styles.detailRow}>
                    <span>Amount: <strong style={{ color: '#06B6D4' }}>₹3,500</strong></span>
                    <span className={styles.dot}></span>
                    <span>SJ34- desk-A-1</span>
                    <span className={styles.dot}></span>
                    <span>Chandigarh Hub</span>
                  </div>
                  <div className={styles.dateRow}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Requested on Mar 25, 2026
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className={styles.requestItem}>
                <div className={styles.requestItemTop}>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    <span className={styles.userName}>Noah Brown</span>
                  </div>
                  <div className={styles.actionButtons}>
                    <button className={styles.approveBtn}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      Approve
                    </button>
                    <button className={styles.rejectBtn}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>
                <div className={styles.requestDetails}>
                  <div className={styles.detailRow}>
                    <span>Amount: <strong style={{ color: '#06B6D4' }}>₹8,000</strong></span>
                    <span className={styles.dot}></span>
                    <span>SJ34- desk-A-2</span>
                    <span className={styles.dot}></span>
                    <span>Chandigarh Hub</span>
                  </div>
                  <div className={styles.dateRow}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Requested on Mar 26, 2026
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.sectionGroup}>
            <h3 className={styles.sectionTitle}>Batch Action</h3>
            <div className={styles.selectWrapper}>
              <select 
                className={styles.select}
                value={batchAction}
                onChange={(e) => setBatchAction(e.target.value)}
              >
                <option value="" disabled>Select Batch Action</option>
                <option value="approve_all">Approve All</option>
                <option value="reject_all">Reject All</option>
              </select>
            </div>
          </div>

          <div className={styles.sectionGroup}>
            <h3 className={styles.sectionTitle}>Approval Notes (Optional)</h3>
            <textarea 
              className={styles.textarea}
              placeholder="Add any notes regarding this batch approval..."
              rows={3}
            />
          </div>

        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={batchAction ? styles.processBtnActive : styles.processBtnDisabled}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Process Approvals
          </button>
        </div>
      </div>
    </div>
  );
}
