'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import { CREATE_ADMIN_USER, GET_CENTERS } from '@/lib/apollo/operations';
import styles from './add-user.module.css';

const Icons = {
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  shield: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  ),
  building: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
      <path d="M9 22v-4h6v4"></path>
      <path d="M8 6h.01"></path>
      <path d="M16 6h.01"></path>
      <path d="M12 6h.01"></path>
      <path d="M12 10h.01"></path>
      <path d="M12 14h.01"></path>
      <path d="M16 10h.01"></path>
      <path d="M16 14h.01"></path>
      <path d="M8 10h.01"></path>
      <path d="M8 14h.01"></path>
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  ),
  eye: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  chevronUp: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  ),
  chevronDown: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  ),
  upload: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  message: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
  ),
  pie: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
      <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
    </svg>
  ),
  edit: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  bar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  ),
  mail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  ),
  phone: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
  ),
  arrowLeft: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  ),
};

export default function AddUserPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    employeeId: '',
    centerId: '',
    workingHours: '',
    shiftType: '',
    weeklyOff: '',
    emergencyContact: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const [roleMode, setRoleMode] = useState('Super Admin');

  // Center picker source (replaces the raw-UUID text input).
  const { data: centersData } = useQuery(GET_CENTERS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  const [perms, setPerms] = useState({
    manageLeads: true,
    approveBookings: true,
    handleComplaints: true,
    viewRevenue: true,
    manageBilling: false,
    accessReports: true,
    manageSettings: false,
  });

  const [invitations, setInvitations] = useState({
    email: true,
    whatsapp: false,
  });

  const [createAdminUser, { loading }] = useMutation(CREATE_ADMIN_USER, {
    onCompleted: () => {
      // Typically we'd show a success toast here
      router.push('/dashboard/settings');
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to create user');
      toast.error(err.message || 'Failed to create user');
    }
  });

  const handleNext = () => {
    if (activeStep < 6) setActiveStep(activeStep + 1);
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    let role = 'CENTER_MANAGER'; // "Admin" in the UI = center manager
    if (roleMode === 'Super Admin') role = 'SUPER_ADMIN';
    if (roleMode === 'Admin') role = 'CENTER_MANAGER';

    // Client-side validation so failures are visible immediately (the old
    // error banner lived above the fold and was never seen).
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Enter a valid email address');
      setActiveStep(1);
      return;
    }
    if (!formData.name?.trim()) {
      toast.error('Enter the user name');
      setActiveStep(1);
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      setActiveStep(1);
      return;
    }
    if (role === 'CENTER_MANAGER' && !formData.centerId) {
      toast.error('Select the center this manager belongs to');
      setActiveStep(3);
      return;
    }

    try {
      await createAdminUser({
        variables: {
          input: {
            email: formData.email,
            name: formData.name,
            phone: formData.phone || undefined,
            password: formData.password,
            role,
            centerId: formData.centerId || undefined,
          }
        }
      });
      toast.success('User created');
    } catch (err) {
      // handled by onError (which also toasts below)
    }
  };

  const STEPS = [
    { num: 1, label: 'Basic Info' },
    { num: 2, label: 'Permissions' },
    { num: 3, label: 'Center Assignment' },
    { num: 4, label: 'Work Configuration' },
    { num: 5, label: 'System Access' },
    { num: 6, label: 'Review' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.headerCard}>
        <div className={styles.headerTitleWrap}>
          <h1 className={styles.headerTitle}>Access & Permissions</h1>
          <p className={styles.headerSubtitle}>Manage users, roles, and system access</p>
        </div>
        <button className={styles.addUserBtn}>
          {Icons.plus} Add User
        </button>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px' }}>
          {errorMsg}
        </div>
      )}

      <div className={styles.stepperCard}>
        {STEPS.map((s, idx) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: idx === STEPS.length - 1 ? 'none' : 1 }}>
            <div className={styles.stepItem} onClick={() => setActiveStep(s.num)} style={{ cursor: 'pointer' }}>
              <div className={`${styles.stepNumber} ${activeStep === s.num ? styles.stepNumberActive : ''} ${activeStep > s.num ? styles.stepNumberCompleted : ''}`}>
                {s.num}
              </div>
              <span className={`${styles.stepLabel} ${activeStep === s.num ? styles.stepLabelActive : ''}`}>
                {s.label}
              </span>
            </div>
            {idx !== STEPS.length - 1 && (
              <div className={`${styles.stepDivider} ${activeStep > s.num ? styles.stepDividerActive : ''}`}></div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.accordionList}>
        
        {/* Step 1: Basic Details */}
        <div className={styles.accordionCard}>
          <div className={styles.accordionHeader} onClick={() => setActiveStep(1)}>
            <div className={styles.accordionHeaderLeft}>
              <div className={`${styles.accordionIconWrap} ${activeStep === 1 ? styles.accordionIconWrapActive : ''}`}>
                {Icons.user}
              </div>
              <div className={styles.accordionTitleWrap}>
                <div className={styles.accordionTitle}>Basic Details</div>
                <div className={styles.accordionSubtitle}>Personal and contact information</div>
              </div>
            </div>
            <div className={styles.accordionChevron}>
              {activeStep === 1 ? Icons.chevronUp : Icons.chevronDown}
            </div>
          </div>
          {activeStep === 1 && (
            <div className={styles.accordionContent}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Name <span className={styles.required}>*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className={styles.formInput} placeholder="John Doe" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone Number <span className={styles.required}>*</span></label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={styles.formInput} placeholder="+91 9876543210" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email <span className={styles.required}>*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={styles.formInput} placeholder="john.doe@spacejam.com" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Employee ID <span className={styles.required}>*</span></label>
                  <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} className={styles.formInput} placeholder="EMP-2026-001" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Assign Center <span className={styles.required}>*</span></label>
                  <select name="centerId" value={formData.centerId} onChange={handleChange} className={styles.formInput}>
                    <option value="">Select a center…</option>
                    {(centersData?.centers ?? []).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Profile Photo</label>
                  <div className={styles.uploadPhotoBox}>
                    {Icons.upload} Upload Photo
                  </div>
                </div>
              </div>
              <div className={styles.continueBtnWrap}>
                <button className={styles.continueBtn} onClick={handleNext}>Continue</button>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Role & Permissions */}
        <div className={styles.accordionCard}>
          <div className={styles.accordionHeader} onClick={() => setActiveStep(2)}>
            <div className={styles.accordionHeaderLeft}>
              <div className={`${styles.accordionIconWrap} ${activeStep === 2 ? styles.accordionIconWrapActive : ''}`}>
                {Icons.shield}
              </div>
              <div className={styles.accordionTitleWrap}>
                <div className={styles.accordionTitle}>Role & Permissions</div>
                <div className={styles.accordionSubtitle}>Define access and control levels</div>
              </div>
            </div>
            <div className={styles.accordionChevron}>
              {activeStep === 2 ? Icons.chevronUp : Icons.chevronDown}
            </div>
          </div>
          {activeStep === 2 && (
            <div className={styles.accordionContent}>
              <div className={styles.roleSelector}>
                <div className={`${styles.roleOption} ${roleMode === 'Super Admin' ? styles.roleOptionActive : ''}`} onClick={() => setRoleMode('Super Admin')}>Super Admin</div>
                <div className={`${styles.roleOption} ${roleMode === 'Admin' ? styles.roleOptionActive : ''}`} onClick={() => setRoleMode('Admin')}>Admin</div>
              </div>
              
              <div className={styles.permSection}>
                <div className={styles.permSectionTitle}>Operations</div>
                <div className={styles.permRow}>
                  <div className={styles.permLabelWrap}>
                    <div className={styles.permIcon}>{Icons.users}</div>
                    <span className={styles.permLabel}>Manage Leads</span>
                  </div>
                  <div className={`${styles.toggleSwitch} ${!perms.manageLeads ? styles.toggleSwitchOff : ''}`} onClick={() => setPerms({...perms, manageLeads: !perms.manageLeads})}>
                    <div className={styles.toggleKnob} style={{ transform: perms.manageLeads ? 'translateX(20px)' : 'translateX(0px)' }}></div>
                  </div>
                </div>
                <div className={styles.permRow}>
                  <div className={styles.permLabelWrap}>
                    <div className={styles.permIcon}>{Icons.check}</div>
                    <span className={styles.permLabel}>Approve Bookings</span>
                  </div>
                  <div className={`${styles.toggleSwitch} ${!perms.approveBookings ? styles.toggleSwitchOff : ''}`} onClick={() => setPerms({...perms, approveBookings: !perms.approveBookings})}>
                    <div className={styles.toggleKnob} style={{ transform: perms.approveBookings ? 'translateX(20px)' : 'translateX(0px)' }}></div>
                  </div>
                </div>
                <div className={styles.permRow}>
                  <div className={styles.permLabelWrap}>
                    <div className={styles.permIcon}>{Icons.message}</div>
                    <span className={styles.permLabel}>Handle Complaints</span>
                  </div>
                  <div className={`${styles.toggleSwitch} ${!perms.handleComplaints ? styles.toggleSwitchOff : ''}`} onClick={() => setPerms({...perms, handleComplaints: !perms.handleComplaints})}>
                    <div className={styles.toggleKnob} style={{ transform: perms.handleComplaints ? 'translateX(20px)' : 'translateX(0px)' }}></div>
                  </div>
                </div>
              </div>

              <div className={styles.permSection}>
                <div className={styles.permSectionTitle}>Finance</div>
                <div className={styles.permRow}>
                  <div className={styles.permLabelWrap}>
                    <div className={styles.permIcon}>{Icons.eye}</div>
                    <span className={styles.permLabel}>View Revenue</span>
                  </div>
                  <div className={`${styles.toggleSwitch} ${!perms.viewRevenue ? styles.toggleSwitchOff : ''}`} onClick={() => setPerms({...perms, viewRevenue: !perms.viewRevenue})}>
                    <div className={styles.toggleKnob} style={{ transform: perms.viewRevenue ? 'translateX(20px)' : 'translateX(0px)' }}></div>
                  </div>
                </div>
                <div className={styles.permRow}>
                  <div className={styles.permLabelWrap}>
                    <div className={styles.permIcon}>{Icons.edit}</div>
                    <span className={styles.permLabel}>Manage Billing</span>
                  </div>
                  <div className={`${styles.toggleSwitch} ${!perms.manageBilling ? styles.toggleSwitchOff : ''}`} onClick={() => setPerms({...perms, manageBilling: !perms.manageBilling})}>
                    <div className={styles.toggleKnob} style={{ transform: perms.manageBilling ? 'translateX(20px)' : 'translateX(0px)' }}></div>
                  </div>
                </div>
              </div>

              <div className={styles.permSection}>
                <div className={styles.permSectionTitle}>Admin</div>
                <div className={styles.permRow}>
                  <div className={styles.permLabelWrap}>
                    <div className={styles.permIcon}>{Icons.bar}</div>
                    <span className={styles.permLabel}>Access Reports</span>
                  </div>
                  <div className={`${styles.toggleSwitch} ${!perms.accessReports ? styles.toggleSwitchOff : ''}`} onClick={() => setPerms({...perms, accessReports: !perms.accessReports})}>
                    <div className={styles.toggleKnob} style={{ transform: perms.accessReports ? 'translateX(20px)' : 'translateX(0px)' }}></div>
                  </div>
                </div>
                <div className={styles.permRow}>
                  <div className={styles.permLabelWrap}>
                    <div className={styles.permIcon}>{Icons.settings}</div>
                    <span className={styles.permLabel}>Manage Settings</span>
                  </div>
                  <div className={`${styles.toggleSwitch} ${!perms.manageSettings ? styles.toggleSwitchOff : ''}`} onClick={() => setPerms({...perms, manageSettings: !perms.manageSettings})}>
                    <div className={styles.toggleKnob} style={{ transform: perms.manageSettings ? 'translateX(20px)' : 'translateX(0px)' }}></div>
                  </div>
                </div>
              </div>

              <div className={styles.continueBtnWrap}>
                <button className={styles.continueBtn} onClick={handleNext}>Continue</button>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Center Assignment */}
        <div className={styles.accordionCard}>
          <div className={styles.accordionHeader} onClick={() => setActiveStep(3)}>
            <div className={styles.accordionHeaderLeft}>
              <div className={`${styles.accordionIconWrap} ${activeStep === 3 ? styles.accordionIconWrapActive : ''}`}>
                {Icons.building}
              </div>
              <div className={styles.accordionTitleWrap}>
                <div className={styles.accordionTitle}>Center Assignment</div>
                <div className={styles.accordionSubtitle}>Location and access areas</div>
              </div>
            </div>
            <div className={styles.accordionChevron}>
              {activeStep === 3 ? Icons.chevronUp : Icons.chevronDown}
            </div>
          </div>
          {activeStep === 3 && (
            <div className={styles.accordionContent}>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Select Center(s) <span className={styles.required}>*</span></label>
                <select name="centerId" value={formData.centerId} onChange={handleChange} className={styles.formInput}>
                    <option value="">Select a center…</option>
                    {(centersData?.centers ?? []).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
              </div>
              <div className={styles.formGroupFull} style={{ marginTop: '16px' }}>
                <label className={styles.formLabel}>Floor Access</label>
                <div className={styles.floorSelectRow}>
                  <div className={styles.floorBtn}>Ground Floor</div>
                  <div className={styles.floorBtn}>First Floor</div>
                  <div className={styles.floorBtn}>Second Floor</div>
                  <div className={styles.floorBtn}>Terrace</div>
                </div>
              </div>
              <div className={styles.continueBtnWrap}>
                <button className={styles.continueBtn} onClick={handleNext}>Continue</button>
              </div>
            </div>
          )}
        </div>

        {/* Step 4: Work Configuration */}
        <div className={styles.accordionCard}>
          <div className={styles.accordionHeader} onClick={() => setActiveStep(4)}>
            <div className={styles.accordionHeaderLeft}>
              <div className={`${styles.accordionIconWrap} ${activeStep === 4 ? styles.accordionIconWrapActive : ''}`}>
                {Icons.clock}
              </div>
              <div className={styles.accordionTitleWrap}>
                <div className={styles.accordionTitle}>Work Configuration</div>
                <div className={styles.accordionSubtitle}>Schedule and emergency contact</div>
              </div>
            </div>
            <div className={styles.accordionChevron}>
              {activeStep === 4 ? Icons.chevronUp : Icons.chevronDown}
            </div>
          </div>
          {activeStep === 4 && (
            <div className={styles.accordionContent}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Working Hours <span className={styles.required}>*</span></label>
                  <input type="text" name="workingHours" value={formData.workingHours} onChange={handleChange} className={styles.formInput} placeholder="" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Shift Type <span className={styles.required}>*</span></label>
                  <input type="text" name="shiftType" value={formData.shiftType} onChange={handleChange} className={styles.formInput} placeholder="" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Weekly Off <span className={styles.required}>*</span></label>
                  <input type="text" name="weeklyOff" value={formData.weeklyOff} onChange={handleChange} className={styles.formInput} placeholder="" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Emergency Contact</label>
                  <input type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} className={styles.formInput} placeholder="+91 9876543210" />
                </div>
              </div>
              <div className={styles.continueBtnWrap}>
                <button className={styles.continueBtn} onClick={handleNext}>Continue</button>
              </div>
            </div>
          )}
        </div>

        {/* Step 5: System Access */}
        <div className={styles.accordionCard}>
          <div className={styles.accordionHeader} onClick={() => setActiveStep(5)}>
            <div className={styles.accordionHeaderLeft}>
              <div className={`${styles.accordionIconWrap} ${activeStep === 5 ? styles.accordionIconWrapActive : ''}`}>
                {Icons.settings}
              </div>
              <div className={styles.accordionTitleWrap}>
                <div className={styles.accordionTitle}>System Access</div>
                <div className={styles.accordionSubtitle}>Login credentials and invitations</div>
              </div>
            </div>
            <div className={styles.accordionChevron}>
              {activeStep === 5 ? Icons.chevronUp : Icons.chevronDown}
            </div>
          </div>
          {activeStep === 5 && (
            <div className={styles.accordionContent}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email / Username <span className={styles.required}>*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={styles.formInput} placeholder="john.doe@spacejam.com" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Password <span className={styles.required}>*</span></label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} className={styles.formInput} placeholder="••••••••" />
                </div>
              </div>

              <div className={styles.invitationBox}>
                <div className={styles.invitationTitle}>Send Invitation</div>
                <div className={styles.invitationRow}>
                  <div className={styles.invLabelWrap}>
                    {Icons.mail}
                    <div className={styles.invTextWrap}>
                      <span className={styles.invLabel}>Email Invitation</span>
                      <span className={styles.invSub}>Send login details via email</span>
                    </div>
                  </div>
                  <div className={`${styles.toggleSwitch} ${!invitations.email ? styles.toggleSwitchOff : ''}`} onClick={() => setInvitations({...invitations, email: !invitations.email})}>
                    <div className={styles.toggleKnob} style={{ transform: invitations.email ? 'translateX(20px)' : 'translateX(0px)' }}></div>
                  </div>
                </div>
                <div className={styles.invitationRow}>
                  <div className={styles.invLabelWrap}>
                    {Icons.phone}
                    <div className={styles.invTextWrap}>
                      <span className={styles.invLabel}>WhatsApp Invitation</span>
                      <span className={styles.invSub}>Send login details via WhatsApp</span>
                    </div>
                  </div>
                  <div className={`${styles.toggleSwitch} ${!invitations.whatsapp ? styles.toggleSwitchOff : ''}`} onClick={() => setInvitations({...invitations, whatsapp: !invitations.whatsapp})}>
                    <div className={styles.toggleKnob} style={{ transform: invitations.whatsapp ? 'translateX(20px)' : 'translateX(0px)' }}></div>
                  </div>
                </div>
              </div>
              
              <div className={styles.continueBtnWrap}>
                <button className={styles.continueBtn} onClick={handleNext}>Continue</button>
              </div>
            </div>
          )}
        </div>

        {/* Step 6: Review */}
        <div className={styles.accordionCard}>
          <div className={styles.accordionHeader} onClick={() => setActiveStep(6)}>
            <div className={styles.accordionHeaderLeft}>
              <div className={`${styles.accordionIconWrap} ${activeStep === 6 ? styles.accordionIconWrapActive : ''}`}>
                {Icons.eye}
              </div>
              <div className={styles.accordionTitleWrap}>
                <div className={styles.accordionTitle}>Review</div>
                <div className={styles.accordionSubtitle}>Summary of all information</div>
              </div>
            </div>
            <div className={styles.accordionChevron}>
              {activeStep === 6 ? Icons.chevronUp : Icons.chevronDown}
            </div>
          </div>
          {activeStep === 6 && (
            <div className={styles.accordionContent}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>Please review the user details before creating the account.</p>
              
              <div className={styles.reviewSection}>
                {/* Basic Details */}
                <div className={styles.reviewBlock}>
                  <div className={styles.reviewBlockHeader}>
                    <div className={styles.reviewBlockTitle}>Basic Details</div>
                    <button className={styles.editBtn} onClick={() => setActiveStep(1)}>Edit</button>
                  </div>
                  <div className={styles.reviewGrid}>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Full Name</span>
                      <span className={styles.reviewValue}>{formData.name || '-'}</span>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Phone Number</span>
                      <span className={styles.reviewValue}>{formData.phone || '-'}</span>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Email</span>
                      <span className={styles.reviewValue}>{formData.email || '-'}</span>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Employee ID</span>
                      <span className={styles.reviewValue}>{formData.employeeId || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Role & Permissions */}
                <div className={styles.reviewBlock}>
                  <div className={styles.reviewBlockHeader}>
                    <div className={styles.reviewBlockTitle}>Role & Permissions</div>
                    <button className={styles.editBtn} onClick={() => setActiveStep(2)}>Edit</button>
                  </div>
                  <div className={styles.reviewGrid}>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Role Type</span>
                      <span className={styles.reviewValue}>{roleMode}</span>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Active Permissions</span>
                      <span className={styles.reviewValue}>
                        {Object.entries(perms).filter(([_, val]) => val).length} Permissions granted
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center Assignment */}
                <div className={styles.reviewBlock}>
                  <div className={styles.reviewBlockHeader}>
                    <div className={styles.reviewBlockTitle}>Center Assignment</div>
                    <button className={styles.editBtn} onClick={() => setActiveStep(3)}>Edit</button>
                  </div>
                  <div className={styles.reviewGrid}>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Assigned Center</span>
                      <span className={styles.reviewValue}>
                      {(centersData?.centers ?? []).find((c) => c.id === formData.centerId)?.name || '-'}
                    </span>
                    </div>
                  </div>
                </div>

                {/* Work Configuration */}
                <div className={styles.reviewBlock}>
                  <div className={styles.reviewBlockHeader}>
                    <div className={styles.reviewBlockTitle}>Work Configuration</div>
                    <button className={styles.editBtn} onClick={() => setActiveStep(4)}>Edit</button>
                  </div>
                  <div className={styles.reviewGrid}>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Working Hours</span>
                      <span className={styles.reviewValue}>{formData.workingHours || '-'}</span>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Weekly Off</span>
                      <span className={styles.reviewValue}>{formData.weeklyOff || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
      </div>

      <div className={styles.footerBar}>
        <div className={styles.footerInner}>
          <div className={styles.footerLeft}>
            <button className={styles.backBtn} onClick={() => router.push('/dashboard/settings')}>
              {Icons.arrowLeft}
            </button>
            <button className={styles.draftBtn}>Save as Draft</button>
          </div>
          <button 
            className={styles.createBtn} 
            onClick={handleSubmit}
            disabled={loading || !formData.email || !formData.password || !formData.name}
          >
            {loading ? 'Creating...' : 'Create Manager Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
