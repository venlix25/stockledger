// Supabase Database Types
export type InvoiceStatus = 'paid' | 'pending' | 'overdue';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  user_id: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer?: Customer;
  amount: number;
  status: InvoiceStatus;
  due_date: string;
  notes?: string;
  user_id: string;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  invoice?: Invoice;
  customer_id: string;
  customer?: Customer;
  amount: number;
  payment_date: string;
  method?: string;
  notes?: string;
  user_id: string;
  created_at: string;
}

export interface DashboardStats {
  totalOutstanding: number;
  paidThisMonth: number;
  totalInvoices: number;
  pendingCount: number;
  paidCount: number;
}
