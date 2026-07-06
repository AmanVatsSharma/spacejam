/**
 * File:        apps/web/src/app/layout.tsx
 * Module:      Web · Root Layout
 * Purpose:     Root layout — wires Apollo + Auth providers around the tree
/**
 * File:        apps/web/src/app/layout.tsx
 * Module:      Web · Root Layout
 * Purpose:     Root layout — wires Apollo + Auth providers around the tree
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */

import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata = {
  title: 'SpaceJam - Coworking Space Management',
  description: 'Manage your coworking space efficiently',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
