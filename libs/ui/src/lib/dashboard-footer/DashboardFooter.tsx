/**
 * File:        libs/ui/src/lib/dashboard-footer/DashboardFooter.tsx
 * Module:      UI · Dashboard Footer
 * Purpose:     Footer component from Figma design
 *
 * Exports:
 *   - DashboardFooter — footer component with user info
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

"use client";

import React from 'react';
import styles from './DashboardFooter.module.css';

interface DashboardFooterProps {
  userName?: string;
  userRole?: string;
}

export default function DashboardFooter({ userName = 'Rahul', userRole = 'Admin' }: DashboardFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.userInfo}>
        <div className={styles.avatar}>
          {userName.charAt(0)}
        </div>
        <div className={styles.details}>
          <div className={styles.name}>{userName}</div>
          <div className={styles.role}>{userRole}</div>
        </div>
      </div>
    </footer>
  );
}