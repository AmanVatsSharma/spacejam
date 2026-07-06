"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import styles from "./notification.module.css";

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
  whatsapp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
  ),
  email: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  ),
  push: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  ),
  sms: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  send: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  ),
  lightning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  ),
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  upload: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  ),
  preview: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  warningTriangle: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  )
};

export default function NotificationSettingsPage() {
  const [activeTab, setActiveTab] = useState("Channels");
  
  // Channels State
  const [channels, setChannels] = useState([
    { id: 'whatsapp', name: 'WhatsApp', icon: Icons.whatsapp, active: true, connected: true },
    { id: 'email', name: 'Email', icon: Icons.email, active: true, connected: true },
    { id: 'push', name: 'Push Notifications', icon: Icons.push, active: false, connected: false },
    { id: 'sms', name: 'SMS', icon: Icons.sms, active: true, connected: true },
  ]);

  const [activeChannelConfig, setActiveChannelConfig] = useState<string | null>(null);

  const toggleChannel = (id: string) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  // Automations State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const renderConfigRightPanel = () => {
    if (!activeChannelConfig) {
      return (
        <div className={styles.contentCardSmallPadding}>
          <h3 className={styles.configTitle}>Help & Tips</h3>
          <div className={styles.helpTipBox}>
            Configure notification channels to reach your users effectively
          </div>
          <div className={styles.helpTipBoxOrange}>
            Test all templates before enabling automated workflows
          </div>
        </div>
      );
    }

    if (activeChannelConfig === 'whatsapp') {
      return (
        <div className={styles.contentCardSmallPadding}>
          <div className={styles.configHeader}>
            <div className={styles.channelIcon}>{Icons.whatsapp}</div>
            <h3 className={styles.configTitle}>WhatsApp Configuration</h3>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>API Key</label>
            <input type="text" className={styles.formInput} defaultValue="sk_live_..." />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Sender ID</label>
            <input type="text" className={styles.formInput} defaultValue="+1234567890" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Business Account ID</label>
            <input type="text" className={styles.formInput} defaultValue="BA_12345" />
          </div>
          <button className={styles.testBtn}>
            {Icons.send} Send Test Message
          </button>
        </div>
      );
    }

    if (activeChannelConfig === 'push') {
      return (
        <div className={styles.contentCardSmallPadding}>
          <div className={styles.configHeader}>
            <div className={styles.channelIcon}>{Icons.push}</div>
            <h3 className={styles.configTitle}>Push Notifications Configuration</h3>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Firebase Server Key</label>
            <input type="text" className={styles.formInput} defaultValue="Alza..." />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Sender ID</label>
            <input type="text" className={styles.formInput} defaultValue="123456789" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>App ID</label>
            <input type="text" className={styles.formInput} defaultValue="com.spacejam.app" />
          </div>
          <button className={styles.testBtn}>
            {Icons.send} Send Test Message
          </button>
        </div>
      );
    }

    if (activeChannelConfig === 'sms') {
      return (
        <div className={styles.contentCardSmallPadding}>
          <div className={styles.configHeader}>
            <div className={styles.channelIcon}>{Icons.sms}</div>
            <h3 className={styles.configTitle}>SMS Configuration</h3>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Twilio Account SID</label>
            <input type="text" className={styles.formInput} defaultValue="AC..." />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Auth Token</label>
            <input type="text" className={styles.formInput} defaultValue="**********" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Phone Number</label>
            <input type="text" className={styles.formInput} defaultValue="+1234567890" />
          </div>
          <button className={styles.testBtn}>
            {Icons.send} Send Test Message
          </button>
          <p style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', marginTop: '8px' }}>
            Test sms connection before saving changes
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={styles.page}>
      
      {/* Top Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTitleWrap}>
          <h1 className={styles.headerTitle}>Notification System</h1>
          <p className={styles.headerSubtitle}>Manage communication channels, templates, and automated messaging</p>
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
        {["Channels", "Automations"].map(tab => (
          <div 
            key={tab} 
            className={`${styles.subTab} ${activeTab === tab ? styles.subTabActive : ''}`}
            onClick={() => {
              setActiveTab(tab);
              if (tab === "Channels") setActiveChannelConfig(null);
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Split Layout */}
      <div className={styles.splitLayout}>
        
        {/* LEFT COLUMN */}
        <div className={styles.leftCol}>
          
          {activeTab === "Channels" && (
            <div className={styles.contentCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Communication Channels</h2>
                <span className={styles.sectionSub}>Enable and configure your notification delivery channels</span>
              </div>

              <div className={styles.channelGrid}>
                {channels.map(channel => (
                  <div key={channel.id} className={`${styles.channelCard} ${activeChannelConfig === channel.id ? styles.channelCardActive : ''}`}>
                    <div className={styles.channelCardHeader}>
                      <div className={`${styles.channelIcon} ${!channel.active ? styles.channelIconGrey : ''}`}>
                        {channel.icon}
                      </div>
                      <div 
                        className={`${styles.toggleSwitch} ${!channel.active ? styles.toggleSwitchOff : ''}`} 
                        onClick={() => toggleChannel(channel.id)}
                      >
                        <div className={styles.toggleKnob} style={{ transform: channel.active ? 'translateX(24px)' : 'translateX(0px)' }}></div>
                      </div>
                    </div>
                    
                    <div className={styles.channelInfo}>
                      <span className={styles.channelName}>{channel.name}</span>
                      <div className={styles.channelStatusWrap}>
                        <div className={`${styles.statusDot} ${!channel.connected ? styles.statusDotGrey : ''}`}></div>
                        <span className={`${styles.statusText} ${!channel.connected ? styles.statusTextGrey : ''}`}>
                          {channel.connected ? 'Connected' : 'Not Connected'}
                        </span>
                      </div>
                    </div>

                    <button className={styles.configureBtn} onClick={() => setActiveChannelConfig(channel.id)}>
                      Configure
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Automations" && (
            <div className={styles.contentCard}>
              <div className={styles.sectionHeader} style={{ borderBottom: 'none', paddingBottom: '0' }}>
                <h2 className={styles.sectionTitle}>Request Rejection Notice</h2>
                <span className={styles.sectionSub}>On request rejected</span>
              </div>

              <div className={styles.flowStepper}>
                <div className={`${styles.stepperItem}`}>
                  <div className={`${styles.stepperDot}`}></div>
                  Trigger
                </div>
                <div className={styles.stepperLine}></div>
                <div className={`${styles.stepperItem}`}>
                  <div className={`${styles.stepperDot}`}></div>
                  Channel
                </div>
                <div className={styles.stepperLine}></div>
                <div className={`${styles.stepperItem} ${styles.stepperItemActive}`}>
                  <div className={`${styles.stepperDot} ${styles.stepperDotActive}`}></div>
                  Message
                </div>
                <div className={styles.stepperLine}></div>
                <div className={`${styles.stepperItem}`}>
                  <div className={`${styles.stepperDot}`}></div>
                  Escalation
                </div>
              </div>

              <div className={styles.autoStepCard}>
                <div className={styles.autoStepHeader}>
                  <div className={styles.autoStepInfo}>
                    <div className={styles.autoStepIcon}>{Icons.lightning}</div>
                    <div className={styles.autoStepTexts}>
                      <span className={styles.autoStepTitle}>Trigger</span>
                      <span className={styles.autoStepDesc}>Booking Created</span>
                    </div>
                  </div>
                  {Icons.chevronRight}
                </div>
              </div>

              <div className={styles.autoStepCard}>
                <div className={styles.autoStepHeader}>
                  <div className={styles.autoStepInfo}>
                    <div className={styles.autoStepIcon}>{Icons.sms}</div>
                    <div className={styles.autoStepTexts}>
                      <span className={styles.autoStepTitle}>Channel</span>
                      <span className={styles.autoStepDesc}>WhatsApp + Email</span>
                    </div>
                  </div>
                  {Icons.chevronRight}
                </div>
              </div>

              <div className={`${styles.autoStepCard} ${styles.autoStepCardActive}`}>
                <div className={styles.autoStepHeader}>
                  <div className={styles.autoStepInfo}>
                    <div className={styles.autoStepIcon}>{Icons.sms}</div>
                    <div className={styles.autoStepTexts}>
                      <span className={styles.autoStepTitle}>Message</span>
                      <span className={styles.autoStepDesc}>Hi {"{"}{"{"}name{"}"}{"}"}, your booking is confirmed...</span>
                    </div>
                  </div>
                  <div style={{ transform: 'rotate(90deg)' }}>{Icons.chevronRight}</div>
                </div>

                <div className={styles.autoStepContent}>
                  <div className={styles.formGroup} style={{ marginBottom: 0, position: 'relative' }}>
                    <label className={styles.formLabel}>Template</label>
                    <div onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                      <select className={`${styles.formInput} ${styles.selectBox}`}>
                        <option></option>
                      </select>
                    </div>
                    {isDropdownOpen && (
                      <div style={{
                        position: 'absolute', top: '70px', left: 0, right: 0, background: 'white', 
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', 
                        borderRadius: '8px', zIndex: 10, border: '1px solid #E5E7EB', padding: '8px 0'
                      }}>
                        <div style={{ padding: '8px 16px', fontSize: '14px', color: '#4B5563', cursor: 'pointer' }}>View Details</div>
                        <div style={{ padding: '8px 16px', fontSize: '14px', color: '#4B5563', cursor: 'pointer' }}>Edit</div>
                        <div style={{ padding: '8px 16px', fontSize: '14px', color: '#EF4444', cursor: 'pointer' }}>Delete</div>
                        <div style={{ height: '1px', background: '#E5E7EB', margin: '4px 0' }}></div>
                        <div style={{ padding: '8px 16px', fontSize: '14px', color: '#4B5563', cursor: 'pointer' }}>View Details</div>
                        <div style={{ padding: '8px 16px', fontSize: '14px', color: '#4B5563', cursor: 'pointer' }}>Edit</div>
                        <div style={{ padding: '8px 16px', fontSize: '14px', color: '#EF4444', cursor: 'pointer' }}>Delete</div>
                      </div>
                    )}
                  </div>

                  <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                    <textarea className={styles.textareaBox} defaultValue="" />
                  </div>

                  <div className={styles.variablesWrap}>
                    <span className={styles.variablesLabel}>Insert variables:</span>
                    <div className={styles.variablePills}>
                      <span className={styles.variablePill}>{"{"}{"{"}name{"}"}{"}"}</span>
                      <span className={styles.variablePill}>{"{"}{"{"}date{"}"}{"}"}</span>
                      <span className={styles.variablePill}>{"{"}{"{"}time{"}"}{"}"}</span>
                      <span className={styles.variablePill}>{"{"}{"{"}center_name{"}"}{"}"}</span>
                      <span className={styles.variablePill}>{"{"}{"{"}booking_id{"}"}{"}"}</span>
                      <span className={styles.variablePill}>{"{"}{"{"}amount{"}"}{"}"}</span>
                    </div>
                  </div>

                  <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                    <span className={styles.formLabel}>Attachments</span>
                    <div className={styles.uploadBox}>
                      {Icons.upload} Upload Attachment
                    </div>
                  </div>

                  <div className={styles.channelGrid} style={{ gap: '16px' }}>
                    <button className={styles.testBtn} style={{ marginTop: 0 }}>
                      {Icons.preview} Show Preview
                    </button>
                    <button className={styles.testBtn} style={{ marginTop: 0 }}>
                      {Icons.send} Send Test
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.autoStepCard}>
                <div className={styles.autoStepHeader}>
                  <div className={styles.autoStepInfo}>
                    <div className={styles.autoStepIcon}>{Icons.warningTriangle}</div>
                    <div className={styles.autoStepTexts}>
                      <span className={styles.autoStepTitle}>Escalation</span>
                      <span className={styles.autoStepDesc}>After 2 hrs &rarr; Send SMS</span>
                    </div>
                  </div>
                  {Icons.chevronRight}
                </div>
              </div>

              <div className={styles.actionRow}>
                <button className={styles.saveBtn} style={{ padding: '12px 24px' }}>Save Automation</button>
                <div className={styles.rightActions}>
                  <button className={styles.testBtn} style={{ marginTop: 0, padding: '10px 16px', background: 'transparent' }}>
                    {Icons.send} Send Test
                  </button>
                  <button className={styles.testBtn} style={{ marginTop: 0, padding: '10px 16px', background: 'transparent' }}>
                    {Icons.preview} Preview
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.rightCol}>
          {activeTab === "Channels" && renderConfigRightPanel()}

          {activeTab === "Automations" && (
            <div className={styles.contentCardSmallPadding}>
              <h3 className={styles.flowTitle}>Messaging Automation</h3>
              <p className={styles.flowSub}>Create and manage automated workflows</p>
              
              <button className={styles.addAutoBtn}>
                {Icons.plus} Add Automation
              </button>

              <div className={styles.searchBox}>
                <div className={styles.searchIcon}>{Icons.search}</div>
                <input type="text" className={styles.searchInput} placeholder="Search automations..." />
              </div>

              <div className={styles.autoList}>
                <div className={styles.autoItem}>
                  <div className={styles.autoItemIcon}>{Icons.lightning}</div>
                  <div className={styles.autoItemInfo}>
                    <span className={styles.autoItemTitle}>Booking Confirmation Flow</span>
                    <span className={styles.autoItemSub}>On booking created</span>
                    <span className={styles.badgeActive}>Active</span>
                  </div>
                </div>

                <div className={styles.autoItem}>
                  <div className={styles.autoItemIcon}>{Icons.lightning}</div>
                  <div className={styles.autoItemInfo}>
                    <span className={styles.autoItemTitle}>Payment Reminder</span>
                    <span className={styles.autoItemSub}>On payment pending</span>
                    <span className={styles.badgeActive}>Active</span>
                  </div>
                </div>

                <div className={`${styles.autoItem} ${styles.autoItemActive}`}>
                  <div className={styles.autoItemIcon}>{Icons.lightning}</div>
                  <div className={styles.autoItemInfo}>
                    <span className={styles.autoItemTitle}>Request Rejection Notice</span>
                    <span className={styles.autoItemSub}>On request rejected</span>
                    <span className={styles.badgeDraft}>Draft</span>
                  </div>
                </div>

                <div className={styles.autoItem}>
                  <div className={styles.autoItemIcon}>{Icons.lightning}</div>
                  <div className={styles.autoItemInfo}>
                    <span className={styles.autoItemTitle}>Membership Expiry Alert</span>
                    <span className={styles.autoItemSub}>7 days before expiry</span>
                    <span className={styles.badgeActive}>Active</span>
                  </div>
                </div>

                <div className={styles.autoItem}>
                  <div className={styles.autoItemIcon}>{Icons.lightning}</div>
                  <div className={styles.autoItemInfo}>
                    <span className={styles.autoItemTitle}>Welcome Message</span>
                    <span className={styles.autoItemSub}>On member signup</span>
                    <span className={styles.badgeDraft}>Draft</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
