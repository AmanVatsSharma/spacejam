"use client";

import { useState } from "react";
import styles from "./calendar.module.css";

const Icons = {
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  chevronLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
  clock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF7847" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  mapPin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  gift: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF7847" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"></polyline>
      <rect x="2" y="7" width="20" height="5"></rect>
      <line x1="12" y1="22" x2="12" y2="7"></line>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
    </svg>
  ),
  send: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  ),
  users: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  calendarPlus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
      <line x1="10" y1="16" x2="14" y2="16"></line>
      <line x1="12" y1="14" x2="12" y2="18"></line>
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  upload: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  )
};

export default function CalendarPage() {
  const [view, setView] = useState("Month");
  
  // Modals state
  const [activeModal, setActiveModal] = useState<"birthday" | "block" | "visit" | "event" | null>(null);
  const [selectedBirthday, setSelectedBirthday] = useState<{name: string, date: string, initials: string} | null>(null);

  const openBirthdayModal = (name: string, date: string, initials: string) => {
    setSelectedBirthday({ name, date, initials });
    setActiveModal("birthday");
  };

  const closeModal = () => setActiveModal(null);

  return (
    <div className={styles.pageContainer}>
      
      {/* Main Column */}
      <div className={styles.mainColumn}>
        
        <div className={styles.headerBlock}>
          <div>
            <h1 className={styles.headerTitle}>Calender</h1>
            <p className={styles.headerSubtitle}>View birthday, event, meeting room and lead Schedule</p>
          </div>
          <button className={styles.btnPrimary} onClick={() => setActiveModal("event")}>{Icons.plus} Create Event</button>
        </div>

        <div className={styles.controlsBlock}>
          <div className={styles.dateNav}>
            <div className={styles.monthLabel}>March 2026</div>
            <div className={styles.navBtn}>{Icons.chevronLeft}</div>
            <div className={styles.navBtn}>{Icons.chevronRight}</div>
          </div>
          <div className={styles.dateNav}>
            <button className={styles.todayBtn}>Today</button>
            <div className={styles.viewToggles}>
              <button className={`${styles.toggleBtn} ${view === 'Month' ? styles.active : ''}`} onClick={() => setView('Month')}>Month</button>
              <button className={`${styles.toggleBtn} ${view === 'Week' ? styles.active : ''}`} onClick={() => setView('Week')}>Week</button>
              <button className={`${styles.toggleBtn} ${view === 'Day' ? styles.active : ''}`} onClick={() => setView('Day')}>Day</button>
            </div>
          </div>
        </div>

        <div className={styles.calendarContainer}>
          <div className={styles.weekdaysRow}>
            <div className={styles.weekday}>Mon</div>
            <div className={styles.weekday}>Tue</div>
            <div className={styles.weekday}>Wed</div>
            <div className={styles.weekday}>Thu</div>
            <div className={styles.weekday}>Fri</div>
            <div className={styles.weekday}>Sat</div>
            <div className={styles.weekday}>Sun</div>
          </div>
          <div className={styles.daysGrid}>
            <div className={`${styles.dayCell} ${styles.empty}`}></div>
            <div className={`${styles.dayCell} ${styles.empty}`}></div>
            <div className={`${styles.dayCell} ${styles.empty}`}></div>
            <div className={`${styles.dayCell} ${styles.empty}`}></div>
            <div className={`${styles.dayCell} ${styles.empty}`}></div>
            <div className={`${styles.dayCell} ${styles.empty}`}></div>
            
            <div className={styles.dayCell}><div className={styles.dayNumber}>1</div></div>
            <div className={styles.dayCell}><div className={styles.dayNumber}>2</div></div>
            <div className={styles.dayCell}>
              <div className={styles.dayNumber}>3</div>
              <div className={`${styles.eventPill} ${styles.eventPink}`}>🍰 Rahul Sharma</div>
            </div>
            <div className={styles.dayCell}><div className={styles.dayNumber}>4</div></div>
            <div className={styles.dayCell}>
              <div className={styles.dayNumber}>5</div>
              <div className={`${styles.eventPill} ${styles.eventOrange}`}>10:00 Conference R</div>
              <div className={`${styles.eventPill} ${styles.eventBlue}`}>14:00 Client Visit</div>
            </div>
            <div className={styles.dayCell}><div className={styles.dayNumber}>6</div></div>
            <div className={styles.dayCell}>
              <div className={styles.dayNumber}>7</div>
              <div className={`${styles.eventPill} ${styles.eventOrange}`}>11:00 Team Meeting</div>
            </div>
            <div className={styles.dayCell}>
              <div className={styles.dayNumber}>8</div>
              <div className={`${styles.eventPill} ${styles.eventPink}`}>🍰 Priya Mehta</div>
            </div>
            <div className={styles.dayCell}><div className={styles.dayNumber}>9</div></div>
            <div className={styles.dayCell}>
              <div className={styles.dayNumber}>10</div>
              <div className={`${styles.eventPill} ${styles.eventPurple}`}>15:00 Workshop: Ne</div>
            </div>
            <div className={styles.dayCell}><div className={styles.dayNumber}>11</div></div>
            <div className={styles.dayCell}>
              <div className={styles.dayNumber}>12</div>
              <div className={`${styles.eventPill} ${styles.eventOrange}`}>09:00 Meeting Room</div>
              <div className={`${styles.eventPill} ${styles.eventBlue}`}>13:00 Tour Booking</div>
              <div className={styles.moreText}>+1 more</div>
            </div>
            <div className={`${styles.dayCell} ${styles.active}`}>
              <div className={styles.dayNumber}>13</div>
              <div className={`${styles.eventPill} ${styles.eventBlue}`}>10:00 Client Meeting</div>
              <div className={`${styles.eventPill} ${styles.eventGrey}`}>14:00 Review Tasks</div>
            </div>
            <div className={styles.dayCell}><div className={styles.dayNumber}>14</div></div>
            <div className={styles.dayCell}>
              <div className={styles.dayNumber}>15</div>
              <div className={`${styles.eventPill} ${styles.eventPink}`}>🍰 Arjun Singh</div>
              <div className={`${styles.eventPill} ${styles.eventPurple}`}>18:00 Community E</div>
            </div>
            <div className={styles.dayCell}><div className={styles.dayNumber}>16</div></div>
            <div className={styles.dayCell}>
              <div className={styles.dayNumber}>17</div>
              <div className={`${styles.eventPill} ${styles.eventOrange}`}>10:30 Conference R</div>
            </div>
            <div className={styles.dayCell}><div className={styles.dayNumber}>18</div></div>
            <div className={styles.dayCell}>
              <div className={styles.dayNumber}>19</div>
              <div className={`${styles.eventPill} ${styles.eventBlue}`}>11:00 Client Onboar</div>
            </div>
            <div className={styles.dayCell}>
              <div className={styles.dayNumber}>20</div>
              <div className={`${styles.eventPill} ${styles.eventPurple}`}>14:00 Training Sess</div>
              <div className={`${styles.eventPill} ${styles.eventGrey}`}>16:30 Inspection</div>
            </div>
            <div className={styles.dayCell}><div className={styles.dayNumber}>21</div></div>
            <div className={styles.dayCell}>
              <div className={styles.dayNumber}>22</div>
              <div className={`${styles.eventPill} ${styles.eventPink}`}>🍰 Neha Kapoor</div>
            </div>
            <div className={styles.dayCell}><div className={styles.dayNumber}>23</div></div>
            <div className={styles.dayCell}>
              <div className={styles.dayNumber}>24</div>
              <div className={`${styles.eventPill} ${styles.eventOrange}`}>09:00 Board Room</div>
              <div className={`${styles.eventPill} ${styles.eventBlue}`}>15:00 Site Visit</div>
            </div>
            <div className={styles.dayCell}><div className={styles.dayNumber}>25</div></div>
            <div className={styles.dayCell}>
              <div className={styles.dayNumber}>26</div>
              <div className={`${styles.eventPill} ${styles.eventPurple}`}>19:00 Monthly Mixe</div>
            </div>
            <div className={styles.dayCell}><div className={styles.dayNumber}>27</div></div>
            <div className={styles.dayCell}>
              <div className={styles.dayNumber}>28</div>
              <div className={`${styles.eventPill} ${styles.eventOrange}`}>10:00 Meeting Room</div>
            </div>
            <div className={styles.dayCell}><div className={styles.dayNumber}>29</div></div>
            <div className={styles.dayCell}><div className={styles.dayNumber}>30</div></div>
            <div className={styles.dayCell}><div className={styles.dayNumber}>31</div></div>
          </div>
        </div>
      </div>

      {/* Side Column */}
      <div className={styles.sideColumn}>
        
        {/* Today's Schedule */}
        <div className={styles.sideModule}>
          <h3 className={styles.sideModuleTitle}>{Icons.clock} Today's Schedule</h3>
          <div className={styles.scheduleItem}>
            <div className={`${styles.scheduleIconWrap} ${styles.scheduleIconOrange}`}>{Icons.mapPin}</div>
            <div>
              <p className={styles.scheduleTime}>
                10:00 <span className={styles.scheduleBadge} style={{ background: '#FF7847' }}>visit</span>
              </p>
              <p className={styles.scheduleTitle}>Client Meeting</p>
            </div>
          </div>
          <div className={styles.scheduleItem}>
            <div className={`${styles.scheduleIconWrap} ${styles.scheduleIconGrey}`}>{Icons.check}</div>
            <div>
              <p className={styles.scheduleTime}>
                14:00 <span className={styles.scheduleBadge} style={{ background: '#6B7280' }}>task</span>
              </p>
              <p className={styles.scheduleTitle}>Review Tasks</p>
            </div>
          </div>
          <div style={{ marginTop: '24px' }}>
            <h4 style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontWeight: 700 }}>Legend</h4>
            <div className={styles.legendList}>
              <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: '#FF7847' }}></div> Meeting Room Bookings</div>
              <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: '#3B82F6' }}></div> Client Visits</div>
              <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: '#8B5CF6' }}></div> Events</div>
              <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: '#6B7280' }}></div> Internal Tasks</div>
              <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: '#EC4899' }}></div> Birthdays</div>
            </div>
          </div>
        </div>

        {/* Birthdays */}
        <div className={styles.sideModule}>
          <h3 className={styles.sideModuleTitle}>{Icons.gift} Birthdays This Month</h3>
          
          <div className={styles.birthdayList}>
            <div className={styles.birthdayCard}>
              <div className={styles.bdayLeft}>
                <div className={styles.avatar}>RS</div>
                <div>
                  <div className={styles.bdayName}>Rahul Sharma</div>
                  <div className={styles.bdayDate}>March 3</div>
                </div>
              </div>
              <button className={styles.wishBtn} onClick={() => openBirthdayModal("Rahul Sharma", "March 3, 2026", "RS")}>{Icons.send} Wish</button>
            </div>
            <div className={styles.birthdayCard}>
              <div className={styles.bdayLeft}>
                <div className={styles.avatar}>PM</div>
                <div>
                  <div className={styles.bdayName}>Priya Mehta</div>
                  <div className={styles.bdayDate}>March 8</div>
                </div>
              </div>
              <button className={styles.wishBtn} onClick={() => openBirthdayModal("Priya Mehta", "March 8, 2026", "PM")}>{Icons.send} Wish</button>
            </div>
            <div className={styles.birthdayCard}>
              <div className={styles.bdayLeft}>
                <div className={styles.avatar}>AS</div>
                <div>
                  <div className={styles.bdayName}>Arjun Singh</div>
                  <div className={styles.bdayDate}>March 15</div>
                </div>
              </div>
              <button className={styles.wishBtn} onClick={() => openBirthdayModal("Arjun Singh", "March 15, 2026", "AS")}>{Icons.send} Wish</button>
            </div>
            <div className={styles.birthdayCard}>
              <div className={styles.bdayLeft}>
                <div className={styles.avatar}>NK</div>
                <div>
                  <div className={styles.bdayName}>Neha Kapoor</div>
                  <div className={styles.bdayDate}>March 22</div>
                </div>
              </div>
              <button className={styles.wishBtn} onClick={() => openBirthdayModal("Neha Kapoor", "March 22, 2026", "NK")}>{Icons.send} Wish</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Floating Bar */}
      <div className={styles.bottomActionBar}>
        <button className={styles.btnPrimary} onClick={() => setActiveModal("block")}>{Icons.plus} Add Booking</button>
        <button className={styles.btnSecondary} onClick={() => setActiveModal("visit")}>{Icons.users} Schedule Visit</button>
        <button className={styles.btnSecondary} onClick={() => setActiveModal("event")}>{Icons.calendarPlus} Create Event</button>
      </div>

      {/* MODALS */}
      {activeModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            
            {/* 1. BIRTHDAY MODAL */}
            {activeModal === "birthday" && selectedBirthday && (
              <>
                <div className={styles.modalHeader}>
                  <div>
                    <h2 className={styles.modalTitle}>Send Birthday Wishes</h2>
                    <p className={styles.modalSubtitle}>{selectedBirthday.date}</p>
                  </div>
                  <button className={styles.modalClose} onClick={closeModal}>{Icons.close}</button>
                </div>
                <div className={styles.modalBody}>
                  <div className={styles.bdayHero}>
                    <div className={styles.avatar}>{selectedBirthday.initials}</div>
                    <div>
                      <div className={styles.bdayName}>{selectedBirthday.name}</div>
                      <div className={styles.bdayDate}>Center Manager</div>
                    </div>
                  </div>
                  
                  <div>
                    <p className={styles.formLabel} style={{ marginBottom: '12px' }}>Quick Messages</p>
                    <div className={styles.quickMessageGrid}>
                      <div className={styles.quickMessageCard}>Wishing you a wonderful birthday filled with joy and happine...</div>
                      <div className={styles.quickMessageCard}>Happy Birthday! May this special day bring you all the succe...</div>
                      <div className={styles.quickMessageCard}>Many happy returns of the day! Wishing you good health, happ...</div>
                      <div className={styles.quickMessageCard}>Happy Birthday! May your day be as amazing as you are! 🎈</div>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>CUSTOM MESSAGE</label>
                    <textarea className={styles.formTextarea} placeholder="Write your own birthday message..."></textarea>
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button className={styles.btnSecondary} style={{ width: '50%', justifyContent: 'center' }} onClick={closeModal}>Cancel</button>
                  <button className={styles.btnSecondary} style={{ width: '50%', justifyContent: 'center', opacity: 0.5, cursor: 'not-allowed' }}>{Icons.send} Send Wishes</button>
                </div>
              </>
            )}

            {/* 2. BLOCK TIME MODAL */}
            {activeModal === "block" && (
              <>
                <div className={styles.modalHeader}>
                  <div>
                    <h2 className={styles.modalTitle}>Block Time</h2>
                    <p className={styles.modalSubtitle}>Block time for maintenance, cleaning, or other internal tasks.</p>
                  </div>
                  <button className={styles.modalClose} onClick={closeModal}>{Icons.close}</button>
                </div>
                <div className={styles.modalBody}>
                  <div className={styles.formGroup}>
                    <h3 className={styles.formLabel} style={{ fontSize: '14px', margin: '0 0 4px 0' }}>Block Type</h3>
                    <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Type of Block</label>
                    <select className={styles.formSelect}><option>Select block type</option></select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Resource to Block</label>
                    <select className={styles.formSelect}><option>Select resource</option></select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Reason</label>
                    <input type="text" className={styles.formInput} placeholder="e.g., Annual deep cleaning" />
                  </div>
                  
                  <h3 className={styles.formLabel} style={{ fontSize: '14px', margin: '12px 0 0 0' }}>Time Period</h3>
                  <div className={styles.grid2}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Start Date</label>
                      <input type="text" className={styles.formInput} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>End Date</label>
                      <input type="text" className={styles.formInput} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Start Time</label>
                      <input type="text" className={styles.formInput} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>End Time</label>
                      <input type="text" className={styles.formInput} />
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Recurring</label>
                    <select className={styles.formSelect}><option>Select recurrence</option></select>
                  </div>

                  <h3 className={styles.formLabel} style={{ fontSize: '14px', margin: '12px 0 0 0' }}>Additional Information</h3>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Notes</label>
                    <textarea className={styles.formTextarea} placeholder="Add any additional details or instructions..."></textarea>
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button className={styles.btnSecondary} onClick={closeModal}>Cancel</button>
                  <button className={styles.btnPrimary}>Block Time</button>
                </div>
              </>
            )}

            {/* 3. SCHEDULE VISIT MODAL */}
            {activeModal === "visit" && (
              <>
                <div className={styles.modalHeader}>
                  <div>
                    <h2 className={styles.modalTitle}>Schedule Visit</h2>
                    <p className={styles.modalSubtitle}>Schedule a center tour for potential clients.</p>
                  </div>
                  <button className={styles.modalClose} onClick={closeModal}>{Icons.close}</button>
                </div>
                <div className={styles.modalBody}>
                  <h3 className={styles.formLabel} style={{ fontSize: '14px', margin: 0 }}>Client Information</h3>
                  <div className={styles.grid2}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Client Name</label>
                      <input type="text" className={styles.formInput} placeholder="Enter full name" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Phone Number</label>
                      <input type="text" className={styles.formInput} placeholder="Enter phone number" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Email Address</label>
                      <input type="text" className={styles.formInput} placeholder="Enter email address" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Company Name</label>
                      <input type="text" className={styles.formInput} placeholder="Enter company name" />
                    </div>
                  </div>

                  <h3 className={styles.formLabel} style={{ fontSize: '14px', margin: '12px 0 0 0' }}>Visit Details</h3>
                  <div className={styles.grid2}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Visit Date</label>
                      <input type="text" className={styles.formInput} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Visit Time</label>
                      <input type="text" className={styles.formInput} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Tour Type</label>
                      <select className={styles.formSelect}><option>Select tour type</option></select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Interested In</label>
                      <select className={styles.formSelect}><option>Select plan</option></select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Assigned To</label>
                    <select className={styles.formSelect}><option>Select center manager</option></select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Notes</label>
                    <textarea className={styles.formTextarea} placeholder="Any special requirements or notes for the visit..."></textarea>
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button className={styles.btnSecondary} onClick={closeModal}>Cancel</button>
                  <button className={styles.btnPrimary}>Schedule Visit</button>
                </div>
              </>
            )}

            {/* 4. CREATE EVENT MODAL */}
            {activeModal === "event" && (
              <>
                <div className={styles.modalHeader}>
                  <div>
                    <h2 className={styles.modalTitle}>Create Event</h2>
                    <p className={styles.modalSubtitle}>Create a community event, workshop, or networking session.</p>
                  </div>
                  <button className={styles.modalClose} onClick={closeModal}>{Icons.close}</button>
                </div>
                <div className={styles.modalBody}>
                  <h3 className={styles.formLabel} style={{ fontSize: '14px', margin: 0 }}>Event Information</h3>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Event Title</label>
                    <input type="text" className={styles.formInput} placeholder="e.g., Monthly Networking Mixer" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Event Type</label>
                    <select className={styles.formSelect}><option>Select event type</option></select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Description</label>
                    <textarea className={styles.formTextarea} placeholder="Describe the event and what attendees can expect..."></textarea>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Upload Image or Graphic for the event</label>
                    <div className={styles.uploadBox}>
                      <div className={styles.uploadIcon}>{Icons.upload}</div>
                      <p className={styles.uploadText}>Click to upload or drag and drop</p>
                      <p className={styles.uploadSubtext}>PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>

                  <h3 className={styles.formLabel} style={{ fontSize: '14px', margin: '12px 0 0 0' }}>Schedule & Location</h3>
                  <div className={styles.grid2}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Date</label>
                      <input type="text" className={styles.formInput} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Location</label>
                      <select className={styles.formSelect}><option>Select location</option></select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Start Time</label>
                      <input type="text" className={styles.formInput} placeholder="dd/mm/year" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>End Time</label>
                      <input type="text" className={styles.formInput} placeholder="dd/mm/year" />
                    </div>
                  </div>

                  <h3 className={styles.formLabel} style={{ fontSize: '14px', margin: '12px 0 0 0' }}>Event Details</h3>
                  <div className={styles.grid2}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Max Capacity</label>
                      <input type="text" className={styles.formInput} placeholder="e.g., 50" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Organizer</label>
                      <select className={styles.formSelect}><option>Enter organizer name</option></select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Registration Required</label>
                      <select className={styles.formSelect}><option>Select option</option></select>
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Event Type</label>
                    <select className={styles.formSelect}><option>Paid</option></select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Payment Mode</label>
                    <select className={styles.formSelect}><option>Upi</option></select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '12px', color: '#4B5563' }}>Upi ID</label>
                    <select className={styles.formSelect}><option>johndoe@okic.in</option></select>
                  </div>

                </div>
                <div className={styles.modalFooter}>
                  <button className={styles.btnSecondary} onClick={closeModal}>Cancel</button>
                  <button className={styles.btnPrimary}>Create Event</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
