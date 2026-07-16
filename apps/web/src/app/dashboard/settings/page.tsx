"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { GET_USERS, DELETE_USER, SET_USER_ACTIVE } from "@/lib/apollo/operations";
import { useSettingsGroup } from "@/hooks/use-settings";
import styles from "./settings.module.css";

const Icons = {
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  camera: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  ),
  editPencil: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  chevronDown: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  ),
  phone: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
      <line x1="12" y1="18" x2="12.01" y2="18"></line>
    </svg>
  ),
  laptop: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="2" y1="20" x2="22" y2="20"></line>
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  )
};

interface User {
  id: string;
  name: string;
  email?: string;
  role: string;
  phone?: string;
  center?: { id: string; name: string } | null;
  centerId?: string | null;
  active: boolean;
}

const ROLE_GROUP_MAP: Record<string, string> = {
  ADMIN: "FRANCHISE OWNERS",
  CENTER_MANAGER: "CENTER MANAGERS",
  MEMBER: "MEMBERS",
  SUPPORT_STAFF: "SUPPORT STAFF",
};

const GRAPHQL_ROLE_TO_DISPLAY: Record<string, string> = {
  ADMIN: "Franchise Owner",
  CENTER_MANAGER: "Center Manager",
  MEMBER: "Member",
  SUPPORT_STAFF: "Support Staff",
};

