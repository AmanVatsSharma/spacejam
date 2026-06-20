/**
 * File:        libs/ui/src/lib/customer-table/CustomerTable.tsx
 * Module:      UI · Customer Table
 * Purpose:     Customer data table component from Figma design
 *
 * Exports:
 *   - CustomerTable — customer listing table component
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

"use client";

import React from 'react';
import styles from './CustomerTable.module.css';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: string;
  lastActive: string;
  status: 'active' | 'inactive';
}

interface CustomerTableProps {
  customers?: Customer[];
}

const mockCustomers: Customer[] = [
  { id: '1', name: 'Aman Sharma', email: 'aman@example.com', phone: '+91 98765 43210', totalSpent: '₹1,25,000', lastActive: '2 mins ago', status: 'active' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@techcorp.com', phone: '+91 87654 32109', totalSpent: '₹89,000', lastActive: '1 hour ago', status: 'active' },
  { id: '3', name: 'Mike Chen', email: 'mike@startup.io', phone: '+91 76543 21098', totalSpent: '₹56,000', lastActive: '3 hours ago', status: 'active' },
  { id: '4', name: 'Priya Patel', email: 'priya@design.co', phone: '+91 65432 10987', totalSpent: '₹42,500', lastActive: '1 day ago', status: 'inactive' },
];

export default function CustomerTable({ customers = mockCustomers }: CustomerTableProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Recent Customers</h3>
        <button className={styles.viewAll}>View All</button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Total Spent</th>
            <th>Last Active</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>
                <div className={styles.customer}>
                  <div className={styles.avatar}>
                    {customer.name.charAt(0)}
                  </div>
                  <div className={styles.customerInfo}>
                    <div className={styles.name}>{customer.name}</div>
                    <div className={styles.email}>{customer.email}</div>
                  </div>
                </div>
              </td>
              <td>
                <div className={styles.amount}>{customer.totalSpent}</div>
              </td>
              <td>
                <div className={styles.lastActive}>{customer.lastActive}</div>
              </td>
              <td>
                <span className={`${styles.status} ${styles[customer.status]}`}>
                  {customer.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}