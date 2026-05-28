export interface Product {
  id: string;
  name: string;
  basePrice: number;
  gstPercent: number;
  tokenEnabled: boolean;
  tokenValue: number;
}

export interface CenterFormData {
  // Location
  city: string;
  branch: string;
  fullAddress: string;
  state: string;
  country: string;
  timezone: string;
  // Business & Tax
  enableGst: boolean;
  legalName: string;
  tradeName: string;
  gstin: string;
  pan: string;
  gstRegistrationType: string;
  gstStateCode: string;
  // Billing Defaults
  invoicePrefix: string;
  currency: string;
  // Products
  products: Product[];
}

export const initialFormData: CenterFormData = {
  city: '',
  branch: '',
  fullAddress: '',
  state: 'Punjab',
  country: 'India',
  timezone: 'Asia/Kolkata',
  enableGst: false,
  legalName: '',
  tradeName: '',
  gstin: '',
  pan: '',
  gstRegistrationType: '',
  gstStateCode: '',
  invoicePrefix: 'SJ-CHD-',
  currency: '₹ INR',
  products: [],
};
