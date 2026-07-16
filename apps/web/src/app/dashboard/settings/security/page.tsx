"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  CHANGE_PASSWORD,
  GET_USER_SESSIONS,
  LOGOUT_DEVICE,
  LOGOUT_ALL_DEVICES,
} from "@/lib/apollo/operations";
import { useSettingsGroup } from "@/hooks/use-settings";
import { useAuth } from "@/contexts/auth-context";
import { getAccessToken } from "@/lib/apollo/token-storage";
import { toast } from "sonner";
import styles from "./security.module.css";

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
  lock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
  shield: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  ),
  mail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  ),
  smartphone: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
      <line x1="12" y1="18" x2="12.01" y2="18"></line>
    </svg>
  ),
  fingerprint: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 0 0-10 10c0 1.66.45 3.2 1.22 4.54"></path>
      <path d="M12 6a6 6 0 0 0-6 6c0 1.33.36 2.57.98 3.64"></path>
      <path d="M12 10a2 2 0 0 0-2 2"></path>
      <path d="M12 14v4"></path>
      <path d="M8 12.3a4.03 4.03 0 0 0 4 3.7c2.2 0 4-1.79 4-4a5.98 5.98 0 0 0-2.31-4.75"></path>
      <path d="M22.78 16.54A9.97 9.97 0 0 0 12 2a9.97 9.97 0 0 0-9.66 7.4"></path>
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  alertTriangle: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  monitor: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
  ),
  logOut: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  ),
  shieldCheck: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <path d="M9 12l2 2 4-4"></path>
    </svg>
  ),
  clipboardCheck: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
      <path d="M9 14l2 2 4-4"></path>
    </svg>
  ),
  trendingUp: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  )
};

