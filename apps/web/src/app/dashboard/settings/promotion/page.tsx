"use client";

import { useState } from "react";
import styles from "./promotion.module.css";

const Icons = {
  reset: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
      <path d="M3 3v5h5"></path>
    </svg>
  ),
  save: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
  ),
  drag: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="5" r="1"></circle>
      <circle cx="9" cy="12" r="1"></circle>
      <circle cx="9" cy="19" r="1"></circle>
      <circle cx="15" cy="5" r="1"></circle>
      <circle cx="15" cy="12" r="1"></circle>
      <circle cx="15" cy="19" r="1"></circle>
    </svg>
  ),
  monitor: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
  ),
  smartphone: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
      <line x1="12" y1="18" x2="12.01" y2="18"></line>
    </svg>
  ),
  globe: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  ),
  cake: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"></path>
      <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"></path>
      <path d="M2 21h20"></path>
      <path d="M7 8v2"></path>
      <path d="M12 8v2"></path>
      <path d="M17 8v2"></path>
      <path d="M7 4h.01"></path>
      <path d="M12 4h.01"></path>
      <path d="M17 4h.01"></path>
    </svg>
  ),
  rocket: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
    </svg>
  ),
  award: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"></circle>
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
    </svg>
  ),
  megaphone: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 14v-3z"></path>
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
    </svg>
  )
};

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState("Lobby Screens");

  // State for toggles
  const [requireAdmin, setRequireAdmin] = useState(true);
  const [autoPublish, setAutoPublish] = useState(false);
  const [showBirthdays, setShowBirthdays] = useState(true);
  const [showStartups, setShowStartups] = useState(true);
  const [showAchievements, setShowAchievements] = useState(true);
  const [showAnnouncements, setShowAnnouncements] = useState(true);
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(true);
  const [highlightFeatured, setHighlightFeatured] = useState(true);
  const [highlightPriority, setHighlightPriority] = useState(true);

  return (
    <div className={styles.pageContainer}>
      
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Promotions & Displays</h1>
          <p className={styles.pageSubtitle}>Control what users see across lobby screens and community feeds</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>{Icons.reset} Reset Default</button>
          <button className={styles.btnPrimary}>{Icons.save} Save Rules</button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        {["Lobby Screens", "Promotion Defaults", "Community Feed", "Event Display Rules"].map((tab) => (
          <button 
            key={tab} 
            className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ========================================================= */}
        {/* TAB 1: LOBBY SCREENS */}
        {/* ========================================================= */}
        {activeTab === "Lobby Screens" && (
          <>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionHeader}>Layout Configuration</h2>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Default Layout</label>
                <select className={styles.formSelect}><option>Select layout</option></select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Refresh Interval</label>
                <select className={styles.formSelect}><option>Select interval</option></select>
              </div>
              <div className={styles.formGroup}>
                <div className={styles.inputGroupFlex}>
                  <span>Content Rotation Timing</span>
                  <span>3s &nbsp;&nbsp;&nbsp;&nbsp; 8s &nbsp;&nbsp;&nbsp;&nbsp; 30s</span>
                </div>
                <input type="range" min="3" max="30" defaultValue="8" style={{ width: '100%', marginBottom: '16px' }} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Announcement Duration (seconds)</label>
                <input type="number" className={styles.formInput} defaultValue="10" />
              </div>
            </div>

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionHeader}>Content Priority</h2>
              <p className={styles.formLabel} style={{ marginBottom: '12px' }}>Drag to reorder display priority</p>
              <div className={styles.dragList}>
                <div className={styles.dragItem}><span className={styles.dragHandle}>{Icons.drag}</span> Announcements</div>
                <div className={styles.dragItem}><span className={styles.dragHandle}>{Icons.drag}</span> Promotions</div>
                <div className={styles.dragItem}><span className={styles.dragHandle}>{Icons.drag}</span> Events</div>
              </div>
            </div>

            <div className={styles.sectionCard}>
              <div className={styles.previewHeader}>
                <h2 className={styles.previewTitle}>Live Preview</h2>
                <div className={styles.previewIcons}>
                  <div className={`${styles.previewIcon} ${styles.active}`}>{Icons.monitor}</div>
                  <div className={styles.previewIcon}>{Icons.smartphone}</div>
                  <div className={styles.previewIcon}>{Icons.globe}</div>
                </div>
              </div>
              <div className={styles.lobbyPreview}>
                <div className={styles.lobbyTicker}>
                  🎉 Welcome to SpaceJam Coworking • New cafe menu available • Upcoming event: Tech Meetup - April 30
                </div>
                <div className={styles.lobbyDots}>
                  <div className={`${styles.dot} ${styles.active}`}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PROMOTION DEFAULTS */}
        {/* ========================================================= */}
        {activeTab === "Promotion Defaults" && (
          <>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionHeader}>Basic Rules</h2>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Default Expiry Duration</label>
                <select className={styles.formSelect}><option>Select duration</option></select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Banner Size Ratio</label>
                <select className={styles.formSelect}><option>Select ratio</option></select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Allowed Promotion Types</label>
                <div className={styles.pillsGroup}>
                  <div className={`${styles.pill} ${styles.active}`}>Offers</div>
                  <div className={`${styles.pill} ${styles.active}`}>Events</div>
                  <div className={`${styles.pill} ${styles.active}`}>Announcements</div>
                </div>
              </div>
            </div>

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionHeader}>Approval Settings</h2>
              <div className={styles.toggleRow}>
                <label className={styles.formLabel}>Require admin approval</label>
                <div className={`${styles.toggleSwitch} ${requireAdmin ? styles.active : ''}`} onClick={() => setRequireAdmin(!requireAdmin)}>
                  <div className={styles.toggleKnob}></div>
                </div>
              </div>
              <div className={styles.toggleRow}>
                <label className={styles.formLabel}>Auto-publish</label>
                <div className={`${styles.toggleSwitch} ${autoPublish ? styles.active : ''}`} onClick={() => setAutoPublish(!autoPublish)}>
                  <div className={styles.toggleKnob}></div>
                </div>
              </div>
            </div>

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionHeader}>Media Rules</h2>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Max file size (MB)</label>
                <input type="number" className={styles.formInput} defaultValue="5" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Allowed formats</label>
                <div className={styles.pillsGroup}>
                  <div className={`${styles.pill} ${styles.active}`}>PNG</div>
                  <div className={`${styles.pill} ${styles.active}`}>JPG</div>
                  <div className={`${styles.pill} ${styles.inactive}`}>MP4</div>
                </div>
              </div>
            </div>

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionHeader}>Live Preview</h2>
              <div className={styles.bannerPreview}>
                <div className={styles.bannerBadge}>Pending Approval</div>
                <h3 className={styles.bannerTitle}>20% Off Coffee</h3>
                <p className={styles.bannerDesc}>Valid this week only</p>
                <button className={styles.bannerBtn}>Claim Offer</button>
              </div>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* TAB 3: COMMUNITY FEED */}
        {/* ========================================================= */}
        {activeTab === "Community Feed" && (
          <>
            <div className={styles.grid2}>
              {/* Birthdays */}
              <div className={styles.sectionCard} style={{ marginBottom: 0 }}>
                <div className={styles.toggleRow}>
                  <h2 className={styles.sectionHeader} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#FF7847' }}>{Icons.cake}</span> Birthdays
                  </h2>
                  <div className={`${styles.toggleSwitch} ${showBirthdays ? styles.active : ''}`} onClick={() => setShowBirthdays(!showBirthdays)}>
                    <div className={styles.toggleKnob}></div>
                  </div>
                </div>
                <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.formLabel}>Frequency</label>
                  <select className={styles.formSelect}><option>Select frequency</option></select>
                </div>
              </div>

              {/* Startup Spotlights */}
              <div className={styles.sectionCard} style={{ marginBottom: 0 }}>
                <div className={styles.toggleRow}>
                  <h2 className={styles.sectionHeader} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#FF7847' }}>{Icons.rocket}</span> Startup Spotlights
                  </h2>
                  <div className={`${styles.toggleSwitch} ${showStartups ? styles.active : ''}`} onClick={() => setShowStartups(!showStartups)}>
                    <div className={styles.toggleKnob}></div>
                  </div>
                </div>
                <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.formLabel}>Frequency</label>
                  <select className={styles.formSelect}><option>Select frequency</option></select>
                </div>
              </div>

              {/* Achievements */}
              <div className={styles.sectionCard} style={{ marginBottom: 0 }}>
                <div className={styles.toggleRow}>
                  <h2 className={styles.sectionHeader} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#FF7847' }}>{Icons.award}</span> Achievements
                  </h2>
                  <div className={`${styles.toggleSwitch} ${showAchievements ? styles.active : ''}`} onClick={() => setShowAchievements(!showAchievements)}>
                    <div className={styles.toggleKnob}></div>
                  </div>
                </div>
                <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.formLabel}>Frequency</label>
                  <select className={styles.formSelect}><option>Select frequency</option></select>
                </div>
              </div>

              {/* Announcements */}
              <div className={styles.sectionCard} style={{ marginBottom: 0 }}>
                <div className={styles.toggleRow}>
                  <h2 className={styles.sectionHeader} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#FF7847' }}>{Icons.megaphone}</span> Announcements
                  </h2>
                  <div className={`${styles.toggleSwitch} ${showAnnouncements ? styles.active : ''}`} onClick={() => setShowAnnouncements(!showAnnouncements)}>
                    <div className={styles.toggleKnob}></div>
                  </div>
                </div>
                <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.formLabel}>Frequency</label>
                  <select className={styles.formSelect}><option>Select frequency</option></select>
                </div>
              </div>
            </div>

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionHeader}>Live Preview</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#F9FAFB', padding: '16px', borderRadius: '12px' }}>
                
                <div className={styles.feedCard}>
                  <div className={styles.feedIcon}>{Icons.cake}</div>
                  <div className={styles.feedContent}>
                    <h4 className={styles.feedTitle}>Birthday Today!</h4>
                    <p className={styles.feedDesc}>Sarah Chen is celebrating their birthday</p>
                    <span className={styles.feedTime}>2 hours ago</span>
                  </div>
                </div>

                <div className={styles.feedCard}>
                  <div className={styles.feedIcon}>{Icons.rocket}</div>
                  <div className={styles.feedContent}>
                    <h4 className={styles.feedTitle}>Startup Spotlight</h4>
                    <p className={styles.feedDesc}>TechFlow raises $2M in seed funding</p>
                    <span className={styles.feedTime}>5 hours ago</span>
                  </div>
                </div>

                <div className={styles.feedCard}>
                  <div className={styles.feedIcon}>{Icons.award}</div>
                  <div className={styles.feedContent}>
                    <h4 className={styles.feedTitle}>Achievement Unlocked</h4>
                    <p className={styles.feedDesc}>John Doe completed 100 hours at SpaceJam</p>
                    <span className={styles.feedTime}>1 day ago</span>
                  </div>
                </div>

                <div className={styles.feedCard}>
                  <div className={styles.feedIcon}>{Icons.megaphone}</div>
                  <div className={styles.feedContent}>
                    <h4 className={styles.feedTitle}>Announcement</h4>
                    <p className={styles.feedDesc}>New meeting rooms now available on Floor 3</p>
                    <span className={styles.feedTime}>2 days ago</span>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* TAB 4: EVENT DISPLAY RULES */}
        {/* ========================================================= */}
        {activeTab === "Event Display Rules" && (
          <>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionHeader}>Visibility</h2>
              <div className={styles.toggleRow}>
                <label className={styles.formLabel}>Show upcoming events only</label>
                <div className={`${styles.toggleSwitch} ${showUpcomingOnly ? styles.active : ''}`} onClick={() => setShowUpcomingOnly(!showUpcomingOnly)}>
                  <div className={styles.toggleKnob}></div>
                </div>
              </div>
              <div className={styles.toggleRow}>
                <label className={styles.formLabel}>Highlight featured events</label>
                <div className={`${styles.toggleSwitch} ${highlightFeatured ? styles.active : ''}`} onClick={() => setHighlightFeatured(!highlightFeatured)}>
                  <div className={styles.toggleKnob}></div>
                </div>
              </div>
            </div>

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionHeader}>Visibility Rules</h2>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Show to</label>
                <select className={styles.formSelect}><option>Select audience</option></select>
              </div>
              <div className={styles.toggleRow} style={{ marginTop: '16px' }}>
                <label className={styles.formLabel}>Highlight priority posts</label>
                <div className={`${styles.toggleSwitch} ${highlightPriority ? styles.active : ''}`} onClick={() => setHighlightPriority(!highlightPriority)}>
                  <div className={styles.toggleKnob}></div>
                </div>
              </div>
            </div>

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionHeader}>Display Settings</h2>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Max events per screen</label>
                <input type="number" className={styles.formInput} defaultValue="3" />
              </div>
            </div>

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionHeader}>Timing Rules</h2>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Show events (days before)</label>
                <input type="number" className={styles.formInput} defaultValue="7" />
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
