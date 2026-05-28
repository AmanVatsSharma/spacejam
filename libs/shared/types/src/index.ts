export interface Product {
  id: string;
  name: string;
  basePrice: number;
  gstPercent: number;
  tokenEnabled: boolean;
  tokenValue: number;
}

export interface CenterFormData {
  city: string;
  branch: string;
  fullAddress: string;
  state: string;
  country: string;
  timezone: string;
  enableGst: boolean;
  legalName: string;
  tradeName: string;
  gstin: string;
  pan: string;
  gstRegistrationType: string;
  gstStateCode: string;
  invoicePrefix: string;
  currency: string;
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
