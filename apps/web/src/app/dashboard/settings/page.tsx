"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_USERS } from "@/lib/apollo/operations";
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
  isActive: boolean;
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

export default function SettingsAccessPage() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [accountEnabled, setAccountEnabled] = useState(true);

  const { data: usersData, loading: usersLoading } = useQuery<{ users: User[] }>(GET_USERS, {
    variables: { limit: 50, offset: 0 },
  });

  const users = usersData?.users ?? [];
  const defaultUser = users.length > 0 ? users.find((u) => u.role === "CENTER_MANAGER") ?? users[0] : null;
  const [activeUser, setActiveUser] = useState<User | null>(defaultUser);

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("");
  };

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
              onClick={() => { setActiveUser(user); setAccountEnabled(user.isActive); }}
            >
              <div className={styles.listAvatar}>{getInitials(user.name)}</div>
              <div className={styles.listUserInfo}>
                <span className={styles.listUserName}>{user.name}</span>
                <span className={styles.listUserSub}>{subText}</span>
              </div>
              <span className={`${styles.listUserStatus} ${user.isActive ? styles.statusTxtActive : styles.statusTxtSuspended}`}>
                {user.isActive ? "Active" : "Suspended"}
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
        <button className={styles.addUserBtn}>
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
                  <input type="text" className={styles.formInput} value={activeUser!.name} readOnly />
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
                <div className={styles.formGroupFull}>
                  <label className={styles.formLabel}>Reporting Manager</label>
                  <input type="text" className={styles.formInput} value={"Reporting Manager"} disabled />
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
                <button className={styles.saveBtn}>Save Changes</button>
                <div className={styles.dangerActions}>
                  <button className={styles.suspendBtn}>Suspend Access</button>
                  <button className={styles.deleteBtn}>Delete User</button>
                </div>
              </div>
            </>
          ) : activeTab === "Permissions" ? (
            <>
              <input type="text" className={styles.permSearchBox} placeholder="Search permissions" />
              
              <div className={styles.permGroup}>
                <div className={styles.permGroupHeader}>
                  <span className={styles.permGroupTitle}>Booking Permissions</span>
                  <span className={styles.permEnableAll}>Enable All</span>
                </div>
                <div className={styles.permRow}>
                  <span className={styles.permLabel}>Edit bookings</span>
                  <div className={styles.toggleSwitch}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(24px)' }}></div>
                  </div>
                </div>
                <div className={styles.permRow}>
                  <span className={styles.permLabel}>Cancel bookings</span>
                  <div className={styles.toggleSwitch}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(24px)' }}></div>
                  </div>
                </div>
                <div className={styles.permRow}>
                  <span className={styles.permLabel}>Override room limits</span>
                  <div className={`${styles.toggleSwitch} ${styles.toggleSwitchOff}`}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(0px)' }}></div>
                  </div>
                </div>
              </div>

              <div className={styles.permGroup}>
                <div className={styles.permGroupHeader}>
                  <span className={styles.permGroupTitle}>Financial Permissions</span>
                  <span className={styles.permEnableAll}>Enable All</span>
                </div>
                <div className={styles.permRow}>
                  <span className={styles.permLabel}>Issue refunds</span>
                  <div className={styles.toggleSwitch}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(24px)' }}></div>
                  </div>
                </div>
                <div className={styles.permRow}>
                  <span className={styles.permLabel}>Freeze deposits</span>
                  <div className={`${styles.toggleSwitch} ${styles.toggleSwitchOff}`}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(0px)' }}></div>
                  </div>
                </div>
                <div className={styles.permRow}>
                  <span className={styles.permLabel}>Access invoices</span>
                  <div className={styles.toggleSwitch}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(24px)' }}></div>
                  </div>
                </div>
              </div>

              <div className={styles.permGroup}>
                <div className={styles.permGroupHeader}>
                  <span className={styles.permGroupTitle}>Marketing Permissions</span>
                  <span className={styles.permEnableAll}>Enable All</span>
                </div>
                <div className={styles.permRow}>
                  <span className={styles.permLabel}>Send campaigns</span>
                  <div className={`${styles.toggleSwitch} ${styles.toggleSwitchOff}`}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(0px)' }}></div>
                  </div>
                </div>
                <div className={styles.permRow}>
                  <span className={styles.permLabel}>View analytics</span>
                  <div className={styles.toggleSwitch}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(24px)' }}></div>
                  </div>
                </div>
                <div className={styles.permRow}>
                  <span className={styles.permLabel}>Manage offers</span>
                  <div className={`${styles.toggleSwitch} ${styles.toggleSwitchOff}`}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(0px)' }}></div>
                  </div>
                </div>
              </div>

              <div className={styles.permGroup}>
                <div className={styles.permGroupHeader}>
                  <span className={styles.permGroupTitle}>User Permissions</span>
                  <span className={styles.permEnableAll}>Enable All</span>
                </div>
                <div className={styles.permRow}>
                  <span className={styles.permLabel}>Create users</span>
                  <div className={styles.toggleSwitch}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(24px)' }}></div>
                  </div>
                </div>
                <div className={styles.permRow}>
                  <span className={styles.permLabel}>Edit permissions</span>
                  <div className={styles.toggleSwitch}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(24px)' }}></div>
                  </div>
                </div>
                <div className={styles.permRow}>
                  <span className={styles.permLabel}>Delete users</span>
                  <div className={`${styles.toggleSwitch} ${styles.toggleSwitchOff}`}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(0px)' }}></div>
                  </div>
                </div>
              </div>

            </>
          ) : activeTab === "Centers" ? (
            <>
              <p className={styles.centersSubtitle}>Select which centers this user can access and manage</p>
              
              <div className={styles.radioList}>
                <div className={styles.radioGroup}>
                  <div className={styles.radioItem}>
                    <div className={`${styles.radioIcon} ${styles.radioIconActive}`}>
                      <div className={styles.radioDot}></div>
                    </div>
                    <span className={styles.radioLabel}>Chandigarh</span>
                  </div>
                  
                  <div className={styles.radioChildren}>
                    <div className={styles.radioItem}>
                      <div className={styles.radioIcon}></div>
                      <span className={styles.radioLabelSub}>Sector 18</span>
                    </div>
                    <div className={styles.radioItem}>
                      <div className={styles.radioIcon}></div>
                      <span className={styles.radioLabelSub}>sector 21</span>
                    </div>
                    <div className={styles.radioItem}>
                      <div className={styles.radioIcon}></div>
                      <span className={styles.radioLabelSub}>Sector 29</span>
                    </div>
                  </div>
                </div>

                <div className={styles.radioGroup}>
                  <div className={styles.radioItem}>
                    <div className={styles.radioIcon}></div>
                    <span className={styles.radioLabel}>Jalandhar</span>
                  </div>
                </div>

                <div className={styles.radioGroup}>
                  <div className={styles.radioItem}>
                    <div className={styles.radioIcon}></div>
                    <span className={styles.radioLabel}>Mohali</span>
                  </div>
                </div>
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
                  <div className={styles.toggleSwitch}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(24px)' }}></div>
                  </div>
                </div>

                <div className={styles.secRow}>
                  <div className={styles.secRowInfo}>
                    <span className={styles.secRowTitle}>Biometric Login</span>
                    <span className={styles.secRowSub}>Allow fingerprint/face ID</span>
                  </div>
                  <div className={`${styles.toggleSwitch} ${styles.toggleSwitchOff}`}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(0px)' }}></div>
                  </div>
                </div>

                <div className={styles.secInputGroup}>
                  <span className={styles.secRowTitle}>Session Timeout</span>
                  <input type="text" className={styles.secInput} defaultValue="30" />
                </div>
              </div>

              <div className={styles.secGroup}>
                <h3 className={styles.secGroupTitle}>Device Management</h3>
                
                <div className={styles.deviceCard}>
                  <div className={styles.deviceIcon}>{Icons.phone}</div>
                  <div className={styles.deviceInfo}>
                    <span className={styles.deviceTitle}>iPhone 13 Pro</span>
                    <span className={styles.deviceSub}>Mumbai, India</span>
                  </div>
                  <span className={styles.deviceTime}>Active now</span>
                </div>

                <div className={styles.deviceCard}>
                  <div className={styles.deviceIcon}>{Icons.laptop}</div>
                  <div className={styles.deviceInfo}>
                    <span className={styles.deviceTitle}>MacBook Pro</span>
                    <span className={styles.deviceSub}>Bangalore, India</span>
                  </div>
                  <span className={styles.deviceTime}>2 hours ago</span>
                </div>

                <button className={styles.logoutAllBtn}>
                  {Icons.logout} Logout All Devices
                </button>
              </div>
            </>
          ) : activeTab === "Notifications" ? (
            <>
              <div className={styles.secGroup}>
                <h3 className={styles.secGroupTitle}>Notification Channels</h3>
                
                <div className={styles.secRow}>
                  <div className={styles.secRowInfo}>
                    <span className={styles.secRowTitle}>WhatsApp</span>
                    <span className={styles.secRowSub}>+91 98765 43210</span>
                  </div>
                  <div className={styles.toggleSwitch}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(24px)' }}></div>
                  </div>
                </div>

                <div className={styles.secRow}>
                  <div className={styles.secRowInfo}>
                    <span className={styles.secRowTitle}>Email</span>
                    <span className={styles.secRowSub}>priya.sharma@spacejam.com</span>
                  </div>
                  <div className={styles.toggleSwitch}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(24px)' }}></div>
                  </div>
                </div>

                <div className={styles.secRow}>
                  <div className={styles.secRowInfo}>
                    <span className={styles.secRowTitle}>Push Notifications</span>
                    <span className={styles.secRowSub}>Mobile & web app</span>
                  </div>
                  <div className={`${styles.toggleSwitch} ${styles.toggleSwitchOff}`}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(0px)' }}></div>
                  </div>
                </div>
              </div>

              <div className={styles.secGroup}>
                <h3 className={styles.secGroupTitle}>Notification Preferences</h3>
                
                <div className={styles.secRow}>
                  <div className={styles.secRowInfo}>
                    <span className={styles.secRowTitle}>Booking alerts</span>
                  </div>
                  <div className={styles.toggleSwitch}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(24px)' }}></div>
                  </div>
                </div>

                <div className={styles.secRow}>
                  <div className={styles.secRowInfo}>
                    <span className={styles.secRowTitle}>Payment alerts</span>
                  </div>
                  <div className={styles.toggleSwitch}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(24px)' }}></div>
                  </div>
                </div>

                <div className={styles.secRow}>
                  <div className={styles.secRowInfo}>
                    <span className={styles.secRowTitle}>Maintenance alerts</span>
                  </div>
                  <div className={`${styles.toggleSwitch} ${styles.toggleSwitchOff}`}>
                    <div className={styles.toggleKnob} style={{ transform: 'translateX(0px)' }}></div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '64px', textAlign: 'center', color: '#6B7280' }}>
              Settings for {activeTab} are coming soon.
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