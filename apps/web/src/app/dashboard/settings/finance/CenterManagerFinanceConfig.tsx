"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { toast } from "sonner";
import { GET_MY_CENTERS } from "@/lib/apollo/operations";
import { useUpdateCenterSettings } from "@/hooks/use-settings";
import styles from "./finance.module.css";

const Icons = {
  document: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  ),
  shieldCheck: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <polyline points="9 12 11 14 15 10"></polyline>
    </svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  upload: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  )
};

// Mock requests to match UI precisely since there isn't a direct endpoint tailored for this yet
const MOCK_REQUESTS = [
  { id: 1, name: "Rahul Sharma", type: "Release Request", status: "pending", amount: "₹5,000", time: "2 hours ago" },
  { id: 2, name: "Priya Mehta", type: "Freeze Request", status: "pending", amount: "₹10,000", time: "5 hours ago" },
  { id: 3, name: "Ankit Kumar", type: "Release Request", status: "approved", amount: "₹7,500", time: "1 day ago" },
  { id: 4, name: "Neha Singh", type: "Freeze Request", status: "rejected", amount: "₹15,000", time: "2 days ago" },
  { id: 5, name: "Vikram Patel", type: "Release Request", status: "pending", amount: "₹8,000", time: "3 hours ago" }
];

