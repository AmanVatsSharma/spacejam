"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { GET_MY_CENTERS } from "@/lib/apollo/operations";
import { useUpdateCenterSettings } from "@/hooks/use-settings";
import styles from "./notification.module.css";

const Icons = {
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  ),
  whatsapp: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 16v-4"></path>
      <path d="M12 8h.01"></path>
    </svg> // mock icon for W
  ),
  email: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  ),
  push: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
      <line x1="12" y1="18" x2="12.01" y2="18"></line>
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
  dollar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  )
};

export default function CenterManagerNotificationConfig() {
  // Load center data
  const { data: centersData } = useQuery(GET_MY_CENTERS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  const { update: updateCenterSettings } = useUpdateCenterSettings();
  const centers = centersData?.myCenters ?? [];
  const primaryCenter = centers[0];

  const savedSettings = (primaryCenter?.settings as Record<string, any> | null) ?? null;
  const savedNotif = savedSettings?.managerConfig?.notifications ?? null;

  // States
  const [whatsapp, setWhatsapp] = useState(true);
  const [email, setEmail] = useState(true);
  const [push, setPush] = useState(false);

  const [bookingAlerts, setBookingAlerts] = useState(true);
  const [upgradeRequests, setUpgradeRequests] = useState(true);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);

  const [leadNotifications, setLeadNotifications] = useState(true);
  const [paymentOverdue, setPaymentOverdue] = useState(true);
  const [accountHold, setAccountHold] = useState(false);

  useEffect(() => {
    if (savedNotif) {
      if (typeof savedNotif.whatsapp === 'boolean') setWhatsapp(savedNotif.whatsapp);
      if (typeof savedNotif.email === 'boolean') setEmail(savedNotif.email);
      if (typeof savedNotif.push === 'boolean') setPush(savedNotif.push);

      if (typeof savedNotif.bookingAlerts === 'boolean') setBookingAlerts(savedNotif.bookingAlerts);
      if (typeof savedNotif.upgradeRequests === 'boolean') setUpgradeRequests(savedNotif.upgradeRequests);
      if (typeof savedNotif.maintenanceAlerts === 'boolean') setMaintenanceAlerts(savedNotif.maintenanceAlerts);

      if (typeof savedNotif.leadNotifications === 'boolean') setLeadNotifications(savedNotif.leadNotifications);
      if (typeof savedNotif.paymentOverdue === 'boolean') setPaymentOverdue(savedNotif.paymentOverdue);
      if (typeof savedNotif.accountHold === 'boolean') setAccountHold(savedNotif.accountHold);
    }
  }, [savedNotif]);

  useEffect(() => {
    if (!primaryCenter) return;
    const saveSettings = async () => {
      try {
        await updateCenterSettings(primaryCenter.id, {
          managerConfig: {
            notifications: {
              whatsapp, email, push,
              bookingAlerts, upgradeRequests, maintenanceAlerts,
              leadNotifications, paymentOverdue, accountHold
            }
          }
        });
      } catch (err) {
        console.error(err);
      }
    };
    const timeout = setTimeout(saveSettings, 1000);
    return () => clearTimeout(timeout);
  }, [whatsapp, email, push, bookingAlerts, upgradeRequests, maintenanceAlerts, leadNotifications, paymentOverdue, accountHold, primaryCenter]);


  return (
    <div className={styles.page}>
      <div className={styles.headerCard}>
        <div className={styles.headerTitleWrap}>
          <h1 className={styles.headerTitle}>Notifications</h1>
          <p className={styles.headerSubtitle}>Manage how and when you receive alerts</p>
        </div>
      </div>

      <div className={styles.managerSplitLayout}>
        <div className={styles.managerLeftCol}>
          
          {/* Channels */}
          <div className={styles.contentCardSmallPadding}>
            <div className={styles.formHeader}>
              <div className={styles.headerTitleWrap}>
                <h2 className={styles.formTitle}>Channels</h2>
                <p className={styles.inputSub} style={{ margin: 0 }}>Choose how you receive notifications</p>
              </div>
            </div>

            <div className={styles.channelBoxRow} style={{ marginTop: '24px' }}>
              <div className={`${styles.channelBox} ${whatsapp ? styles.channelBoxActive : ''}`}>
                <div className={styles.channelBoxTop}>
                  <span className={styles.channelBoxTitle}>WhatsApp</span>
                  <div className={`${styles.toggleSwitch} ${!whatsapp ? styles.toggleSwitchOff : ''}`} onClick={() => setWhatsapp(!whatsapp)}>
                    <div className={styles.toggleKnob} style={{ transform: whatsapp ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                  </div>
                </div>
                <div className={`${styles.channelBoxStatus} ${whatsapp ? styles.channelBoxStatusActive : ''}`}>
                  <div className={`${styles.statusDot} ${whatsapp ? styles.statusDotActive : ''}`}></div>
                  {whatsapp ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <div className={`${styles.channelBox} ${email ? styles.channelBoxActive : ''}`}>
                <div className={styles.channelBoxTop}>
                  <span className={styles.channelBoxTitle}>Email</span>
                  <div className={`${styles.toggleSwitch} ${!email ? styles.toggleSwitchOff : ''}`} onClick={() => setEmail(!email)}>
                    <div className={styles.toggleKnob} style={{ transform: email ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                  </div>
                </div>
                <div className={`${styles.channelBoxStatus} ${email ? styles.channelBoxStatusActive : ''}`}>
                  <div className={`${styles.statusDot} ${email ? styles.statusDotActive : ''}`}></div>
                  {email ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className={`${styles.channelBox} ${push ? styles.channelBoxActive : ''}`}>
                <div className={styles.channelBoxTop}>
                  <span className={styles.channelBoxTitle}>Push Notifications</span>
                  <div className={`${styles.toggleSwitch} ${!push ? styles.toggleSwitchOff : ''}`} onClick={() => setPush(!push)}>
                    <div className={styles.toggleKnob} style={{ transform: push ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                  </div>
                </div>
                <div className={`${styles.channelBoxStatus} ${push ? styles.channelBoxStatusActive : ''}`}>
                  <div className={`${styles.statusDot} ${push ? styles.statusDotActive : ''}`}></div>
                  {push ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>

          {/* Booking & Operations */}
          <div className={styles.contentCardSmallPadding}>
            <div className={styles.formHeader}>
              <div className={styles.formIcon} style={{ background: '#FF7847', color: 'white' }}>{Icons.calendar}</div>
              <div className={styles.headerTitleWrap}>
                <h2 className={styles.formTitle}>Booking & Operations</h2>
                <p className={styles.inputSub} style={{ margin: 0 }}>Stay updated on bookings and facility management</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
              <div className={styles.toggleCard}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleTitle} style={{ fontWeight: 600 }}>Booking Alerts</span>
                  <span className={styles.toggleSub}>Get notified when members book or cancel spaces</span>
                </div>
                <div className={`${styles.toggleSwitch} ${!bookingAlerts ? styles.toggleSwitchOff : ''}`} onClick={() => setBookingAlerts(!bookingAlerts)}>
                  <div className={styles.toggleKnob} style={{ transform: bookingAlerts ? 'translateX(24px)' : 'translateX(0px)' }}></div>
                </div>
              </div>

              <div className={styles.toggleCard}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleTitle} style={{ fontWeight: 600 }}>Upgrade Requests</span>
                  <span className={styles.toggleSub}>Alert when members request plan upgrades</span>
                </div>
                <div className={`${styles.toggleSwitch} ${!upgradeRequests ? styles.toggleSwitchOff : ''}`} onClick={() => setUpgradeRequests(!upgradeRequests)}>
                  <div className={styles.toggleKnob} style={{ transform: upgradeRequests ? 'translateX(24px)' : 'translateX(0px)' }}></div>
                </div>
              </div>

              <div className={styles.toggleCard}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleTitle} style={{ fontWeight: 600 }}>Maintenance Alerts</span>
                  <span className={styles.toggleSub}>Receive updates on facility maintenance issues</span>
                </div>
                <div className={`${styles.toggleSwitch} ${!maintenanceAlerts ? styles.toggleSwitchOff : ''}`} onClick={() => setMaintenanceAlerts(!maintenanceAlerts)}>
                  <div className={styles.toggleKnob} style={{ transform: maintenanceAlerts ? 'translateX(24px)' : 'translateX(0px)' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Leads & Payments */}
          <div className={styles.contentCardSmallPadding}>
            <div className={styles.formHeader}>
              <div className={styles.formIcon} style={{ background: '#FF7847', color: 'white' }}>{Icons.dollar}</div>
              <div className={styles.headerTitleWrap}>
                <h2 className={styles.formTitle}>Leads & Payments</h2>
                <p className={styles.inputSub} style={{ margin: 0 }}>Manage new leads and payment-related notifications</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
              <div className={styles.toggleCard}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleTitle} style={{ fontWeight: 600 }}>Lead Notifications</span>
                  <span className={styles.toggleSub}>Get alerts when new leads are assigned to you</span>
                </div>
                <div className={`${styles.toggleSwitch} ${!leadNotifications ? styles.toggleSwitchOff : ''}`} onClick={() => setLeadNotifications(!leadNotifications)}>
                  <div className={styles.toggleKnob} style={{ transform: leadNotifications ? 'translateX(24px)' : 'translateX(0px)' }}></div>
                </div>
              </div>

              <div className={styles.toggleCard}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleTitle} style={{ fontWeight: 600 }}>Payment Overdue Alerts</span>
                  <span className={styles.toggleSub}>Notify when member payments are past due</span>
                </div>
                <div className={`${styles.toggleSwitch} ${!paymentOverdue ? styles.toggleSwitchOff : ''}`} onClick={() => setPaymentOverdue(!paymentOverdue)}>
                  <div className={styles.toggleKnob} style={{ transform: paymentOverdue ? 'translateX(24px)' : 'translateX(0px)' }}></div>
                </div>
              </div>

              <div className={styles.toggleCard}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleTitle} style={{ fontWeight: 600 }}>Account Hold Alerts</span>
                  <span className={styles.toggleSub}>Alert when member accounts are placed on hold</span>
                </div>
                <div className={`${styles.toggleSwitch} ${!accountHold ? styles.toggleSwitchOff : ''}`} onClick={() => setAccountHold(!accountHold)}>
                  <div className={styles.toggleKnob} style={{ transform: accountHold ? 'translateX(24px)' : 'translateX(0px)' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Info Box Column */}
        <div className={styles.managerRightCol}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '8px' }}>About Channels</div>
          
          <div className={`${styles.infoBox} ${styles.infoBoxHighlight}`}>
            <div style={{ color: '#FF7847', flexShrink: 0 }}>{Icons.info}</div>
            <div>
              <div className={styles.infoBoxTitle}>Channel Selection</div>
              <div className={styles.infoBoxDesc}>Choose how you receive notifications across different channels. You can enable multiple channels for important updates.</div>
            </div>
          </div>

          <div className={styles.infoBox}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#FF7847', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>W</div>
            <div>
              <div className={styles.infoBoxTitle}>WhatsApp</div>
              <div className={styles.infoBoxDesc}>Receive instant alerts directly on your phone</div>
            </div>
          </div>

          <div className={styles.infoBox}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#FF7847', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>E</div>
            <div>
              <div className={styles.infoBoxTitle}>Email</div>
              <div className={styles.infoBoxDesc}>Get detailed summaries and reports via email</div>
            </div>
          </div>

          <div className={styles.infoBox}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#FF7847', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>P</div>
            <div>
              <div className={styles.infoBoxTitle}>Push</div>
              <div className={styles.infoBoxDesc}>Mobile app notifications for on-the-go updates</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
