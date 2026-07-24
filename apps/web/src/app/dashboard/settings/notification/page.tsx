"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { useAuth } from "@/contexts/auth-context";
import { useSettingsGroup } from "@/hooks/use-settings";
import { SEND_NOTIFICATION } from "@/lib/apollo/operations";
import {
  useAutomations,
  useCreateAutomation,
  useDeleteAutomation,
  useUpdateAutomation,
} from "@/hooks/use-operations";
import { toast } from "sonner";
import styles from "./notification.module.css";

// Trigger/channel options must match the backend AutomationTrigger and
// AutomationChannel enums (notification-automation.entity.ts).
const TRIGGER_OPTIONS = [
  { value: "BOOKING_CREATED", label: "Booking Created" },
  { value: "BOOKING_CANCELLED", label: "Booking Cancelled" },
  { value: "PAYMENT_RECEIVED", label: "Payment Received" },
  { value: "PAYMENT_OVERDUE", label: "Payment Overdue" },
  { value: "LEAD_CREATED", label: "Lead Created" },
  { value: "INVOICE_GENERATED", label: "Invoice Generated" },
  { value: "DEPOSIT_RECEIVED", label: "Deposit Received" },
  { value: "REQUEST_CREATED", label: "Request Created" },
  { value: "EVENT_CREATED", label: "Event Created" },
];

const CHANNEL_OPTIONS = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "Email" },
  { value: "PUSH", label: "Push" },
  { value: "SMS", label: "SMS" },
];

const labelForTrigger = (t: string) =>
  TRIGGER_OPTIONS.find((o) => o.value === t)?.label ?? t;