export default function CenterManagerFinanceConfig() {
  const [saving, setSaving] = useState(false);
  
  // Load center data
  const { data: centersData } = useQuery(GET_MY_CENTERS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  const { update: updateCenterSettings } = useUpdateCenterSettings();
  const centers = centersData?.myCenters ?? [];
  const primaryCenter = centers[0];

  // State
  const [reminderTiming, setReminderTiming] = useState("1 day before due date");
  const [reminderFrequency, setReminderFrequency] = useState("Daily");
  const [receiptAutoShare, setReceiptAutoShare] = useState(true);

  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReq, setSelectedReq] = useState(MOCK_REQUESTS[0]);
  const [verificationNotes, setVerificationNotes] = useState("");

  const savedSettings = (primaryCenter?.settings as Record<string, any> | null) ?? null;
  const savedFinance = savedSettings?.managerConfig?.finance ?? null;

  useEffect(() => {
    if (savedFinance) {
      if (savedFinance.reminderTiming) setReminderTiming(savedFinance.reminderTiming);
      if (savedFinance.reminderFrequency) setReminderFrequency(savedFinance.reminderFrequency);
      if (typeof savedFinance.receiptAutoShare === 'boolean') setReceiptAutoShare(savedFinance.receiptAutoShare);
    }
  }, [savedFinance]);

  // Handle saving the invoice preferences
  useEffect(() => {
    if (!primaryCenter) return;
    const saveSettings = async () => {
      setSaving(true);
      try {
        await updateCenterSettings(primaryCenter.id, {
          managerConfig: {
            finance: {
              reminderTiming,
              reminderFrequency,
              receiptAutoShare
            }
          }
        });
      } catch (err) {
        console.error(err);
      } finally {
        setSaving(false);
      }
    };
    
    // Using a simple debounce approach for the auto-save feel on toggles
    const timeout = setTimeout(saveSettings, 1000);
    return () => clearTimeout(timeout);
  }, [reminderTiming, reminderFrequency, receiptAutoShare, primaryCenter]);


  const filteredRequests = MOCK_REQUESTS.filter(r => {
    const matchesFilter = activeFilter === "All" || r.status.toLowerCase() === activeFilter.toLowerCase();
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className={styles.page}>
      {/* Top Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTitleWrap}>
          <h1 className={styles.headerTitle}>Financial Preferences</h1>
          <p className={styles.headerSubtitle}>Manage invoices, payment reminders, and deposit verification</p>
        </div>
      </div>

      {/* Invoice Preferences */}
      <div className={styles.contentCardSmallPadding}>
        <div className={styles.formHeader}>
          <div className={styles.formIcon} style={{ background: '#FFF3ED', color: '#FF7847' }}>{Icons.document}</div>
          <div className={styles.headerTitleWrap}>
            <h2 className={styles.formTitle}>Invoice Preferences</h2>
            <p className={styles.inputSub} style={{ margin: 0 }}>Automated invoice and payment reminder settings</p>
          </div>
        </div>

        <div className={styles.inputGrid} style={{ marginTop: '24px' }}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} style={{ fontWeight: 400 }}>Reminder Timing</label>
            <input type="text" className={styles.inputBox} value={reminderTiming} onChange={e => setReminderTiming(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} style={{ fontWeight: 400 }}>Payment Reminder Frequency</label>
            <input type="text" className={styles.inputBox} value={reminderFrequency} onChange={e => setReminderFrequency(e.target.value)} />
          </div>
        </div>

        <div className={styles.toggleCard} style={{ marginTop: '16px' }}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleTitle} style={{ fontWeight: 600 }}>Receipt Auto-share</span>
            <span className={styles.toggleSub}>Automatically send receipts to clients after payment</span>
          </div>
          <div className={`${styles.toggleSwitch} ${!receiptAutoShare ? styles.toggleSwitchOff : ''}`} onClick={() => setReceiptAutoShare(!receiptAutoShare)}>
            <div className={styles.toggleKnob} style={{ transform: receiptAutoShare ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
          </div>
        </div>

        <div className={styles.amountBox} style={{ marginTop: '16px', background: '#FFF9F6', border: '1px solid #FFE4D6', padding: '12px 16px', fontSize: '13px', color: '#4B5563' }}>
          <b>How it works:</b> Invoices will be sent automatically <b>{reminderTiming}</b>. Reminders repeat <b>{reminderFrequency.toLowerCase()}</b> until payment is completed.
        </div>
      </div>

      {/* Deposit Verification */}
      <div className={styles.contentCardSmallPadding}>
        <div className={styles.formHeader}>
          <div className={styles.formIcon} style={{ background: '#F3F4F6', color: '#6B7280' }}>{Icons.shieldCheck}</div>
          <div className={styles.headerTitleWrap}>
            <h2 className={styles.formTitle}>Deposit Verification</h2>
            <p className={styles.inputSub} style={{ margin: 0 }}>Review and process deposit freeze/release requests</p>
          </div>
        </div>

        <div className={styles.managerSplitLayout} style={{ marginTop: '24px' }}>
          
          {/* Left Panel */}
          <div className={styles.depositListPanel}>
            <div className={styles.searchBar}>
              {Icons.search}
              <input 
                type="text" 
                placeholder="Search requests..." 
                className={styles.searchInput}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className={styles.pillGroup} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {["All", "Pending", "Approved", "Rejected"].map(filter => (
                <div
                  key={filter}
                  className={`${styles.pill} ${activeFilter === filter ? styles.pillActive : ''}`}
                  style={{ textAlign: 'center', padding: '6px 0', fontSize: '12px', background: activeFilter === filter ? '#FF7847' : '#FFFFFF', border: '1px solid #E5E7EB', color: activeFilter === filter ? '#FFF' : '#6B7280' }}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '400px' }}>
              {filteredRequests.map(req => {
                const isActive = selectedReq.id === req.id;
                let statusClass = styles.statusPending;
                if (req.status === 'approved') statusClass = styles.statusApproved;
                if (req.status === 'rejected') statusClass = styles.statusRejected;

                return (
                  <div key={req.id} className={`${styles.requestCard} ${isActive ? styles.requestCardActive : ''}`} onClick={() => setSelectedReq(req)}>
                    <div className={styles.requestCardLeft}>
                      <span className={styles.requestName}>{req.name}</span>
                      <span className={styles.requestType}>{req.type}</span>
                      <span className={styles.requestAmount}>{req.amount}</span>
                    </div>
                    <div className={styles.requestCardRight}>
                      <span className={`${styles.statusBadge} ${statusClass}`}>{req.status}</span>
                      <span className={styles.requestTime}>{req.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel */}
          <div className={styles.depositDetailPanel}>
            {selectedReq && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937' }}>Deposit {selectedReq.type}</span>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>{selectedReq.name}</span>
                  </div>
                  <span className={`${styles.statusBadge} ${selectedReq.status === 'pending' ? styles.statusPending : selectedReq.status === 'approved' ? styles.statusApproved : styles.statusRejected}`}>
                    {selectedReq.status}
                  </span>
                </div>

                <div className={styles.amountBox}>
                  <div className={styles.amountBoxLabel}>Amount</div>
                  <div className={styles.amountBoxValue}>{selectedReq.amount}</div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel} style={{ fontWeight: 400 }}>Verification Notes</label>
                  <textarea 
                    className={styles.textAreaBox} 
                    placeholder="Add verification notes..."
                    value={verificationNotes}
                    onChange={e => setVerificationNotes(e.target.value)}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel} style={{ fontWeight: 400 }}>Proof Upload</label>
                  <div className={styles.uploadBox}>
                    <div style={{ color: '#6B7280' }}>{Icons.upload}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>Upload proof document</div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>PDF or image file</div>
                  </div>
                </div>

                <div className={styles.buttonRow}>
                  <button className={styles.primaryButton} onClick={() => toast.success("Release Request Submitted")}>
                    Submit Release Request
                  </button>
                  <button className={styles.secondaryButton} onClick={() => toast.success("Freeze Request Submitted")}>
                    Submit Freeze Request
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
      
    </div>
  );
}
