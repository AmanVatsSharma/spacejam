"use client";

import React, { useMemo, useState } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import styles from "./approve-release-modal.module.css";
import { GET_DEPOSITS, APPROVE_DEPOSIT_RELEASE } from "@/lib/apollo/operations";
import { normalizeStatus } from "@/lib/revenue-status";

interface ApproveReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Inline gql for reject: reset status back to HELD via the generic updateDeposit
// mutation. This is the cleanest "reject release request" — the request is
// dismissed and the deposit stays held.
const RESET_DEPOSIT_STATUS = gql`
  mutation ResetDepositStatus($id: ID!, $input: UpdateDepositInput!) {
    updateDeposit(id: $id, input: $input) {
      id
      status
      updatedAt
    }
  }
`;

type Deposit = {
  id: string;
  customerId: string;
  customerName: string;
  centerId: string;
  center?: { id: string; name: string } | null;
  amount: number;
  depositType: string;
  status: string;
  referenceNumber: string;
  receivedDate: string;
  releasedDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const formatCurrency = (amount: number) =>
  `₹${Number(amount ?? 0).toLocaleString("en-IN")}`;

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

export function ApproveReleaseModal({ isOpen, onClose }: ApproveReleaseModalProps) {
  const [batchAction, setBatchAction] = useState("");
  const [notes, setNotes] = useState("");
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);

  const { data, loading } = useQuery(GET_DEPOSITS);

  const pendingDeposits = useMemo<Deposit[]>(() => {
    const list = (data?.deposits as Deposit[] | undefined) ?? [];
    return list.filter((d) => normalizeStatus(d?.status) === "RELEASE_REQUESTED");
  }, [data]);

  const stats = useMemo(() => {
    const count = pendingDeposits.length;
    const total = pendingDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    // High-priority heuristic: large deposits (> ₹5000) or older than 3 days.
    const now = Date.now();
    const highPriority = pendingDeposits.filter((d) => {
      const big = Number(d.amount) >= 5000;
      const old =
        d.createdAt && now - new Date(d.createdAt).getTime() > 3 * 24 * 60 * 60 * 1000;
      return big || old;
    }).length;
    return { count, total, highPriority };
  }, [pendingDeposits]);

  const [approveRelease] = useMutation(APPROVE_DEPOSIT_RELEASE, {
    refetchQueries: [{ query: GET_DEPOSITS }],
  });
  const [rejectRelease] = useMutation(RESET_DEPOSIT_STATUS, {
    refetchQueries: [{ query: GET_DEPOSITS }],
  });

  const markProcessing = (id: string) =>
    setProcessingIds((prev) => new Set(prev).add(id));
  const unmarkProcessing = (id: string) =>
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const handleApprove = async (id: string, name: string) => {
    markProcessing(id);
    try {
      await approveRelease({ variables: { id } });
      toast.success(`Release approved for ${name}`);
    } catch (err) {
      toast.error(
        `Failed to approve release for ${name}: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
    } finally {
      unmarkProcessing(id);
    }
  };

  const handleReject = async (id: string, name: string) => {
    markProcessing(id);
    try {
      await rejectRelease({ variables: { id, input: { status: "HELD" } } });
      toast.success(`Release request dismissed for ${name}`);
    } catch (err) {
      toast.error(
        `Failed to reject release for ${name}: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
    } finally {
      unmarkProcessing(id);
    }
  };

  const handleBatch = async () => {
    if (!batchAction || pendingDeposits.length === 0) return;
    setBatchProcessing(true);
    const action = batchAction; // capture
    try {
      const results = await Promise.allSettled(
        pendingDeposits.map((d) => {
          if (action === "approve_all") {
            return approveRelease({ variables: { id: d.id } });
          }
          return rejectRelease({
            variables: { id: d.id, input: { status: "HELD" } },
          });
        }),
      );
      const fulfilled = results.filter((r) => r.status === "fulfilled").length;
      const rejected = results.length - fulfilled;
      if (action === "approve_all") {
        toast.success(
          `Approved ${fulfilled} release request${fulfilled === 1 ? "" : "s"}` +
            (rejected ? ` (${rejected} failed)` : ""),
        );
      } else {
        toast.success(
          `Rejected ${fulfilled} release request${fulfilled === 1 ? "" : "s"}` +
            (rejected ? ` (${rejected} failed)` : ""),
        );
      }
      setBatchAction("");
      setNotes("");
      onClose();
    } catch (err) {
      toast.error(
        `Batch action failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setBatchProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.overlay} transition-opacity duration-200`} onClick={onClose}>
      <div className={`${styles.modal} transition-all duration-200`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitles}>
            <h2 className={styles.title}>Approve Release Requests</h2>
            <p className={styles.subtitle}>
              Review and approve pending release requests for security deposits
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
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
          {/* Summary Box */}
          <div className={styles.summaryBox}>
            <div className={styles.summaryLeft}>
              <div className={styles.summaryIcon}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <div className={styles.summaryInfo}>
                <div className={styles.summaryTitle}>
                  {stats.count} Pending Request{stats.count === 1 ? "" : "s"}
                </div>
                <div className={styles.summaryTotal}>
                  Total: {formatCurrency(stats.total)} · {stats.highPriority}{" "}
                  high-priority
                </div>
              </div>
            </div>
            <div className={styles.statusBadge}>Awaiting Approval</div>
          </div>

          {/* Pending Requests List */}
          <div className={styles.sectionGroup}>
            <h3 className={styles.sectionTitle}>Pending Requests</h3>
            {loading ? (
              <div className={styles.requestList}>
                <div className={styles.requestItem}>
                  <div className={styles.dateRow}>Loading requests…</div>
                </div>
              </div>
            ) : pendingDeposits.length === 0 ? (
              <div className={styles.requestList}>
                <div className={styles.requestItem}>
                  <div className={styles.userName}>No pending release requests</div>
                  <div className={styles.dateRow}>
                    All caught up. New release requests will appear here.
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.requestList}>
                {pendingDeposits.map((d) => {
                  const busy = processingIds.has(d.id);
                  return (
                    <div key={d.id} className={styles.requestItem}>
                      <div className={styles.requestItemTop}>
                        <div className={styles.userInfo}>
                          <div className={styles.avatar}>
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
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                          </div>
                          <span className={styles.userName}>
                            {d.customerName || "Unknown customer"}
                          </span>
                        </div>
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.approveBtn}
                            disabled={busy}
                            onClick={() =>
                              handleApprove(d.id, d.customerName || "customer")
                            }
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            {busy ? "…" : "Approve"}
                          </button>
                          <button
                            className={styles.rejectBtn}
                            disabled={busy}
                            onClick={() =>
                              handleReject(d.id, d.customerName || "customer")
                            }
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="15" y1="9" x2="9" y2="15"></line>
                              <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                            {busy ? "…" : "Reject"}
                          </button>
                        </div>
                      </div>
                      <div className={styles.requestDetails}>
                        <div className={styles.detailRow}>
                          <span>
                            Amount:{" "}
                            <strong style={{ color: "#06B6D4" }}>
                              {formatCurrency(d.amount)}
                            </strong>
                          </span>
                          <span className={styles.dot}></span>
                          <span>{d.referenceNumber || "—"}</span>
                          {d.center?.name ? (
                            <>
                              <span className={styles.dot}></span>
                              <span>{d.center.name}</span>
                            </>
                          ) : null}
                        </div>
                        <div className={styles.dateRow}>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="3"
                              y="4"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            ></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          {d.updatedAt
                            ? `Requested on ${formatDate(d.updatedAt)}`
                            : `Requested on ${formatDate(d.createdAt)}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.sectionGroup}>
            <h3 className={styles.sectionTitle}>Batch Action</h3>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={batchAction}
                onChange={(e) => setBatchAction(e.target.value)}
                disabled={pendingDeposits.length === 0}
              >
                <option value="" disabled>
                  Select Batch Action
                </option>
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={
              batchAction ? styles.processBtnActive : styles.processBtnDisabled
            }
            disabled={!batchAction || batchProcessing || pendingDeposits.length === 0}
            onClick={handleBatch}
          >
            {batchProcessing ? (
              "Processing…"
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Process Approvals
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
