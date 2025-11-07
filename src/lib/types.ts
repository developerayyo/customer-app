// Core types for LordsMint portal
export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  items: number;
  productName?: string;
  category?: string;
  notes?: string;
  warehouse?: string;
  deliveryAddress?: string;
  receiptUrl?: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  date: string;
  amount: number;
  method: "card" | "bank" | "wallet";
  status: "completed" | "pending" | "failed";
  orderNumber?: string;
  receiptUrl?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface PriceListItem {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  warehouse: string;
  inStock: boolean;
}

export interface Complaint {
  id: string;
  subject: string;
  description: string;
  date: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  imageUrl?: string;
}
