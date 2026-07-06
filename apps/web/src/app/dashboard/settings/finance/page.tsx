"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import styles from "./finance.module.css";

const Icons = {
  reset: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
      <polyline points="3 3 3 8 8 8"></polyline>
    </svg>
  ),
  save: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
  ),
  money: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2"></rect>
      <circle cx="12" cy="12" r="2"></circle>
      <path d="M6 12h.01M18 12h.01"></path>
    </svg>
  ),
  token: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2"></rect>
      <line x1="3" y1="12" x2="21" y2="12"></line>
    </svg>
  ),
  loop: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  ),
  undo: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"></polyline>
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
    </svg>
  ),
  trendDown: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
      <polyline points="17 18 23 18 23 12"></polyline>
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  document: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  )
};

export default function FinanceSettingsPage() {
  const [activeTab, setActiveTab] = useState("Wallet Rules"); // Defaulting to Wallet Rules based on prompt context, although usually Deposits
  
  // Toggles for Deposit Settings
  const [verificationRequired, setVerificationRequired] = useState(true);
  const [otpRequired, setOtpRequired] = useState(true);

  // Toggles for Wallet Rules
  const [transferable, setTransferable] = useState(false);
  const [refundableTokens, setRefundableTokens] = useState(true);
  const [nextMonthTopup, setNextMonthTopup] = useState(true);

  // Toggles for Refund Policies
  const [partialRefund, setPartialRefund] = useState(true);

  // Toggles for Invoice Defaults
  const [autoSendInvoices, setAutoSendInvoices] = useState(true);

  return (
    <div className={styles.page}>
      
      {/* Top Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTitleWrap}>
          <h1 className={styles.headerTitle}>Financial Rules</h1>
          <p className={styles.headerSubtitle}>Configure system-wide financial policies and behaviors</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.resetBtn}>
            {Icons.reset} Reset Default
          </button>
          <button className={styles.saveBtn}>
            {Icons.save} Save Rules
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className={styles.subTabs}>
        {["Deposits", "Wallet Rules", "Refund Policies", "Invoice Defaults"].map(tab => (
          <div 
            key={tab} 
            className={`${styles.subTab} ${activeTab === tab ? styles.subTabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Split Layout */}
      <div className={styles.splitLayout}>
        
        {/* LEFT COLUMN */}
        <div className={styles.leftCol}>
          
          {activeTab === "Deposits" && (
            <div className={styles.contentCard}>
              <div className={styles.formHeader}>
                <div className={styles.formIcon}>{Icons.money}</div>
                <h2 className={styles.formTitle}>Deposit Settings</h2>
              </div>

              <div className={styles.inputGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Minimum Deposit Amount</label>
                  <input type="text" className={styles.inputBox} defaultValue="Monthly Rent x 2" />
                  <span className={styles.inputSub}>Applicable to All center Booking</span>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Hold Duration</label>
                  <select className={`${styles.inputBox} ${styles.selectBox}`}>
                    <option>10 Days</option>
                    <option>15 Days</option>
                    <option>30 Days</option>
                  </select>
                </div>
              </div>

              <div className={styles.rangeGroup}>
                <div className={styles.rangeHeader}>
                  <span className={styles.inputLabel}>Refundable Percentage</span>
                  <span className={styles.rangeValue}>80%</span>
                </div>
                <div className={styles.rangeBarWrapper}>
                  <div className={styles.rangeBarFill} style={{ width: '80%' }}></div>
                </div>
                <span className={styles.inputSub}>Percentage of booking amount refundable on cancellation</span>
              </div>

              <div className={styles.toggleCards}>
                <div className={styles.toggleCard}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleTitle}>Verification Required</span>
                    <span className={styles.toggleSub}>Require admin verification for deposit release</span>
                  </div>
                  <div className={`${styles.toggleSwitch} ${!verificationRequired ? styles.toggleSwitchOff : ''}`} onClick={() => setVerificationRequired(!verificationRequired)}>
                    <div className={styles.toggleKnob} style={{ transform: verificationRequired ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                  </div>
                </div>

                <div className={styles.toggleCard}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleTitle}>OTP Approval Required</span>
                    <span className={styles.toggleSub}>Send OTP via WhatsApp for final approval</span>
                  </div>
                  <div className={`${styles.toggleSwitch} ${!otpRequired ? styles.toggleSwitchOff : ''}`} onClick={() => setOtpRequired(!otpRequired)}>
                    <div className={styles.toggleKnob} style={{ transform: otpRequired ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Wallet Rules" && (
            <>
              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formIcon}>{Icons.token}</div>
                  <h2 className={styles.formTitle}>Token Settings</h2>
                </div>

                <div className={styles.inputGrid3}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Center</label>
                    <select className={`${styles.inputBox} ${styles.selectBox}`}>
                      <option>Chandigarh Hub</option>
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Floor</label>
                    <select className={`${styles.inputBox} ${styles.selectBox}`}>
                      <option>Ground Floor</option>
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Seat Type</label>
                    <select className={`${styles.inputBox} ${styles.selectBox}`}>
                      <option>Hot Desk</option>
                    </select>
                  </div>
                </div>

                <div className={styles.inputGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Monthly Token Allocation</label>
                    <div className={styles.inputWithSuffix}>
                      <input type="text" className={styles.inputBox} defaultValue="50" />
                      <span className={styles.inputSuffix}>tokens</span>
                    </div>
                    <span className={styles.inputSub}>Default allocation per member</span>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Token Expiry Duration</label>
                    <input type="text" className={styles.inputBox} defaultValue="" />
                    <span className={styles.inputSub}>How long tokens remain valid</span>
                  </div>
                </div>

                <div className={styles.toggleCardsRow}>
                  <div className={styles.toggleCard}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Token Transferability</span>
                      <span className={styles.toggleSub}>Allow members to transfer tokens</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!transferable ? styles.toggleSwitchOff : ''}`} onClick={() => setTransferable(!transferable)}>
                      <div className={styles.toggleKnob} style={{ transform: transferable ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>

                  <div className={styles.toggleCard}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Refundable Tokens</span>
                      <span className={styles.toggleSub}>Tokens can be refunded to cash</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!refundableTokens ? styles.toggleSwitchOff : ''}`} onClick={() => setRefundableTokens(!refundableTokens)}>
                      <div className={styles.toggleKnob} style={{ transform: refundableTokens ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.helperBox}>
                  <div className={styles.helperIcon}>{Icons.info}</div>
                  <div className={styles.helperContent}>
                    <span className={styles.helperTitle}>Helper</span>
                    <span className={styles.helperText}>Tokens act as internal credits for bookings and services. They provide flexibility in managing member balances.</span>
                  </div>
                </div>
              </div>

              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formIcon}>{Icons.loop}</div>
                  <h2 className={styles.formTitle}>Automation Settings</h2>
                </div>

                <div className={styles.toggleCards}>
                  <div className={styles.toggleCard}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Next Month Top-up</span>
                      <span className={styles.toggleSub}>Automatically refill tokens when below threshold</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!nextMonthTopup ? styles.toggleSwitchOff : ''}`} onClick={() => setNextMonthTopup(!nextMonthTopup)}>
                      <div className={styles.toggleKnob} style={{ transform: nextMonthTopup ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>

                  <div className={styles.toggleCard} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                    <span className={styles.toggleTitle}>Threshold Trigger</span>
                    <div className={styles.inlineInputGroup}>
                      <span className={styles.inputSub}>Trigger when balance falls below</span>
                      <input type="text" className={styles.inputBox} style={{ width: '80px' }} defaultValue="10" />
                      <span className={styles.inputSub}>tokens</span>
                    </div>
                    <span className={styles.inputSub}>System will automatically allocate monthly tokens when member's balance drops below this threshold</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "Refund Policies" && (
            <>
              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formIcon}>{Icons.undo}</div>
                  <h2 className={styles.formTitle}>Cancellation Rules</h2>
                </div>

                <div className={styles.rangeGroup}>
                  <span className={styles.inputLabel}>Cancellation Fee: 15%</span>
                  <div className={styles.rangeBarWrapper}>
                    <div className={styles.rangeBarFill} style={{ width: '15%' }}></div>
                  </div>
                  <span className={styles.inputSub}>Percentage of booking amount charged as cancellation fee</span>
                </div>

                <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
                  <span className={styles.inputLabel}>Free Cancellation Window</span>
                  <div className={styles.inlineInputGroup}>
                    <input type="text" className={styles.inputBox} style={{ width: '80px' }} defaultValue="24" />
                    <span className={styles.inputSub}>hours before booking start</span>
                  </div>
                  <span className={styles.inputSub}>No cancellation fee if cancelled within this window</span>
                </div>
              </div>

              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formIcon}>{Icons.trendDown}</div>
                  <h2 className={styles.formTitle}>Downgrade Rules</h2>
                </div>

                <div className={styles.rangeGroup}>
                  <span className={styles.inputLabel}>Downgrade Fee: 10%</span>
                  <div className={styles.rangeBarWrapper}>
                    <div className={styles.rangeBarFill} style={{ width: '10%' }}></div>
                  </div>
                  <span className={styles.inputSub}>Fee charged when downgrading membership tier</span>
                </div>

                <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
                  <span className={styles.inputLabel}>Applicable Conditions</span>
                  <select className={`${styles.inputBox} ${styles.selectBox}`}>
                    <option>Anytime</option>
                  </select>
                  <span className={styles.inputSub}>When members can downgrade their plan</span>
                </div>
              </div>

              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formIcon}>{Icons.calendar}</div>
                  <h2 className={styles.formTitle}>Event Refunds</h2>
                </div>

                <div className={styles.inputGroup}>
                  <span className={styles.inputLabel}>Refund Timeline</span>
                  <div className={styles.inlineInputGroup}>
                    <select className={`${styles.inputBox} ${styles.selectBox}`} style={{ width: '80px' }}>
                      <option>7</option>
                    </select>
                    <span className={styles.inputSub}>days before event</span>
                  </div>
                  <span className={styles.inputSub}>Full refund available if cancelled this many days before event</span>
                </div>

                <div className={styles.toggleCard} style={{ marginTop: '16px' }}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleTitle}>Partial Refund</span>
                    <span className={styles.toggleSub}>Allow partial refunds for late cancellations</span>
                  </div>
                  <div className={`${styles.toggleSwitch} ${!partialRefund ? styles.toggleSwitchOff : ''}`} onClick={() => setPartialRefund(!partialRefund)}>
                    <div className={styles.toggleKnob} style={{ transform: partialRefund ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                  </div>
                </div>
              </div>

              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formIcon}>{Icons.warning}</div>
                  <h2 className={styles.formTitle}>Penalties</h2>
                </div>

                <div className={styles.rangeGroup}>
                  <span className={styles.inputLabel}>Late Payment Penalty: 5%</span>
                  <div className={styles.rangeBarWrapper}>
                    <div className={styles.rangeBarFill} style={{ width: '5%' }}></div>
                  </div>
                  <span className={styles.inputSub}>Additional charge for late payments</span>
                </div>

                <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
                  <span className={styles.inputLabel}>Grace Period</span>
                  <div className={styles.inlineInputGroup}>
                    <input type="text" className={styles.inputBox} style={{ width: '80px' }} defaultValue="3" />
                    <span className={styles.inputSub}>days after due date</span>
                  </div>
                  <span className={styles.inputSub}>No penalty applied within grace period</span>
                </div>
              </div>
            </>
          )}

          {activeTab === "Invoice Defaults" && (
            <>
              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formIcon}>{Icons.document}</div>
                  <h2 className={styles.formTitle}>Invoice Settings</h2>
                </div>

                <div className={styles.inputGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Invoice Prefix</label>
                    <input type="text" className={styles.inputBox} defaultValue="SJ" />
                    <span className={styles.inputSub}>Example: SJ-000123</span>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>GST %</label>
                    <input type="text" className={styles.inputBox} defaultValue="18" />
                    <span className={styles.inputSub}>Applied to all invoices</span>
                  </div>
                </div>

                <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.inputLabel}>Default Due Date</label>
                  <input type="text" className={styles.inputBox} />
                  <span className={styles.inputSub}>Payment due within this period from invoice date</span>
                </div>
              </div>

              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formIcon}>{Icons.clock}</div>
                  <h2 className={styles.formTitle}>Automation</h2>
                </div>

                <div className={styles.inputGroup}>
                  <span className={styles.inputLabel}>Reminder Intervals</span>
                  <div className={styles.pillGroup}>
                    <div className={`${styles.pill} ${styles.pillActive}`}>1 day</div>
                    <div className={`${styles.pill} ${styles.pillActive}`}>3 days</div>
                    <div className={`${styles.pill} ${styles.pillActive}`}>7 days</div>
                    <div className={styles.pill}>14 days</div>
                    <div className={styles.pill}>30 days</div>
                  </div>
                  <span className={styles.inputSub}>Automatic payment reminders will be sent at these intervals before due date</span>
                </div>

                <div className={styles.toggleCard} style={{ marginTop: '16px' }}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleTitle}>Auto-send Invoices</span>
                    <span className={styles.toggleSub}>Automatically send invoices to members via email</span>
                  </div>
                  <div className={`${styles.toggleSwitch} ${!autoSendInvoices ? styles.toggleSwitchOff : ''}`} onClick={() => setAutoSendInvoices(!autoSendInvoices)}>
                    <div className={styles.toggleKnob} style={{ transform: autoSendInvoices ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                  </div>
                </div>

                <div className={styles.helperBox} style={{ marginTop: '16px' }}>
                  <div className={styles.helperIcon}>{Icons.clock}</div>
                  <div className={styles.helperContent}>
                    <span className={styles.helperTitle}>Reminder Schedule</span>
                    <ul className={styles.infoBoxList}>
                      <li>Reminder 1: 1 day before due date</li>
                      <li>Reminder 2: 3 days before due date</li>
                      <li>Reminder 3: 7 days before due date</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.rightCol}>
          
          {activeTab === "Deposits" && (
            <div className={styles.contentCardSmallPadding}>
              <h3 className={styles.flowTitle}>Flow Preview</h3>
              <p className={styles.flowSub}>Click on a step to view details</p>

              <div className={styles.flowSteps}>
                <div className={styles.flowStep}>
                  <div className={styles.stepNum}>1</div>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepTitle}>Manager Request</span>
                    <span className={styles.stepDesc}>Manager initiates deposit request with member details</span>
                  </div>
                </div>
                <div className={styles.flowStep}>
                  <div className={styles.stepNum}>2</div>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepTitle}>Admin Approval</span>
                    <span className={styles.stepDesc}>Admin verifies deposit amount and member information</span>
                  </div>
                </div>
                <div className={styles.flowStep}>
                  <div className={`${styles.stepNum} ${styles.stepNumGrey}`}>3</div>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepTitle}>OTP Verification</span>
                    <span className={styles.stepDesc}>OTP sent via WhatsApp for final verification</span>
                  </div>
                </div>
                <div className={styles.flowStep}>
                  <div className={styles.stepNum}>4</div>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepTitle}>Deposit Released</span>
                    <span className={styles.stepDesc}>Deposit is released and credited to member wallet</span>
                  </div>
                </div>
              </div>

              <div className={styles.noteBox}>
                <strong>Note:</strong> All deposits follow this approval workflow. Required steps cannot be skipped.
              </div>
            </div>
          )}

          {activeTab === "Wallet Rules" && (
            <div className={styles.contentCardSmallPadding}>
              <h3 className={styles.flowTitle}>Token Overview</h3>
              
              <div className={styles.overviewSection}>
                <span className={styles.overviewLabel}>Monthly Allocation</span>
                <div className={styles.overviewBigText}>
                  50 <span>tokens per member</span>
                </div>
              </div>

              <div className={styles.summaryList}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Expiry Policy</span>
                  <span className={styles.summaryValue}>30 Days</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Center</span>
                  <span className={styles.summaryValue}>Chandigarh Hub</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Floor</span>
                  <span className={styles.summaryValue}>Ground Floor</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Seat Type</span>
                  <span className={styles.summaryValue}>Hot Desk</span>
                </div>
              </div>

              <div className={styles.summaryList}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Transferable</span>
                  <span className={styles.summaryValue} style={{ color: '#6B7280' }}>No</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Refundable</span>
                  <span className={styles.summaryValueGreen}>Yes</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Auto Top-up</span>
                  <span className={styles.summaryValueGreen}>Enabled</span>
                </div>
              </div>

              <div className={styles.infoBoxBgGreen}>
                <div className={styles.infoBoxTitleGreen}>Token Lifecycle</div>
                <ul className={styles.infoBoxList}>
                  <li>Member receives 50 tokens monthly</li>
                  <li>Used for bookings and services</li>
                  <li>Auto-refill when below 10 tokens</li>
                  <li>Expires after 30 Days</li>
                </ul>
              </div>

            </div>
          )}

          {activeTab === "Refund Policies" && (
            <div className={styles.contentCardSmallPadding}>
              <h3 className={styles.flowTitle} style={{ marginBottom: '24px' }}>Policy Summary</h3>
              
              <div className={styles.policyGroup}>
                <div className={styles.policyTitleRow}>
                  <span className={styles.policyTitleIcon}>{Icons.undo}</span>
                  <span className={styles.policyTitle}>Cancellations</span>
                </div>
                <div className={styles.summaryList} style={{ padding: 0, border: 'none' }}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Fee</span>
                    <span className={styles.summaryValue}>15%</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Free window</span>
                    <span className={styles.summaryValue}>24h</span>
                  </div>
                </div>
              </div>

              <div className={styles.policyGroup}>
                <div className={styles.policyTitleRow}>
                  <span className={styles.policyTitleIcon}>{Icons.trendDown}</span>
                  <span className={styles.policyTitle}>Downgrades</span>
                </div>
                <div className={styles.summaryList} style={{ padding: 0, border: 'none' }}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Fee</span>
                    <span className={styles.summaryValue}>10%</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Allowed</span>
                    <span className={styles.summaryValue}>Anytime</span>
                  </div>
                </div>
              </div>

              <div className={styles.policyGroup}>
                <div className={styles.policyTitleRow}>
                  <span className={styles.policyTitleIcon}>{Icons.calendar}</span>
                  <span className={styles.policyTitle}>Events</span>
                </div>
                <div className={styles.summaryList} style={{ padding: 0, border: 'none' }}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Full refund</span>
                    <span className={styles.summaryValue}>7 days before</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Partial refund</span>
                    <span className={styles.summaryValueGreen}>Enabled</span>
                  </div>
                </div>
              </div>

              <div className={styles.policyGroup}>
                <div className={styles.policyTitleRow}>
                  <span className={styles.policyTitleIcon}>{Icons.warning}</span>
                  <span className={styles.policyTitle}>Late Payments</span>
                </div>
                <div className={styles.summaryList} style={{ padding: 0, border: 'none' }}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Penalty</span>
                    <span className={styles.summaryValue} style={{ color: '#EF4444' }}>5%</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Grace period</span>
                    <span className={styles.summaryValue}>3 days</span>
                  </div>
                </div>
              </div>

              <div className={styles.policyGroup} style={{ marginTop: '32px' }}>
                <span className={styles.summaryValue} style={{ display: 'block', marginBottom: '12px' }}>Example Scenario</span>
                <div className={styles.summaryList} style={{ padding: 0, border: 'none' }}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Booking Amount: ₹10,000</span>
                  </div>
                  <div className={styles.summaryRow} style={{ marginTop: '8px' }}>
                    <span className={styles.summaryLabel}>Cancellation (15%)</span>
                    <span className={styles.summaryValue}>₹1,500</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Refund Amount</span>
                    <span className={styles.summaryValueGreen}>₹8,500</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Invoice Defaults" && (
            <div className={styles.contentCardSmallPadding}>
              <h3 className={styles.flowTitle} style={{ marginBottom: '24px' }}>Invoice Preview</h3>
              
              <div className={styles.invoicePreviewCard}>
                <div className={styles.invoiceHeader}>
                  <div className={styles.invoiceLogo}>
                    <div className={styles.invoiceLogoAvatar}>SJ</div>
                    <div>
                      <div className={styles.invoiceCompany}>SpaceJam</div>
                      <div className={styles.invoiceCompanySub}>Coworking Space</div>
                    </div>
                  </div>
                  <div className={styles.invoiceIdWrap}>
                    <div className={styles.invoiceIdLabel}>Invoice</div>
                    <div className={styles.invoiceId}>SJ-000123</div>
                  </div>
                </div>

                <div className={styles.invoiceDates}>
                  <div className={styles.invoiceDateRow}>
                    <span className={styles.invoiceDateLabel}>Issue Date:</span>
                    <span className={styles.invoiceDateValue}>Apr 29, 2026</span>
                  </div>
                  <div className={styles.invoiceDateRow}>
                    <span className={styles.invoiceDateLabel}>Due Date:</span>
                    <span className={`${styles.invoiceDateValue} ${styles.invoiceDateDue}`}>May 6, 2026</span>
                  </div>
                </div>

                <div className={styles.invoiceLines}>
                  <div className={styles.invoiceLine}>
                    <span className={styles.invoiceLineLabel}>Monthly Membership</span>
                    <span className={styles.invoiceLineValue}>₹10,000</span>
                  </div>
                  <div className={styles.invoiceLine}>
                    <span className={styles.invoiceLineLabel}>Meeting Room (2 hrs)</span>
                    <span className={styles.invoiceLineValue}>₹1,500</span>
                  </div>
                  <div className={styles.invoiceLine} style={{ marginTop: '16px' }}>
                    <span className={styles.invoiceLineLabel}>Subtotal</span>
                    <span className={styles.invoiceLineValue}>₹11,500</span>
                  </div>
                  <div className={styles.invoiceLine}>
                    <span className={styles.invoiceLineLabel}>GST (18%)</span>
                    <span className={styles.invoiceLineValue}>₹2,070</span>
                  </div>
                </div>

                <div className={styles.invoiceTotalRow}>
                  <span className={styles.invoiceTotalLabel}>Total Amount</span>
                  <span className={styles.invoiceTotalValue}>₹13,570</span>
                </div>
              </div>

              <div className={styles.summaryList} style={{ padding: 0, border: 'none' }}>
                <div className={styles.summaryRow} style={{ padding: '8px 0' }}>
                  <span className={styles.summaryLabel}>Invoice ID Format</span>
                  <span className={styles.summaryValue}>SJ-XXXXXX</span>
                </div>
                <div className={styles.summaryRow} style={{ padding: '8px 0' }}>
                  <span className={styles.summaryLabel}>GST Rate</span>
                  <span className={styles.summaryValue}>18%</span>
                </div>
                <div className={styles.summaryRow} style={{ padding: '8px 0' }}>
                  <span className={styles.summaryLabel}>Payment Due</span>
                  <span className={styles.summaryValue}>7 days</span>
                </div>
                <div className={styles.summaryRow} style={{ padding: '8px 0' }}>
                  <span className={styles.summaryLabel}>Auto-send</span>
                  <span className={styles.summaryValueGreen}>Enabled</span>
                </div>
                <div className={styles.summaryRow} style={{ padding: '8px 0' }}>
                  <span className={styles.summaryLabel}>Reminders</span>
                  <span className={styles.summaryValue}>3 scheduled</span>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
