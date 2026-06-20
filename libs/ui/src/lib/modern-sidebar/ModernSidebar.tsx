/**
 * File:        libs/ui/src/lib/modern-sidebar/ModernSidebar.tsx
 * Module:      UI · Modern Sidebar
 * Purpose:     Navigation sidebar component from Figma design
 *
 * Exports:
 *   - ModernSidebar — sidebar navigation component
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './ModernSidebar.module.css';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="7" height="7" rx="1" />
        <rect x="11" y="2" width="7" height="7" rx="1" />
        <rect x="2" y="11" width="7" height="7" rx="1" />
        <rect x="11" y="11" width="7" height="7" rx="1" />
      </svg>
    ),
    href: '/dashboard',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3H17V17H3V3Z" />
        <path d="M7 7H13" />
        <path d="M7 10H13" />
        <path d="M7 13H10" />
      </svg>
    ),
    href: '/dashboard/inventory',
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="10" cy="7" r="3" />
        <path d="M4 17C4 14.24 6.69 12 10 12C13.31 12 16 14.24 16 17" strokeLinecap="round" />
      </svg>
    ),
    href: '/dashboard/crm',
  },
  {
    id: 'floors',
    label: 'Floors',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3H17V17H3V3Z" />
        <path d="M3 9H17" />
        <path d="M9 9V17" />
      </svg>
    ),
    href: '/dashboard/floors',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="10" cy="10" r="3" />
        <path d="M10 1V3M10 17V19M19 10H17M3 10H1M16.24 3.76L14.87 5.13M5.13 14.87L3.76 16.24M16.24 16.24L14.87 14.87M5.13 5.13L3.76 3.76" strokeLinecap="round" />
      </svg>
    ),
    href: '/dashboard/settings',
  },
];

export default function ModernSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#FF6A2F" />
            <path d="M8 12L11 15L16 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className={styles.logoText}>SpaceJam</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}