const labelForChannel = (c: string) =>
  CHANNEL_OPTIONS.find((o) => o.value === c)?.label ?? c;

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

  // Persisted via Center.settings.notifications (deep-merged on save).
  const { draft, set, save, reset, saving, centerId } = useSettingsGroup("notifications", {
    whatsappEnabled: true,
    emailEnabled: true,
    pushEnabled: false,
    smsEnabled: true,
    whatsappApiKey: "sk_live_...",
    whatsappSenderId: "+1234567890",
    whatsappBusinessAccountId: "BA_12345",
    pushFirebaseServerKey: "Alza...",
    pushSenderId: "123456789",
    pushAppId: "com.spacejam.app",
    smsTwilioAccountSid: "AC...",
    smsAuthToken: "**********",
    smsPhoneNumber: "+1234567890",
  });

  const [sendTestNotification] = useMutation(SEND_NOTIFICATION);

  const handleSendTest = async (channel: string) => {
    if (!centerId) {
      toast.error("No active center found");
      return;
    }
    const messages: Record<string, string> = {
      whatsapp: "Test WhatsApp notification — external gateway not configured",
      email: "Test Email notification — external gateway not configured",
      push: "Test Push notification — external gateway not configured",
      sms: "Test SMS notification — external gateway not configured",
    };
    try {
      await sendTestNotification({
        variables: {
          input: {
            title: `Test ${channel} notification`,
            message: messages[channel] || "Test notification",
            centerId,
            type: "SYSTEM",
          },
        },
      });
      toast.success(`${channel.charAt(0).toUpperCase() + channel.slice(1)} test notification sent`);
    } catch {
      toast.error(`Failed to send ${channel} test notification`);
    }
  };

  // ─── Automations (real backend) ────────────────────────────────────────
  const { automations } = useAutomations(centerId ?? undefined);
  const { create: createAutomation, loading: creatingAutomation } = useCreateAutomation();
  const { update: updateAutomation, loading: updatingAutomation } = useUpdateAutomation();
  const { remove: deleteAutomation } = useDeleteAutomation();

  // Automation form state (the left-column builder). Bound to create/update.
  const [autoForm, setAutoForm] = useState({
    name: "",
    triggerEvent: "BOOKING_CREATED",
    channel: "WHATSAPP",
    template: "",
    delayMinutes: "0",
  });
  const [editingAutomationId, setEditingAutomationId] = useState<string | null>(null);

  const resetAutoForm = () => {
    setAutoForm({
      name: "",
      triggerEvent: "BOOKING_CREATED",
      channel: "WHATSAPP",
      template: "",
      delayMinutes: "0",
    });
    setEditingAutomationId(null);
  };

  const loadAutomationIntoForm = (a: any) => {
    setAutoForm({
      name: a.name ?? "",
      triggerEvent: a.triggerEvent ?? "BOOKING_CREATED",
      channel: a.channel ?? "WHATSAPP",
      template: a.template ?? "",
      delayMinutes: String(a.delayMinutes ?? 0),
    });
    setEditingAutomationId(a.id);
  };

  const handleSaveAutomation = async () => {
    if (!centerId) {
      toast.error("No active center found");
      return;
    }
    if (!autoForm.name.trim() || !autoForm.template.trim()) {
      toast.error("Automation name and template are required");
      return;
    }
    const payload = {
      centerId,
      name: autoForm.name.trim(),
      triggerEvent: autoForm.triggerEvent,
      channel: autoForm.channel,
      template: autoForm.template.trim(),
      delayMinutes: Number(autoForm.delayMinutes) || 0,
      enabled: true,
    };
    try {
      if (editingAutomationId) {
        await updateAutomation(editingAutomationId, payload);
      } else {
        await createAutomation(payload);
      }
      resetAutoForm();
    } catch {
      /* hook already toasted */
    }
  };

  const handleDeleteAutomation = async (id: string) => {
    try {
      await deleteAutomation(id);
      if (editingAutomationId === id) resetAutoForm();
    } catch {
      /* hook already toasted */
    }
  };

  const handleToggleAutomation = async (a: any) => {
    try {
      await updateAutomation(a.id, { enabled: !a.enabled });
    } catch {
      /* hook already toasted */
    }
  };

  const automationToken = useMemo(
    () => JSON.stringify(automations),
    [automations],
  );

  // Static channel metadata (icons/labels) — persisted enable flags live in draft.
  const channels = [
    { id: 'whatsapp', name: 'WhatsApp', icon: Icons.whatsapp, connected: draft.whatsappEnabled },
    { id: 'email', name: 'Email', icon: Icons.email, connected: draft.emailEnabled },
    { id: 'push', name: 'Push Notifications', icon: Icons.push, connected: draft.pushEnabled },
    { id: 'sms', name: 'SMS', icon: Icons.sms, connected: draft.smsEnabled },
  ];

  const channelKeyMap: Record<string, string> = {
    whatsapp: 'whatsappEnabled',
    email: 'emailEnabled',
    push: 'pushEnabled',
    sms: 'smsEnabled',
  };

  const toggleChannel = (id: string) => {
    const key = channelKeyMap[id] as keyof typeof draft;
    if (key) set(key, !draft[key]);
  };

  const [activeChannelConfig, setActiveChannelConfig] = useState<string | null>(null);

  // (Automations state lives with the automations hooks above.)

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
            <input type="text" className={styles.formInput} value={draft.whatsappApiKey} onChange={(e) => set('whatsappApiKey', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Sender ID</label>
            <input type="text" className={styles.formInput} value={draft.whatsappSenderId} onChange={(e) => set('whatsappSenderId', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Business Account ID</label>
            <input type="text" className={styles.formInput} value={draft.whatsappBusinessAccountId} onChange={(e) => set('whatsappBusinessAccountId', e.target.value)} />
          </div>
          <button className={styles.testBtn} onClick={() => handleSendTest('whatsapp')}>
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
            <input type="text" className={styles.formInput} value={draft.pushFirebaseServerKey} onChange={(e) => set('pushFirebaseServerKey', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Sender ID</label>
            <input type="text" className={styles.formInput} value={draft.pushSenderId} onChange={(e) => set('pushSenderId', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>App ID</label>
            <input type="text" className={styles.formInput} value={draft.pushAppId} onChange={(e) => set('pushAppId', e.target.value)} />
          </div>
          <button className={styles.testBtn} onClick={() => handleSendTest('push')}>
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
            <input type="text" className={styles.formInput} value={draft.smsTwilioAccountSid} onChange={(e) => set('smsTwilioAccountSid', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Auth Token</label>
            <input type="text" className={styles.formInput} value={draft.smsAuthToken} onChange={(e) => set('smsAuthToken', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Phone Number</label>
            <input type="text" className={styles.formInput} value={draft.smsPhoneNumber} onChange={(e) => set('smsPhoneNumber', e.target.value)} />
          </div>
          <button className={styles.testBtn} onClick={() => handleSendTest('sms')}>
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
                      <div className={`${styles.channelIcon} ${!channel.connected ? styles.channelIconGrey : ''}`}>
                        {channel.icon}
                      </div>
                      <div
                        className={`${styles.toggleSwitch} ${!channel.connected ? styles.toggleSwitchOff : ''}`}
                        onClick={() => toggleChannel(channel.id)}
                      >
                        <div className={styles.toggleKnob} style={{ transform: channel.connected ? 'translateX(24px)' : 'translateX(0px)' }}></div>
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
                      <span className={styles.autoStepDesc}>{labelForTrigger(autoForm.triggerEvent)}</span>
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
                      <span className={styles.autoStepDesc}>{labelForChannel(autoForm.channel)}</span>
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
                      <span className={styles.autoStepDesc}>
                        {autoForm.template
                          ? autoForm.template.slice(0, 48) + (autoForm.template.length > 48 ? "…" : "")
                          : "Write your message template…"}
                      </span>
                    </div>
                  </div>
                  <div style={{ transform: 'rotate(90deg)' }}>{Icons.chevronRight}</div>
                </div>

                <div className={styles.autoStepContent}>
                  <div className={styles.formGroup} style={{ marginBottom: "12px" }}>
                    <label className={styles.formLabel}>Automation Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. Booking Confirmation Flow"
                      value={autoForm.name}
                      onChange={(e) => setAutoForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>

                  <div className={styles.formGroup} style={{ marginBottom: "12px" }}>
                    <label className={styles.formLabel}>Trigger Event</label>
                    <select
                      className={`${styles.formInput} ${styles.selectBox}`}
                      value={autoForm.triggerEvent}
                      onChange={(e) => setAutoForm((p) => ({ ...p, triggerEvent: e.target.value }))}
                    >
                      {TRIGGER_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup} style={{ marginBottom: "12px" }}>
                    <label className={styles.formLabel}>Channel</label>
                    <select
                      className={`${styles.formInput} ${styles.selectBox}`}
                      value={autoForm.channel}
                      onChange={(e) => setAutoForm((p) => ({ ...p, channel: e.target.value }))}
                    >
                      {CHANNEL_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup} style={{ marginBottom: "12px" }}>
                    <label className={styles.formLabel}>Delay (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      className={styles.formInput}
                      value={autoForm.delayMinutes}
                      onChange={(e) => setAutoForm((p) => ({ ...p, delayMinutes: e.target.value }))}
                    />
                  </div>

                  <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                    <label className={styles.formLabel}>Message Template</label>
                    <textarea
                      className={styles.textareaBox}
                      placeholder="Hi {{name}}, your booking is confirmed for {{date}} at {{time}}."
                      rows={4}
                      value={autoForm.template}
                      onChange={(e) => setAutoForm((p) => ({ ...p, template: e.target.value }))}
                    />
                  </div>

                  <div className={styles.variablesWrap}>
                    <span className={styles.variablesLabel}>Insert variables:</span>
                    <div className={styles.variablePills}>
                      {["name", "date", "time", "center_name", "booking_id", "amount"].map((v) => (
                        <span
                          key={v}
                          className={styles.variablePill}
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            setAutoForm((p) => ({ ...p, template: `${p.template}{{${v}}}` }))
                          }
                        >
                          {"{{" + v + "}}"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.actionRow}>
                <button
                  className={styles.saveBtn}
                  style={{ padding: '12px 24px' }}
                  onClick={handleSaveAutomation}
                  disabled={creatingAutomation || updatingAutomation}
                >
                  {(creatingAutomation || updatingAutomation)
                    ? "Saving…"
                    : editingAutomationId
                      ? "Update Automation"
                      : "Save Automation"}
                </button>
                <div className={styles.rightActions}>
                  {editingAutomationId && (
                    <button
                      type="button"
                      className={styles.testBtn}
                      style={{ marginTop: 0, padding: '10px 16px', background: 'transparent' }}
                      onClick={resetAutoForm}
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button className={styles.testBtn} style={{ marginTop: 0, padding: '10px 16px', background: 'transparent' }} onClick={() => handleSendTest('email')}>
                    {Icons.send} Send Test
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

              <button
                className={styles.addAutoBtn}
                onClick={resetAutoForm}
                type="button"
              >
                {Icons.plus} {editingAutomationId ? "New Automation" : "Add Automation"}
              </button>

              <div className={styles.autoList} data-automations={automationToken}>
                {automations.length === 0 && (
                  <p style={{ fontSize: "14px", color: "#6B7280", padding: "16px 0" }}>
                    No automations yet. Use the builder on the left to create one.
                  </p>
                )}
                {automations.map((a: any) => (
                  <div
                    key={a.id}
                    className={`${styles.autoItem} ${editingAutomationId === a.id ? styles.autoItemActive : ""}`}
                    style={{ cursor: "pointer", flexWrap: "wrap" }}
                    onClick={() => loadAutomationIntoForm(a)}
                  >
                    <div className={styles.autoItemIcon}>{Icons.lightning}</div>
                    <div className={styles.autoItemInfo}>
                      <span className={styles.autoItemTitle}>{a.name}</span>
                      <span className={styles.autoItemSub}>
                        On {labelForTrigger(a.triggerEvent)} · {labelForChannel(a.channel)}
                      </span>
                      {a.enabled ? (
                        <span className={styles.badgeActive}>Active</span>
                      ) : (
                        <span className={styles.badgeDraft}>Disabled</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleToggleAutomation(a)}
                        style={{ background: "transparent", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", color: "#4B5563", cursor: "pointer" }}
                      >
                        {a.enabled ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAutomation(a.id)}
                        style={{ background: "transparent", border: "1px solid #FECACA", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", color: "#EF4444", cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
