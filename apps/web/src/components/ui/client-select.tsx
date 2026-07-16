"use client";

/**
 * File:        apps/web/src/components/ui/client-select.tsx
 * Module:      Web · UI · ClientSelect
 * Purpose:     Reusable searchable customer picker. Fetches all customers
 *              via GET_CUSTOMERS and provides a dropdown with search.
 *              Used across deposits, invoices, contracts, and any form
 *              that needs to link an entity to an existing customer.
 *
 * Emits:       { id, name, email, phone, company } via onChange
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-16
 */

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { GET_CUSTOMERS } from "@/lib/apollo/operations";

export interface SelectedClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

interface ClientSelectProps {
  value?: string; // selected customer ID
  onChange: (client: SelectedClient | null) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export function ClientSelect({
  value,
  onChange,
  placeholder = "Search and select a client...",
  required = false,
  error,
  className = "",
}: ClientSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const { data, loading } = useQuery<{ customers: any[] }>(GET_CUSTOMERS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const customers = data?.customers ?? [];

  // Find selected customer object
  const selected = value ? customers.find((c) => c.id === value) : null;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search.trim()
    ? customers.filter((c) => {
        const q = search.toLowerCase();
        return (
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q)
        );
      })
    : customers;

  const handleSelect = (customer: any) => {
    onChange({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
    });
    setOpen(false);
    setSearch("");
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      {/* Selected display or search input */}
      {selected && !open ? (
        <div className="flex items-center justify-between px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] border border-transparent">
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{selected.name}</span>
            {selected.email && (
              <span className="text-[12px] text-gray-500">{selected.email}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => { onChange(null); }}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <input
          type="text"
          placeholder={loading ? "Loading clients..." : placeholder}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className={`w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border transition-all duration-200 ${error ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-[#FF6A2F]'}`}
          required={required}
        />
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[280px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-[13px] text-gray-400">
              {loading ? "Loading..." : "No clients found. Add a client first."}
            </div>
          ) : (
            filtered.slice(0, 50).map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => handleSelect(customer)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 flex items-center justify-between gap-3"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-medium text-gray-900 truncate">{customer.name}</span>
                  <span className="text-[12px] text-gray-500 truncate">
                    {customer.email || customer.phone || "No contact info"}
                  </span>
                </div>
                {customer.company && (
                  <span className="text-[12px] text-gray-400 shrink-0">{customer.company}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {error && <span className="text-[12px] text-red-500 mt-1 block">{error}</span>}
    </div>
  );
}
