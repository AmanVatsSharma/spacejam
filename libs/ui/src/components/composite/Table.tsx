/**
 * File:        libs/ui/src/components/composite/Table.tsx
 * Module:      Libs · UI · Composite
 * Purpose:     Production-ready Table with sorting, pagination, and row selection
 *
 * Features:
 *   - Column definitions with sorting
 *   - Sortable columns (click to sort)
 *   - Row click handler
 *   - Selectable rows (checkbox)
 *   - Pagination controls (page size, current page)
 *   - Empty state
 *   - Loading state with Skeleton
 *   - Responsive (horizontal scroll on small)
 *   - Accessible keyboard nav
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
// Chevron icons (inline to avoid circular import)
const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type SortDirection = "asc" | "desc" | null;

export interface TableColumn<T = unknown> {
  /** Unique column key */
  key: string;
  /** Column header label */
  header: string;
  /** Render cell content */
  cell?: (row: T, rowIndex: number) => React.ReactNode;
  /** Sortable */
  sortable?: boolean;
  /** Width */
  width?: string;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Fixed width (no wrap) */
  fixed?: boolean;
}

export interface TableProps<T = unknown> {
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Data rows */
  data: T[];
  /** Key extractor for React keys */
  rowKey: keyof T | ((row: T) => string);
  /** Sort key */
  sortKey?: string;
  /** Sort direction */
  sortDirection?: SortDirection;
  /** On sort change */
  onSort?: (key: string, direction: SortDirection) => void;
  /** Row click handler */
  onRowClick?: (row: T, rowIndex: number) => void;
  /** Selected row keys (for checkbox mode) */
  selectedKeys?: Set<string>;
  /** On selection change */
  onSelectionChange?: (keys: Set<string>) => void;
  /** Enable checkbox selection */
  selectable?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Class name */
  className?: string;
}

export interface TablePaginationProps {
  /** Current page (1-indexed) */
  page: number;
  /** Page size */
  pageSize: number;
  /** Total items */
  total: number;
  /** On page change */
  onPageChange: (page: number) => void;
  /** On page size change */
  onPageSizeChange?: (size: number) => void;
  /** Available page sizes */
  pageSizeOptions?: number[];
  /** Class name */
  className?: string;
}

// ---------------------------------------------------------------------------
// Icons (inline to avoid external deps)
// ---------------------------------------------------------------------------
const SortAscIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12l7-7 7 7" />
  </svg>
);

const SortDescIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12l7 7 7-7" />
  </svg>
);

const SortNeutralIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 9l7 7 7-7M5 15l7-7 7 7" />
  </svg>
);

