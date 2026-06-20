/**
 * File:        apps/web/src/lib/api.ts
 * Module:      Web · API Service
 * Purpose:     API service for connecting to backend endpoints
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    target?: number;
  }>;
  paymentHealth: {
    paid: number;
    overdue: number;
    partial: number;
  };
  outstandingInvoices: number;
}

export interface OccupancyData {
  spaceType: string;
  totalSpaces: number;
  occupiedSpaces: number;
  utilizationRate: number;
}

export interface BookingData {
  id: string;
  guestName: string;
  spaceType: string;
  spaceName: string;
  checkIn: string;
  checkOut: string;
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
}

export interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  type: 'lead' | 'customer' | 'partner';
  createdAt: string;
  totalBookings?: number;
  totalSpent?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Revenue API
  async getRevenueData(): Promise<ApiResponse<RevenueData>> {
    return this.request<RevenueData>('/revenue');
  }

  async getInvoices(): Promise<ApiResponse<BookingData[]>> {
    return this.request<BookingData[]>('/invoices');
  }

  // Occupancy API
  async getOccupancyData(): Promise<ApiResponse<OccupancyData[]>> {
    return this.request<OccupancyData[]>('/occupancy');
  }

  // Bookings API
  async getBookings(): Promise<ApiResponse<BookingData[]>> {
    return this.request<BookingData[]>('/bookings');
  }

  // Customers API
  async getCustomers(): Promise<ApiResponse<CustomerData[]>> {
    return this.request<CustomerData[]>('/customers');
  }

  async getCustomerById(id: string): Promise<ApiResponse<CustomerData>> {
    return this.request<CustomerData>(`/customers/${id}`);
  }
}

export const apiService = new ApiService();

// Mock data providers for development
export const mockRevenueData: RevenueData = {
  totalRevenue: 1245000,
  monthlyRevenue: [
    { month: "Jan", revenue: 950000, target: 1000000 },
    { month: "Feb", revenue: 1100000, target: 1050000 },
    { month: "Mar", revenue: 1250000, target: 1100000 },
    { month: "Apr", revenue: 1180000, target: 1200000 },
    { month: "May", revenue: 1245000, target: 1250000 },
    { month: "Jun", revenue: 1400000, target: 1300000 },
  ],
  paymentHealth: {
    paid: 730000,
    overdue: 160000,
    partial: 110000,
  },
  outstandingInvoices: 45000,
};

export const mockOccupancyData: OccupancyData[] = [
  { spaceType: 'Private Cabins', totalSpaces: 10, occupiedSpaces: 8, utilizationRate: 80 },
  { spaceType: 'Hot Desks', totalSpaces: 20, occupiedSpaces: 14, utilizationRate: 70 },
  { spaceType: 'Meeting Rooms', totalSpaces: 5, occupiedSpaces: 4, utilizationRate: 80 },
  { spaceType: 'Dedicated Desks', totalSpaces: 15, occupiedSpaces: 9, utilizationRate: 60 },
  { spaceType: 'Event Spaces', totalSpaces: 3, occupiedSpaces: 2, utilizationRate: 67 },
];

export const mockCustomers: CustomerData[] = [
  {
    id: "CUST-001",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "+91 98765 43210",
    company: "TechCorp India",
    type: "customer",
    createdAt: "2025-01-15",
    totalBookings: 12,
    totalSpent: 125000,
  },
  {
    id: "CUST-002",
    name: "Rahul Verma",
    email: "rahul.verma@startup.com",
    phone: "+91 87654 32109",
    company: "StartupXYZ",
    type: "lead",
    createdAt: "2025-02-20",
    totalBookings: 5,
    totalSpent: 45000,
  },
  {
    id: "CUST-003",
    name: "Anita Desai",
    email: "anita.desai@designstudio.io",
    phone: "+91 76543 21098",
    company: "Design Studio",
    type: "customer",
    createdAt: "2025-03-10",
    totalBookings: 8,
    totalSpent: 68000,
  },
];

// Get mock data based on environment
export const getMockData = (type: 'revenue' | 'occupancy' | 'customers') => {
  switch (type) {
    case 'revenue':
      return mockRevenueData;
    case 'occupancy':
      return mockOccupancyData;
    case 'customers':
      return mockCustomers;
    default:
      return null;
  }
};