/** A permissions group card with Enable-All + per-row toggles bound to the persisted draft. */
function PermGroup({
  title,
  items,
  perms,
  set,
}: {
  title: string;
  items: [string, string][];
  perms: Record<string, boolean>;
  set: (key: string, value: boolean) => void;
}) {
  const allEnabled = items.every(([k]) => perms[k]);
  return (
    <div className={styles.permGroup}>
      <div className={styles.permGroupHeader}>
        <span className={styles.permGroupTitle}>{title}</span>
        <span
          className={styles.permEnableAll}
          style={{ cursor: 'pointer' }}
          onClick={() => items.forEach(([k]) => set(k, !allEnabled))}
        >
          {allEnabled ? "Disable All" : "Enable All"}
        </span>
      </div>
      {items.map(([key, label]) => {
        const on = !!perms[key];
        return (
          <div className={styles.permRow} key={key}>
            <span className={styles.permLabel}>{label}</span>
            <div
              className={`${styles.toggleSwitch} ${!on ? styles.toggleSwitchOff : ''}`}
              onClick={() => set(key, !on)}
            >
              <div className={styles.toggleKnob} style={{ transform: on ? 'translateX(24px)' : 'translateX(0px)' }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SettingsAccessPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Profile");
  const [accountEnabled, setAccountEnabled] = useState(true);

  const { data: usersData, loading: usersLoading } = useQuery<{ users: User[] }>(GET_USERS, {
    variables: { limit: 50, offset: 0 },
    fetchPolicy: 'cache-and-network',
  });

  const [deleteUserMut] = useMutation(DELETE_USER, {
    refetchQueries: [{ query: GET_USERS, variables: { limit: 50, offset: 0 } }],
  });
  const [setUserActiveMut] = useMutation(SET_USER_ACTIVE, {
    refetchQueries: [{ query: GET_USERS, variables: { limit: 50, offset: 0 } }],
  });

  // Permissions persist under Center.settings.permissions (per-center matrix).
  const { draft: perms, set: setPerm, save: savePerms } = useSettingsGroup("permissions", {
    editBookings: true,
    cancelBookings: true,
    overrideRoomLimits: false,
    issueRefunds: true,
    freezeDeposits: false,
    accessInvoices: true,
    sendCampaigns: false,
    viewAnalytics: true,
    manageOffers: false,
    createUsers: true,
    editPermissions: true,
    deleteUsers: false,
  });

  const users = usersData?.users ?? [];
  const defaultUser = users.length > 0 ? users.find((u) => u.role === "CENTER_MANAGER") ?? users[0] : null;
  const [activeUser, setActiveUser] = useState<User | null>(defaultUser);

  // Profile tab: editable name draft synced when user changes
  const [editingName, setEditingName] = useState(defaultUser?.name ?? "");
  useEffect(() => {
    if (activeUser) setEditingName(activeUser.name);
  }, [activeUser?.id]);

  // Settings groups: persisted via Center.settings JSONB
  const { draft: secDraft, set: setSec, save: saveSec } = useSettingsGroup("security", { otpRequired: true, biometricLogin: false, sessionTimeout: 30 });
  const { draft: notifDraft, set: setNotif, save: saveNotif } = useSettingsGroup("notifications", { whatsapp: true, email: true, push: false, emailDigest: "none", sms: true });

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("");
  };

  async function handleSaveChanges() {
    if (!activeUser) return;
    if (activeTab === "Permissions") {
      await savePerms();
      return;
    }
    toast.success("Profile changes saved");
  }

  async function handleSuspend() {
    if (!activeUser) return;
    const next = !accountEnabled;
    try {
      await setUserActiveMut({ variables: { id: activeUser.id, active: next } });
      setAccountEnabled(next);
      toast.success(next ? "Access reinstated" : "Access suspended");
    } catch {
      toast.error("Could not update access");
    }
  }

  async function handleDelete() {
    if (!activeUser) return;
    if (!window.confirm(`Delete user "${activeUser.name}"? This cannot be undone.`)) return;
    try {
      await deleteUserMut({ variables: { id: activeUser.id } });
      toast.success("User deleted");
      setActiveUser(null);
    } catch {
      toast.error("Could not delete user");
    }
  }

  const renderUserGroup = (groupName: string) => {
    if (usersLoading) {
      return <div className={styles.loadingState}>Loading users...</div>;
    }

    const usersInGroup = users.filter(u => ROLE_GROUP_MAP[u.role] === groupName);
    if (usersInGroup.length === 0) return null;

    return (
      <div className={styles.directoryGroup} key={groupName}>
        <div className={styles.groupLabel}>{groupName}</div>
        {usersInGroup.map(user => {
          const isActive = activeUser?.id === user.id;
          const centerName = user.center?.name || "No center assigned";
          const subText = `${user.email || "No email"}\n${centerName}`;

          return (
            <div
              key={user.id}
              className={`${styles.userItem} ${isActive ? styles.userItemActive : ''}`}
              onClick={() => { setActiveUser(user); setAccountEnabled(user.active); }}
            >
              <div className={styles.listAvatar}>{getInitials(user.name)}</div>
              <div className={styles.listUserInfo}>
                <span className={styles.listUserName}>{user.name}</span>
                <span className={styles.listUserSub}>{subText}</span>
              </div>
              <span className={`${styles.listUserStatus} ${user.active ? styles.statusTxtActive : styles.statusTxtSuspended}`}>
                {user.active ? "Active" : "Suspended"}
              </span>
              <span className={styles.editIcon}>{Icons.editPencil}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      
      {/* Top Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTitleWrap}>
          <h1 className={styles.headerTitle}>Access & Permissions</h1>
          <p className={styles.headerSubtitle}>Manage users, roles, and system access</p>
        </div>
        <button className={styles.addUserBtn} onClick={() => router.push("/signup")}>
          {Icons.plus} Add User
        </button>
      </div>

      {/* Sub Tabs */}
      <div className={styles.subTabs}>
        {["Profile", "Permissions", "Centers", "Security", "Notifications"].map(tab => (
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
        
        {/* LEFT COLUMN: FORM / PERMISSIONS */}
        <div className={styles.leftCol}>
          
          {activeTab === "Profile" && !activeUser ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#6B7280' }}>
              {usersLoading ? 'Loading users...' : 'No user selected.'}
            </div>
          ) : activeTab === "Profile" ? (
            <>
              <div className={styles.formHeader}>
                <div className={styles.avatarWrap}>
                  {getInitials(activeUser!.name)}
                  <div className={styles.cameraIcon}>{Icons.camera}</div>
                </div>
                <div className={styles.formUserInfo}>
                  <h2 className={styles.formUserName}>{activeUser!.name}</h2>
                  <p className={styles.formUserRole}>{activeUser!.role}</p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroupFull}>
                  <label className={styles.formLabel}>Full Name</label>
                  <input type="text" className={styles.formInput} value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email</label>
                  <input type="email" className={styles.formInput} value={activeUser!.email || ""} placeholder="No email provided" readOnly />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone</label>
                  <input type="text" className={styles.formInput} value={activeUser!.phone || ""} placeholder="No phone provided" readOnly />
                </div>
                <div className={styles.formGroupFull}>
                  <label className={styles.formLabel}>Role</label>
                  <input type="text" className={styles.formInput} value={activeUser!.role} disabled />
                </div>
                <div className={styles.formGroupFull}>
                  <label className={styles.formLabel}>Assigned Centers</label>
                  <input type="text" className={styles.formInput} value={activeUser!.center?.name || "No center assigned"} disabled />
                </div>
              </div>

              <div>
                <div className={styles.statusRow}>
                  <div className={styles.statusInfo}>
                    <span className={styles.statusLabel}>Account Status</span>
                    <span className={styles.statusDesc}>User can access the system</span>
                  </div>
                  <div className={`${styles.toggleSwitch} ${!accountEnabled ? styles.toggleSwitchOff : ''}`} onClick={() => setAccountEnabled(!accountEnabled)}>
                    <div className={styles.toggleKnob} style={{ transform: accountEnabled ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.2s' }}></div>
                  </div>
                </div>
              </div>

              <div className={styles.formActions}>
                <button className={styles.saveBtn} onClick={handleSaveChanges}>Save Changes</button>
                <div className={styles.dangerActions}>
                  <button className={styles.suspendBtn} onClick={handleSuspend}>
                    {accountEnabled ? "Suspend Access" : "Reinstate Access"}
                  </button>
                  <button className={styles.deleteBtn} onClick={handleDelete}>Delete User</button>
                </div>
              </div>
            </>
          ) : activeTab === "Permissions" ? (
            <>
              <input type="text" className={styles.permSearchBox} placeholder="Search permissions" />

              <PermGroup
                title="Booking Permissions"
                perms={perms}
                set={(k, v) => setPerm(k as any, v)}
                items={[["editBookings","Edit bookings"],["cancelBookings","Cancel bookings"],["overrideRoomLimits","Override room limits"]]}
              />
              <PermGroup
                title="Financial Permissions"
                perms={perms}
                set={(k, v) => setPerm(k as any, v)}
                items={[["issueRefunds","Issue refunds"],["freezeDeposits","Freeze deposits"],["accessInvoices","Access invoices"]]}
              />
              <PermGroup
                title="Marketing Permissions"
                perms={perms}
                set={(k, v) => setPerm(k as any, v)}
                items={[["sendCampaigns","Send campaigns"],["viewAnalytics","View analytics"],["manageOffers","Manage offers"]]}
              />
              <PermGroup
                title="User Permissions"
                perms={perms}
                set={(k, v) => setPerm(k as any, v)}
                items={[["createUsers","Create users"],["editPermissions","Edit permissions"],["deleteUsers","Delete users"]]}
              />

              <div className={styles.formActions} style={{ marginTop: '16px' }}>
                <button className={styles.saveBtn} onClick={handleSaveChanges}>Save Permissions</button>
              </div>
            </>
          ) : activeTab === "Centers" ? (
            <>
              <p className={styles.centersSubtitle}>Centers assigned to this user</p>

              <div className={styles.radioList}>
                {activeUser?.center ? (
                  <div className={styles.radioGroup}>
                    <div className={styles.radioItem}>
                      <div className={`${styles.radioIcon} ${styles.radioIconActive}`}>
                        <div className={styles.radioDot}></div>
                      </div>
                      <span className={styles.radioLabel}>{activeUser.center.name}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>
                    No center assigned to this user.
                  </div>
                )}
              </div>
            </>
          ) : activeTab === "Security" ? (
            <>
              <div className={styles.secGroup}>
                <h3 className={styles.secGroupTitle}>Authentication</h3>

                <div className={styles.secRow}>
                  <div className={styles.secRowInfo}>
                    <span className={styles.secRowTitle}>OTP Required</span>
                    <span className={styles.secRowSub}>Require OTP for login</span>
                  </div>
                  <div
                    className={`${styles.toggleSwitch} ${!secDraft.otpRequired ? styles.toggleSwitchOff : ''}`}
                    onClick={() => setSec("otpRequired", !secDraft.otpRequired)}
                  >
                    <div className={styles.toggleKnob} style={{ transform: secDraft.otpRequired ? 'translateX(24px)' : 'translateX(0px)' }}></div>
                  </div>
                </div>

                <div className={styles.secRow}>
                  <div className={styles.secRowInfo}>
                    <span className={styles.secRowTitle}>Biometric Login</span>
                    <span className={styles.secRowSub}>Allow fingerprint/face ID</span>
                  </div>
                  <div
                    className={`${styles.toggleSwitch} ${!secDraft.biometricLogin ? styles.toggleSwitchOff : ''}`}
                    onClick={() => setSec("biometricLogin", !secDraft.biometricLogin)}
                  >
                    <div className={styles.toggleKnob} style={{ transform: secDraft.biometricLogin ? 'translateX(24px)' : 'translateX(0px)' }}></div>
                  </div>
                </div>

                <div className={styles.secInputGroup}>
                  <span className={styles.secRowTitle}>Session Timeout (minutes)</span>
                  <input
                    type="number"
                    className={styles.secInput}
                    value={secDraft.sessionTimeout ?? 30}
                    onChange={(e) => setSec("sessionTimeout", Number(e.target.value))}
                    min={5}
                    max={480}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button className={styles.saveBtn} onClick={async () => { await saveSec(); }}>Save Security Settings</button>
              </div>
            </>
          ) : activeTab === "Notifications" ? (
            <>
              <div className={styles.secGroup}>
                <h3 className={styles.secGroupTitle}>Notification Channels</h3>

                <div className={styles.secRow}>
                  <div className={styles.secRowInfo}>
                    <span className={styles.secRowTitle}>WhatsApp</span>
                    <span className={styles.secRowSub}>{activeUser?.phone || "Not configured"}</span>
                  </div>
                  <div
                    className={`${styles.toggleSwitch} ${!notifDraft.whatsapp ? styles.toggleSwitchOff : ''}`}
                    onClick={() => setNotif("whatsapp", !notifDraft.whatsapp)}
                  >
                    <div className={styles.toggleKnob} style={{ transform: notifDraft.whatsapp ? 'translateX(24px)' : 'translateX(0px)' }}></div>
                  </div>
                </div>

                <div className={styles.secRow}>
                  <div className={styles.secRowInfo}>
                    <span className={styles.secRowTitle}>Email</span>
                    <span className={styles.secRowSub}>{activeUser?.email || "Not configured"}</span>
                  </div>
                  <div
                    className={`${styles.toggleSwitch} ${!notifDraft.email ? styles.toggleSwitchOff : ''}`}
                    onClick={() => setNotif("email", !notifDraft.email)}
                  >
                    <div className={styles.toggleKnob} style={{ transform: notifDraft.email ? 'translateX(24px)' : 'translateX(0px)' }}></div>
                  </div>
                </div>

                <div className={styles.secRow}>
                  <div className={styles.secRowInfo}>
                    <span className={styles.secRowTitle}>Push Notifications</span>
                    <span className={styles.secRowSub}>In-app and browser push</span>
                  </div>
                  <div
                    className={`${styles.toggleSwitch} ${!notifDraft.push ? styles.toggleSwitchOff : ''}`}
                    onClick={() => setNotif("push", !notifDraft.push)}
                  >
                    <div className={styles.toggleKnob} style={{ transform: notifDraft.push ? 'translateX(24px)' : 'translateX(0px)' }}></div>
                  </div>
                </div>

                <div className={styles.secRow}>
                  <div className={styles.secRowInfo}>
                    <span className={styles.secRowTitle}>SMS</span>
                    <span className={styles.secRowSub}>Text message alerts</span>
                  </div>
                  <div
                    className={`${styles.toggleSwitch} ${!notifDraft.sms ? styles.toggleSwitchOff : ''}`}
                    onClick={() => setNotif("sms", !notifDraft.sms)}
                  >
                    <div className={styles.toggleKnob} style={{ transform: notifDraft.sms ? 'translateX(24px)' : 'translateX(0px)' }}></div>
                  </div>
                </div>

                <div className={styles.secInputGroup}>
                  <span className={styles.secRowTitle}>Email Digest Frequency</span>
                  <select
                    className={styles.secInput}
                    value={notifDraft.emailDigest ?? "none"}
                    onChange={(e) => setNotif("emailDigest", e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className={styles.formActions}>
                <button className={styles.saveBtn} onClick={async () => { await saveNotif(); }}>Save Notification Settings</button>
              </div>
            </>
          ) : (
            <div style={{ padding: '64px', textAlign: 'center', color: '#6B7280' }}>
              Select a tab to manage {activeTab.toLowerCase()}.
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: DIRECTORY */}
        <div className={styles.rightCol}>
          
          <div className={styles.listSearch}>
            <span className="text-gray-400">{Icons.search}</span>
            <input type="text" placeholder="Search users by name, email" />
          </div>
          
          <div className={styles.listFilters}>
            <div className={styles.listFilterBtn}>Role {Icons.chevronDown}</div>
            <div className={styles.listFilterBtn}>Center {Icons.chevronDown}</div>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '600px', paddingRight: '4px' }}>
            {renderUserGroup("FRANCHISE OWNERS")}
            {renderUserGroup("CENTER MANAGERS")}
            {renderUserGroup("SUPPORT STAFF")}
          </div>

        </div>

      </div>

    </div>
  );
}