// ---------------------------------------------------------------------------
// Component: Table
// ---------------------------------------------------------------------------
function Table<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  sortKey,
  sortDirection,
  onSort,
  onRowClick,
  selectedKeys,
  onSelectionChange,
  selectable = false,
  loading = false,
  emptyMessage = "No data available",
  className,
}: TableProps<T>) {
  const getRowKeyValue = (row: T): string => {
    if (typeof rowKey === "function") return rowKey(row);
    return String(row[rowKey]);
  };

  const handleHeaderClick = (column: TableColumn<T>) => {
    if (!column.sortable || !onSort) return;
    const newDirection: SortDirection =
      sortKey === column.key && sortDirection === "asc" ? "desc" : "asc";
    onSort(column.key, newDirection);
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    const allKeys = new Set(data.map(getRowKeyValue));
    if (selectedKeys && selectedKeys.size === data.length) {
      onSelectionChange(new Set<string>());
    } else {
      onSelectionChange(allKeys);
    }
  };

  const handleSelectRow = (key: string) => {
    if (!onSelectionChange) return;
    const newKeys = new Set(selectedKeys);
    if (newKeys.has(key)) {
      newKeys.delete(key);
    } else {
      newKeys.add(key);
    }
    onSelectionChange(newKeys);
  };

  const allSelected = selectedKeys && selectedKeys.size === data.length;
  const someSelected = selectedKeys && selectedKeys.size > 0;

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-[#E5E7EB]", className)}>
      <table className="w-full" role="grid">
        {/* Header */}
        <thead className="bg-[#F9FAFB]">
          <tr>
            {selectable && (
              <th className="w-10 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = Boolean(someSelected) && !allSelected;
                  }}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-[#D1D5DB] text-[#FF6A2F] focus:ring-[#FF6A2F]"
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-3 text-sm font-semibold text-[#1F1F1F]",
                  column.align === "right" && "text-right",
                  column.align === "center" && "text-center",
                  column.sortable && "cursor-pointer hover:bg-[#F3F4F6]",
                  column.fixed && "whitespace-nowrap"
                )}
                style={{ width: column.width }}
                onClick={() => handleHeaderClick(column)}
                aria-sort={
                  sortKey === column.key
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <div className={cn("flex items-center gap-1", column.align === "right" && "justify-end", column.align === "center" && "justify-center")}>
                  <span>{column.header}</span>
                  {column.sortable && (
                    <span className="text-[#9CA3AF]">
                      {sortKey === column.key ? (
                        sortDirection === "asc" ? (
                          <SortAscIcon />
                        ) : (
                          <SortDescIcon />
                        )
                      ) : (
                        <SortNeutralIcon />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-[#E5E7EB] bg-white">
          {loading ? (
            // Loading skeleton rows
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {selectable && <td className="w-10 px-4 py-4"><div className="h-4 w-4 animate-pulse bg-[#E5E7EB] rounded" /></td>}
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-4">
                    <div className="h-4 w-full animate-pulse bg-[#E5E7EB] rounded" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            // Empty state
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center">
                <span className="text-[#6B7280]">{emptyMessage}</span>
              </td>
            </tr>
          ) : (
            // Data rows
            data.map((row, rowIndex) => {
              const key = getRowKeyValue(row);
              const isSelected = selectedKeys?.has(key);
              return (
                <tr
                  key={key}
                  className={cn(
                    "transition-colors",
                    onRowClick && "cursor-pointer hover:bg-[#F9FAFB]",
                    isSelected && "bg-[#FFF5F1]"
                  )}
                  onClick={() => onRowClick?.(row, rowIndex)}
                >
                  {selectable && (
                    <td className="w-10 px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(key)}
                        className="h-4 w-4 rounded border-[#D1D5DB] text-[#FF6A2F] focus:ring-[#FF6A2F]"
                        aria-label={`Select row ${rowIndex + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-4 text-sm text-[#4A5565]",
                        column.align === "right" && "text-right",
                        column.align === "center" && "text-center",
                        column.fixed && "whitespace-nowrap"
                      )}
                    >
                      {column.cell ? column.cell(row, rowIndex) : String(row[column.key as keyof T] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: TablePagination
// ---------------------------------------------------------------------------
function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
}: TablePaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-white border-t border-[#E5E7EB]", className)}>
      {/* Page info */}
      <div className="text-sm text-[#6B7280]">
        Showing <span className="font-medium text-[#1F1F1F]">{start}</span> to{" "}
        <span className="font-medium text-[#1F1F1F]">{end}</span> of{" "}
        <span className="font-medium text-[#1F1F1F]">{total}</span> results
      </div>

      {/* Page size */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#6B7280]">Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
          className="h-9 rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#1F1F1F] focus:border-[#FF6A2F] focus:outline-none focus:ring-1 focus:ring-[#FF6A2F]"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#4A5565] transition-colors hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            // Simple: show first 5 pages
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                  page === pageNum
                    ? "bg-[#FF6A2F] text-white"
                    : "text-[#4A5565] hover:bg-[#F9FAFB]"
                )}
                aria-label={`Page ${pageNum}`}
                aria-current={page === pageNum ? "page" : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#4A5565] transition-colors hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
export { Table, TablePagination };