export default function SecuritySettingsPage() {
  const [activeTab, setActiveTab] = useState("Authentication");

  // Persisted via Center.settings.security (deep-merged on save).
  const { draft, set, save, reset, saving } = useSettingsGroup("security", {
    emailLogin: true,
    otpLogin: true,
    biometricLogin: true,
    autoLogout: true,
    concurrentSessions: false,
    requireOtpLogin: true,
    requireDeviceVerification: false,
    ipRestriction: false,
    refundOtp: true,
    depositOtp: true,
    accountFreeze: true,
    adminRefunds: true,
    adminDeposits: false,
    multiStep: true,
    extraVerification: true,
    allowMultipleDevices: true,
    requireVerificationNewDevices: true,
    highValueTransactionThreshold: "10000",
    sessionTimeout: "30 minutes",
    deviceTrustDuration: "30 days",
  });

  return (
    <div className={styles.page}>

      {/* Top Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTitleWrap}>
          <h1 className={styles.headerTitle}>Security & Verification</h1>
          <p className={styles.headerSubtitle}>Manage authentication, access control, and verification rules</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.resetBtn} onClick={reset} disabled={saving}>
            {Icons.reset} Reset Default
          </button>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>
            {Icons.save} {saving ? "Saving…" : "Save Rules"}
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className={styles.subTabs}>
        {["Authentication", "Verification Rules", "Device Management"].map(tab => (
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

          {activeTab === "Authentication" && (
            <>
              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formHeaderLeft}>
                    <div className={styles.formIcon}>{Icons.lock}</div>
                    <h2 className={styles.formTitle}>Login Methods</h2>
                  </div>
                  <div className={styles.formSubTitle}>Primary method: OTP</div>
                </div>

                <div className={styles.toggleCards}>
                  <div className={styles.toggleCard} style={{ border: 'none', background: '#F9FAFB' }}>
                    <div className={styles.toggleTitleWrap}>
                      <div className={styles.iconWrap}>{Icons.mail}</div>
                      <div className={styles.toggleInfo} style={{ marginLeft: '8px' }}>
                        <span className={styles.toggleTitle}>Email Login</span>
                        <span className={styles.toggleSub}>Allow users to login with email and password</span>
                      </div>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!draft.emailLogin ? styles.toggleSwitchOff : ''}`} onClick={() => set('emailLogin', !draft.emailLogin)}>
                      <div className={styles.toggleKnob} style={{ transform: draft.emailLogin ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>

                  <div className={styles.toggleCard} style={{ border: 'none', background: '#F9FAFB' }}>
                    <div className={styles.toggleTitleWrap}>
                      <div className={styles.iconWrap}>{Icons.smartphone}</div>
                      <div className={styles.toggleInfo} style={{ marginLeft: '8px' }}>
                        <span className={styles.toggleTitle}>OTP Login</span>
                        <span className={styles.toggleSub}>One-time password sent via SMS or email</span>
                      </div>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!draft.otpLogin ? styles.toggleSwitchOff : ''}`} onClick={() => set('otpLogin', !draft.otpLogin)}>
                      <div className={styles.toggleKnob} style={{ transform: draft.otpLogin ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>

                  <div className={styles.toggleCard} style={{ border: 'none', background: '#F9FAFB' }}>
                    <div className={styles.toggleTitleWrap}>
                      <div className={styles.iconWrap}>{Icons.fingerprint}</div>
                      <div className={styles.toggleInfo} style={{ marginLeft: '8px' }}>
                        <span className={styles.toggleTitle}>Biometric Login</span>
                        <span className={styles.toggleSub}>Fingerprint or facial recognition on mobile devices</span>
                      </div>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!draft.biometricLogin ? styles.toggleSwitchOff : ''}`} onClick={() => set('biometricLogin', !draft.biometricLogin)}>
                      <div className={styles.toggleKnob} style={{ transform: draft.biometricLogin ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formHeaderLeft}>
                    <div className={styles.formIcon}>{Icons.clock}</div>
                    <h2 className={styles.formTitle}>Session Control</h2>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Session Timeout</label>
                  <select
                    className={`${styles.inputBox} ${styles.selectBox}`}
                    style={{ background: '#F9FAFB' }}
                    value={draft.sessionTimeout ?? "30 minutes"}
                    onChange={e => set('sessionTimeout', e.target.value)}
                  >
                    <option value="15 minutes">15 minutes</option>
                    <option value="30 minutes">30 minutes</option>
                    <option value="1 hour">1 hour</option>
                    <option value="4 hours">4 hours</option>
                    <option value="1 day">1 day</option>
                    <option value="Never">Never</option>
                  </select>
                  <span className={styles.inputSub}>Time before inactive users are automatically logged out</span>
                </div>

                <div className={styles.toggleCards} style={{ marginTop: '16px' }}>
                  <div className={styles.toggleCard} style={{ border: 'none', background: '#F9FAFB' }}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Auto Logout on Inactivity</span>
                      <span className={styles.toggleSub}>Automatically log out users after the timeout period</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!draft.autoLogout ? styles.toggleSwitchOff : ''}`} onClick={() => set('autoLogout', !draft.autoLogout)}>
                      <div className={styles.toggleKnob} style={{ transform: draft.autoLogout ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>

                  <div className={styles.toggleCard} style={{ border: 'none', background: '#F9FAFB' }}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Allow Concurrent Sessions</span>
                      <span className={styles.toggleSub}>Users can be logged in on multiple devices simultaneously</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!draft.concurrentSessions ? styles.toggleSwitchOff : ''}`} onClick={() => set('concurrentSessions', !draft.concurrentSessions)}>
                      <div className={styles.toggleKnob} style={{ transform: draft.concurrentSessions ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formHeaderLeft}>
                    <div className={styles.formIcon}>{Icons.shield}</div>
                    <h2 className={styles.formTitle}>Access Security</h2>
                  </div>
                </div>

                <div className={styles.toggleCards}>
                  <div className={styles.toggleCard} style={{ background: '#FFF9F6', borderColor: '#FFE4D6' }}>
                    <div className={styles.toggleInfo}>
                      <div className={styles.toggleTitleWrap}>
                        <span className={styles.toggleTitle}>Require OTP on Login</span>
                        <span className={styles.tagOrange}>Recommended</span>
                      </div>
                      <span className={styles.toggleSub}>Add an additional OTP verification step during login</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!draft.requireOtpLogin ? styles.toggleSwitchOff : ''}`} onClick={() => set('requireOtpLogin', !draft.requireOtpLogin)}>
                      <div className={styles.toggleKnob} style={{ transform: draft.requireOtpLogin ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>

                  <div className={styles.toggleCard} style={{ border: 'none', background: '#F9FAFB' }}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Require Device Verification</span>
                      <span className={styles.toggleSub}>Verify new devices before allowing login</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!draft.requireDeviceVerification ? styles.toggleSwitchOff : ''}`} onClick={() => set('requireDeviceVerification', !draft.requireDeviceVerification)}>
                      <div className={styles.toggleKnob} style={{ transform: draft.requireDeviceVerification ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>

                  <div className={styles.toggleCard} style={{ border: 'none', background: '#F9FAFB' }}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>IP Restriction</span>
                      <span className={styles.toggleSub}>Restrict access to specific IP addresses or ranges</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!draft.ipRestriction ? styles.toggleSwitchOff : ''}`} onClick={() => set('ipRestriction', !draft.ipRestriction)}>
                      <div className={styles.toggleKnob} style={{ transform: draft.ipRestriction ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "Verification Rules" && (
            <>
              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formHeaderLeft}>
                    <div className={styles.formIcon}>{Icons.shieldCheck}</div>
                    <h2 className={styles.formTitle}>Transaction Verification</h2>
                  </div>
                </div>

                <div className={styles.toggleCards}>
                  <div className={styles.toggleCard} style={{ border: 'none', background: '#FFFFFF' }}>
                    <div className={styles.toggleInfo}>
                      <div className={styles.toggleTitleWrap}>
                        <span className={styles.toggleTitle}>Refund OTP Required</span>
                        <span className={styles.tagOrange}>Recommended</span>
                      </div>
                      <span className={styles.toggleSub}>Require OTP verification for all refund transactions</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!draft.refundOtp ? styles.toggleSwitchOff : ''}`} onClick={() => set('refundOtp', !draft.refundOtp)}>
                      <div className={styles.toggleKnob} style={{ transform: draft.refundOtp ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                  <div style={{ height: '1px', background: '#F3F4F6' }}></div>

                  <div className={styles.toggleCard} style={{ border: 'none', background: '#FFFFFF' }}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Deposit Release OTP</span>
                      <span className={styles.toggleSub}>OTP verification required when releasing security deposits</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!draft.depositOtp ? styles.toggleSwitchOff : ''}`} onClick={() => set('depositOtp', !draft.depositOtp)}>
                      <div className={styles.toggleKnob} style={{ transform: draft.depositOtp ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                  <div style={{ height: '1px', background: '#F3F4F6' }}></div>

                  <div className={styles.toggleCard} style={{ border: 'none', background: '#FFFFFF' }}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Account Freeze Confirmation</span>
                      <span className={styles.toggleSub}>Require confirmation before freezing user accounts</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!draft.accountFreeze ? styles.toggleSwitchOff : ''}`} onClick={() => set('accountFreeze', !draft.accountFreeze)}>
                      <div className={styles.toggleKnob} style={{ transform: draft.accountFreeze ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formHeaderLeft}>
                    <div className={styles.formIcon}>{Icons.clipboardCheck}</div>
                    <h2 className={styles.formTitle}>Approval Workflows</h2>
                  </div>
                </div>

                <div className={styles.toggleCards}>
                  <div className={styles.toggleCard} style={{ border: 'none', background: '#FFFFFF' }}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Require Admin Approval for Refunds</span>
                      <span className={styles.toggleSub}>All refund requests must be approved by an admin</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!draft.adminRefunds ? styles.toggleSwitchOff : ''}`} onClick={() => set('adminRefunds', !draft.adminRefunds)}>
                      <div className={styles.toggleKnob} style={{ transform: draft.adminRefunds ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                  <div style={{ height: '1px', background: '#F3F4F6' }}></div>

                  <div className={styles.toggleCard} style={{ border: 'none', background: '#FFFFFF' }}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Require Admin Approval for Deposits</span>
                      <span className={styles.toggleSub}>Manual approval needed for deposit releases</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!draft.adminDeposits ? styles.toggleSwitchOff : ''}`} onClick={() => set('adminDeposits', !draft.adminDeposits)}>
                      <div className={styles.toggleKnob} style={{ transform: draft.adminDeposits ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                  <div style={{ height: '1px', background: '#F3F4F6' }}></div>

                  <div className={styles.toggleCard} style={{ border: 'none', background: '#FFFFFF' }}>
                    <div className={styles.toggleInfo}>
                      <div className={styles.toggleTitleWrap}>
                        <span className={styles.toggleTitle}>Multi-Step Verification</span>
                        <span className={styles.tagRed}>Advanced</span>
                      </div>
                      <span className={styles.toggleSub}>Require multiple verification steps for high-risk operations</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!draft.multiStep ? styles.toggleSwitchOff : ''}`} onClick={() => set('multiStep', !draft.multiStep)}>
                      <div className={styles.toggleKnob} style={{ transform: draft.multiStep ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formHeaderLeft}>
                    <div className={styles.formIcon}>{Icons.trendingUp}</div>
                    <h2 className={styles.formTitle}>Risk-Based Rules</h2>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>High-Value Transaction Threshold</label>
                  <input
                    type="text"
                    className={styles.inputBox}
                    value={draft.highValueTransactionThreshold ?? "10000"}
                    onChange={e => set('highValueTransactionThreshold', e.target.value)}
                  />
                  <span className={styles.inputSub}>Transactions above this amount are flagged as high-value</span>
                </div>

                <div className={styles.toggleCards} style={{ marginTop: '16px' }}>
                  <div className={styles.toggleCard} style={{ border: 'none', background: '#FFFFFF', padding: '0' }}>
                    <div className={styles.toggleInfo}>
                      <div className={styles.toggleTitleWrap}>
                        <span className={styles.toggleTitle}>Enable Extra Verification Above Threshold</span>
                        <span className={styles.tagRed}>High Security</span>
                      </div>
                      <span className={styles.toggleSub}>Require additional OTP and admin approval for high-value transactions</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!draft.extraVerification ? styles.toggleSwitchOff : ''}`} onClick={() => set('extraVerification', !draft.extraVerification)}>
                      <div className={styles.toggleKnob} style={{ transform: draft.extraVerification ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "Device Management" && (
            <>
              {(() => {
                const { data: sessionsData, loading: sessionsLoading, refetch: refetchSessions } = useQuery(GET_USER_SESSIONS);
                const [logoutDevice] = useMutation(LOGOUT_DEVICE);
                const [logoutAllDevices, { loading: logoutAllLoading }] = useMutation(LOGOUT_ALL_DEVICES);
                const { user } = useAuth();
                const sessions = sessionsData?.myActiveSessions ?? [];

                // Decode JWT to extract session identifier for current-device detection.
                const getCurrentSessionId = (): string | null => {
                  try {
                    const token = getAccessToken();
                    if (!token) return null;
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    return payload.sid ?? payload.jti ?? payload.sessionId ?? null;
                  } catch {
                    return null;
                  }
                };
                const currentSessionId = getCurrentSessionId();

                const handleLogoutDevice = async (sessionId: string) => {
                  try {
                    await logoutDevice({ variables: { id: sessionId } });
                    toast.success('Device logged out');
                    refetchSessions();
                  } catch {
                    toast.error('Failed to logout device');
                  }
                };

                const handleLogoutAll = async () => {
                  try {
                    const count = await logoutAllDevices();
                    toast.success(`Logged out ${count} device(s)`);
                    refetchSessions();
                  } catch {
                    toast.error('Failed to logout all devices');
                  }
                };

                const parseUserAgent = (ua: string | null | undefined): { device: string; browser: string; os: string } => {
                  if (!ua) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };
                  const lower = ua.toLowerCase();
                  let device = 'Desktop';
                  let browser = 'Unknown';
                  let os = 'Unknown';

                  if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) device = 'Mobile';
                  else if (lower.includes('tablet') || lower.includes('ipad')) device = 'Tablet';

                  if (lower.includes('chrome') && !lower.includes('edg')) browser = 'Chrome';
                  else if (lower.includes('safari') && !lower.includes('chrome')) browser = 'Safari';
                  else if (lower.includes('firefox')) browser = 'Firefox';
                  else if (lower.includes('edg')) browser = 'Edge';

                  if (lower.includes('windows')) os = 'Windows';
                  else if (lower.includes('mac os') || lower.includes('macintosh')) os = 'macOS';
                  else if (lower.includes('linux')) os = 'Linux';
                  else if (lower.includes('android')) os = 'Android';
                  else if (lower.includes('iphone') || lower.includes('ipad')) os = 'iOS';

                  return { device, browser, os };
                };

                const formatSessionTime = (iso: string): string => {
                  const date = new Date(iso);
                  const now = new Date();
                  const diffMs = now.getTime() - date.getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  if (diffMins < 1) return 'Active now';
                  if (diffMins < 60) return `Active ${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
                  const diffHrs = Math.floor(diffMins / 60);
                  if (diffHrs < 24) return `Active ${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
                  const diffDays = Math.floor(diffHrs / 24);
                  if (diffDays < 7) return `Active ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                  return `Active since ${date.toLocaleDateString()}`;
                };

                const formatExpiry = (iso: string): string => {
                  const date = new Date(iso);
                  const now = new Date();
                  const diffMs = date.getTime() - now.getTime();
                  if (diffMs <= 0) {
                    const diffAgo = now.getTime() - date.getTime();
                    const minsAgo = Math.floor(diffAgo / 60000);
                    if (minsAgo < 60) return `Expired ${minsAgo} min${minsAgo > 1 ? 's' : ''} ago`;
                    const hrsAgo = Math.floor(minsAgo / 60);
                    if (hrsAgo < 24) return `Expired ${hrsAgo} hr${hrsAgo > 1 ? 's' : ''} ago`;
                    const daysAgo = Math.floor(hrsAgo / 24);
                    return `Expired ${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
                  }
                  const diffDays = Math.floor(diffMs / 86400000);
                  const diffHrs = Math.floor(diffMs / 3600000);
                  const diffMins = Math.floor(diffMs / 60000);
                  if (diffMins < 60) return `Expires in ${diffMins} min${diffMins > 1 ? 's' : ''}`;
                  if (diffHrs < 24) return `Expires in ${diffHrs} hr${diffHrs > 1 ? 's' : ''}`;
                  if (diffDays < 7) return `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
                  return `Expires ${date.toLocaleDateString()}`;
                };

                return (
                  <>
                    <div className={styles.contentCard}>
                      <div className={styles.formHeader}>
                        <div className={styles.formHeaderLeft}>
                          <div className={styles.formIcon}>{Icons.monitor}</div>
                          <h2 className={styles.formTitle}>Active Devices</h2>
                          <span className={styles.inputSub} style={{ marginLeft: '8px' }}>
                            {sessionsLoading ? 'Loading...' : `${sessions.length} device${sessions.length !== 1 ? 's' : ''} currently active`}
                          </span>
                        </div>
                        <div
                          className={styles.formHeaderRight}
                          onClick={handleLogoutAll}
                          style={{ cursor: logoutAllLoading ? 'not-allowed' : 'pointer', opacity: logoutAllLoading ? 0.6 : 1 }}
                        >
                          {Icons.logOut} Logout All Devices
                        </div>
                      </div>

                      <div className={styles.deviceList}>
                        {sessionsLoading && (
                          <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>Loading devices...</div>
                        )}
                        {!sessionsLoading && sessions.length === 0 && (
                          <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>No active devices found.</div>
                        )}
                        {sessions.map((session: any) => {
                          const { device, browser, os } = parseUserAgent(session.userAgent);
                          const isCurrent = session.id === currentSessionId;
                          return (
                            <div className={styles.deviceCard} key={session.id}>
                              <div className={styles.deviceInfoLeft}>
                                <div className={`${styles.iconWrap} ${styles.iconWrapOutline}`}>
                                  {device === 'Mobile' ? Icons.smartphone : device === 'Tablet' ? Icons.smartphone : Icons.monitor}
                                </div>
                                <div className={styles.deviceInfoText}>
                                  <div className={styles.deviceNameWrap}>
                                    <span className={styles.deviceName}>{`${os} ${device}`}</span>
                                    {isCurrent && <span className={styles.deviceTagOrange}>Current Device</span>}
                                  </div>
                                  <div className={styles.deviceMeta}>
                                    <span className={styles.deviceMetaItem}>{`🌐 ${browser}`}</span>
                                    <span className={styles.deviceMetaItem}>{`📍 ${session.ipAddress ?? 'Unknown location'}`}</span>
                                    <span className={styles.deviceMetaItem}>{`🕒 ${formatSessionTime(session.createdAt)}`}</span>
                                    <span className={styles.deviceMetaItem}>{`⏱ ${formatExpiry(session.expiresAt)}`}</span>
                                  </div>
                                </div>
                              </div>
                              {isCurrent ? (
                                <button className={styles.deviceLogoutBtn} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>{Icons.logOut} Current</button>
                              ) : (
                                <button
                                  className={styles.deviceLogoutBtn}
                                  onClick={() => handleLogoutDevice(session.id)}
                                >{Icons.logOut} Logout</button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className={styles.contentCard}>
                <div className={styles.formHeader}>
                  <div className={styles.formHeaderLeft}>
                    <div className={styles.formIcon}>{Icons.monitor}</div>
                    <h2 className={styles.formTitle}>Device Rules</h2>
                  </div>
                </div>

                <div className={styles.toggleCards}>
                  <div className={styles.toggleCard} style={{ border: 'none', background: '#FFFFFF' }}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Allow Multiple Devices</span>
                      <span className={styles.toggleSub}>Users can be logged in from multiple devices simultaneously</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!draft.allowMultipleDevices ? styles.toggleSwitchOff : ''}`} onClick={() => set('allowMultipleDevices', !draft.allowMultipleDevices)}>
                      <div className={styles.toggleKnob} style={{ transform: draft.allowMultipleDevices ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                  <div style={{ height: '1px', background: '#F3F4F6' }}></div>

                  <div className={styles.toggleCard} style={{ border: 'none', background: '#FFFFFF' }}>
                    <div className={styles.toggleInfo}>
                      <div className={styles.toggleTitleWrap}>
                        <span className={styles.toggleTitle}>Require Verification for New Devices</span>
                        <span className={styles.tagOrange}>Recommended</span>
                      </div>
                      <span className={styles.toggleSub}>Send verification code when users login from unrecognized devices</span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!draft.requireVerificationNewDevices ? styles.toggleSwitchOff : ''}`} onClick={() => set('requireVerificationNewDevices', !draft.requireVerificationNewDevices)}>
                      <div className={styles.toggleKnob} style={{ transform: draft.requireVerificationNewDevices ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.inputLabel}>Device Trust Duration</label>
                  <select
                    className={`${styles.inputBox} ${styles.selectBox}`}
                    style={{ background: '#F9FAFB' }}
                    value={draft.deviceTrustDuration ?? "30 days"}
                    onChange={e => set('deviceTrustDuration', e.target.value)}
                  >
                    <option value="7 days">7 days</option>
                    <option value="30 days">30 days</option>
                    <option value="90 days">90 days</option>
                    <option value="Never">Never</option>
                  </select>
                  <span className={styles.inputSub}>How long to trust a device before requiring re-verification</span>
                </div>
              </div>
            </>
          )}

        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.rightCol}>

          {activeTab === "Authentication" && (
            <div className={styles.contentCardSmallPadding}>
              <div className={styles.rightPanelTitleWrap}>
                <div className={styles.rightPanelTitleIcon}>{Icons.shield}</div>
                <h3 className={styles.rightPanelTitle}>Authentication Security</h3>
              </div>

              <div className={styles.infoBoxList}>
                <div className={styles.infoBox}>
                  <div className={styles.infoBoxIcon}>{Icons.lock}</div>
                  <div className={styles.infoBoxContent}>
                    <span className={styles.infoBoxTitle}>OTP Protection</span>
                    <span className={styles.infoBoxText}>OTP adds an additional verification layer during login, ensuring only authorized users can access the system even if passwords are compromised.</span>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <div className={styles.infoBoxIcon}>{Icons.clock}</div>
                  <div className={styles.infoBoxContent}>
                    <span className={styles.infoBoxTitle}>Session Management</span>
                    <span className={styles.infoBoxText}>Session timeout logs users out after <b>30 minutes</b> of inactivity to prevent unauthorized access from unattended devices.</span>
                  </div>
                </div>
              </div>

              <div className={styles.warningBox} style={{ marginTop: '16px' }}>
                <div className={styles.warningBoxIcon}>{Icons.alertTriangle}</div>
                <div className={styles.infoBoxContent}>
                  <span className={styles.warningBoxTitle}>Device Verification Disabled</span>
                  <span className={styles.warningBoxText}>Users can login from any device without verification. Consider enabling for enhanced security.</span>
                </div>
              </div>

              <div className={styles.bulletListWrap}>
                <div className={styles.bulletListTitle}>Security Best Practices</div>
                <ul className={styles.bulletList}>
                  <li>Enable OTP for all admin and manager accounts</li>
                  <li>Enable device verification to prevent unauthorized access</li>
                  <li>Disable concurrent sessions for financial operations</li>
                </ul>
              </div>

              <div className={styles.summaryList} style={{ border: 'none', background: '#FFFFFF' }}>
                <div className={styles.summaryListTitle} style={{ marginBottom: '12px' }}>Active Security Features</div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>OTP Required</span>
                  <span className={styles.summaryValueOrange}>Yes</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Auto Logout</span>
                  <span className={styles.summaryValueOrange}>Enabled</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Concurrent Sessions</span>
                  <span className={styles.summaryValueOrange}>Restricted</span>
                </div>
              </div>

            </div>
          )}

          {activeTab === "Verification Rules" && (
            <div className={styles.contentCardSmallPadding}>
              <div className={styles.rightPanelTitleWrap}>
                <div className={styles.rightPanelTitleIcon}>{Icons.shield}</div>
                <h3 className={styles.rightPanelTitle}>Risk & Impact</h3>
              </div>

              <div className={styles.infoBoxList}>
                <div className={styles.infoBox}>
                  <div className={styles.infoBoxIcon}>{Icons.shieldCheck}</div>
                  <div className={styles.infoBoxContent}>
                    <span className={styles.infoBoxTitle}>Transaction Security</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ color: '#FF7847' }}>✓</span>
                        <span className={styles.infoBoxText}>Refund transactions require OTP verification</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ color: '#FF7847' }}>✓</span>
                        <span className={styles.infoBoxText}>Deposit releases require OTP verification</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ color: '#FF7847' }}>✓</span>
                        <span className={styles.infoBoxText}>Account freeze requires confirmation</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <div className={styles.infoBoxIcon}>{Icons.clipboardCheck}</div>
                  <div className={styles.infoBoxContent}>
                    <span className={styles.infoBoxTitle}>Approval Requirements</span>
                    <ul className={styles.bulletList} style={{ marginTop: '8px' }}>
                      <li>Refund actions require admin approval</li>
                      <li>Multi-step verification enabled for critical operations</li>
                    </ul>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <div className={styles.infoBoxIcon}>{Icons.trendingUp}</div>
                  <div className={styles.infoBoxContent}>
                    <span className={styles.infoBoxTitle}>High-Value Transactions</span>
                    <span className={styles.infoBoxText}>Transactions above <b>₹10,000</b> require OTP verification and admin approval.</span>
                  </div>
                </div>
              </div>

              <div className={styles.bulletListWrap}>
                <div className={styles.bulletListTitle}>Example Scenarios</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#1F2937' }}>Regular Refund (₹2,500)</span>
                    <ul className={styles.bulletList} style={{ marginTop: '8px' }}>
                      <li>OTP required</li>
                      <li>Admin approval needed</li>
                    </ul>
                  </div>
                  <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#1F2937' }}>High-Value Refund (₹15,000)</span>
                    <ul className={styles.bulletList} style={{ marginTop: '8px' }}>
                      <li>OTP verification required</li>
                      <li>Admin approval mandatory</li>
                      <li>Multi-step verification active</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className={styles.summaryList} style={{ border: 'none', background: '#FFFFFF' }}>
                <div className={styles.summaryListTitle} style={{ marginBottom: '12px' }}>Active Verifications</div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Refund OTP</span>
                  <span className={styles.summaryValueOrange}>Required</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Admin Approval</span>
                  <span className={styles.summaryValueOrange}>Active</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Multi-Step</span>
                  <span className={styles.summaryValueOrange}>Enabled</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Device Management" && (
            <div className={styles.contentCardSmallPadding}>
              <div className={styles.rightPanelTitleWrap}>
                <div className={styles.rightPanelTitleIcon}>{Icons.shield}</div>
                <h3 className={styles.rightPanelTitle}>Device Activity</h3>
              </div>

              <div className={styles.infoBoxList}>
                <div className={styles.statBox}>
                  <div className={styles.infoBoxIcon}>{Icons.monitor}</div>
                  <div className={styles.statBoxContent}>
                    <span className={styles.statBoxTitle}>Active Devices</span>
                    <span className={styles.statBoxValue}>3</span>
                    <span className={styles.statBoxSub}>Devices currently logged in</span>
                  </div>
                </div>

                <div className={styles.statBox}>
                  <div className={styles.infoBoxIcon}>{Icons.clock}</div>
                  <div className={styles.statBoxContent}>
                    <span className={styles.statBoxTitle}>Last Login</span>
                    <span className={styles.statBoxText}>2 hours ago <span style={{ color: '#6B7280', fontWeight: '400' }}>from Mumbai, Maharashtra</span></span>
                    <span className={styles.statBoxSub}>MacBook Pro • Chrome 120</span>
                  </div>
                </div>
              </div>

              <div className={styles.summaryList} style={{ border: 'none', background: '#FFFFFF', padding: '16px 0' }}>
                <div className={styles.summaryListTitle} style={{ marginBottom: '12px' }}>Device Types</div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#FF7847' }}>{Icons.monitor}</span> Desktop
                  </span>
                  <span className={styles.summaryValue} style={{ color: '#1F2937' }}>1</span>
                </div>
                <div className={styles.summaryRow} style={{ marginTop: '12px' }}>
                  <span className={styles.summaryLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#FF7847' }}>{Icons.smartphone}</span> Mobile
                  </span>
                  <span className={styles.summaryValue} style={{ color: '#1F2937' }}>1</span>
                </div>
                <div className={styles.summaryRow} style={{ marginTop: '12px' }}>
                  <span className={styles.summaryLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#FF7847' }}>{Icons.monitor}</span> Tablet
                  </span>
                  <span className={styles.summaryValue} style={{ color: '#1F2937' }}>1</span>
                </div>
              </div>

              <div className={styles.bulletListWrap}>
                <div className={styles.bulletListTitle}>Security Recommendations</div>
                <ul className={styles.bulletList}>
                  <li>Regularly review and remove unused devices</li>
                  <li>Enable device verification for enhanced security</li>
                  <li>Logout all devices if you suspect unauthorized access</li>
                </ul>
              </div>

              <div className={styles.summaryList} style={{ border: 'none', background: '#FFFFFF', padding: '16px 0 0 0' }}>
                <div className={styles.summaryListTitle} style={{ marginBottom: '12px' }}>Active Rules</div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Multiple Devices</span>
                  <span className={styles.summaryValueOrange}>Allowed</span>
                </div>
                <div className={styles.summaryRow} style={{ marginTop: '12px' }}>
                  <span className={styles.summaryLabel}>Verification</span>
                  <span className={styles.summaryValueOrange}>Required</span>
                </div>
                <div className={styles.summaryRow} style={{ marginTop: '12px' }}>
                  <span className={styles.summaryLabel}>Trust Duration</span>
                  <span className={styles.summaryValue} style={{ color: '#1F2937' }}>{draft.deviceTrustDuration ?? "30 days"}</span>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
