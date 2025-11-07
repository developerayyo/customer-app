import { Order, Payment, Invoice, PriceListItem, Complaint, NewsItem } from "./types";

export const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "LM-2025-1234",
    date: "Oct 15, 2025",
    status: "delivered",
    total: 2499.99,
    items: 3,
    productName: "Premium Gold Bars",
    category: "Precious Metals",
    warehouse: "New York Vault",
    deliveryAddress: "123 Wall Street, NY",
  },
  {
    id: "2",
    orderNumber: "LM-2025-1235",
    date: "Oct 20, 2025",
    status: "shipped",
    total: 1899.50,
    items: 2,
    productName: "Silver Coins Collection",
    category: "Numismatics",
    warehouse: "London Facility",
  },
  {
    id: "3",
    orderNumber: "LM-2025-1236",
    date: "Oct 22, 2025",
    status: "processing",
    total: 4299.00,
    items: 1,
    productName: "Platinum Investment Package",
    category: "Investment",
    warehouse: "Singapore Hub",
  },
  {
    id: "4",
    orderNumber: "LM-2025-1237",
    date: "Oct 25, 2025",
    status: "pending",
    total: 845.99,
    items: 5,
    productName: "Gold Jewelry Set",
    category: "Jewelry",
    warehouse: "Dubai Center",
  },
];

export const mockPayments: Payment[] = [
  {
    id: "1",
    paymentNumber: "PAY-2025-5678",
    date: "Oct 15, 2025",
    amount: 2499.99,
    method: "card",
    status: "completed",
    orderNumber: "LM-2025-1234",
  },
  {
    id: "2",
    paymentNumber: "PAY-2025-5679",
    date: "Oct 20, 2025",
    amount: 1899.50,
    method: "bank",
    status: "completed",
    orderNumber: "LM-2025-1235",
  },
  {
    id: "3",
    paymentNumber: "PAY-2025-5680",
    date: "Oct 25, 2025",
    amount: 845.99,
    method: "wallet",
    status: "pending",
    orderNumber: "LM-2025-1237",
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV-2025-001",
    date: "Oct 1, 2025",
    dueDate: "Oct 31, 2025",
    amount: 2499.99,
    status: "paid",
    items: [
      { id: "1", name: "Premium Gold Bar 100g", quantity: 3, price: 833.33, total: 2499.99 },
    ],
  },
  {
    id: "2",
    invoiceNumber: "INV-2025-002",
    date: "Oct 15, 2025",
    dueDate: "Nov 15, 2025",
    amount: 1899.50,
    status: "pending",
    items: [
      { id: "1", name: "Silver Coin Set", quantity: 2, price: 949.75, total: 1899.50 },
    ],
  },
];

export const mockPriceList: PriceListItem[] = [
  {
    id: "1",
    name: "Gold Bar 100g",
    category: "Gold",
    price: 6250.00,
    unit: "per bar",
    warehouse: "New York Vault",
    inStock: true,
  },
  {
    id: "2",
    name: "Silver Coin (1 oz)",
    category: "Silver",
    price: 28.50,
    unit: "per coin",
    warehouse: "London Facility",
    inStock: true,
  },
  {
    id: "3",
    name: "Platinum Bar 50g",
    category: "Platinum",
    price: 1850.00,
    unit: "per bar",
    warehouse: "Singapore Hub",
    inStock: false,
  },
  {
    id: "4",
    name: "Gold Chain 18K",
    category: "Jewelry",
    price: 450.00,
    unit: "per piece",
    warehouse: "Dubai Center",
    inStock: true,
  },
];

export const mockComplaints: Complaint[] = [
  {
    id: "1",
    subject: "Delayed delivery for Order LM-2025-1234",
    description: "My order was supposed to arrive on Oct 10 but came on Oct 15",
    date: "Oct 16, 2025",
    status: "resolved",
    priority: "medium",
  },
  {
    id: "2",
    subject: "Damaged packaging",
    description: "The product arrived with damaged packaging",
    date: "Oct 22, 2025",
    status: "in-progress",
    priority: "high",
  },
];

export const mockNews: NewsItem[] = [
  {
    id: "1",
    title: "LordsMint Expands to Asian Markets",
    excerpt: "We're excited to announce our new facility in Singapore, offering faster delivery times across Asia.",
    date: "Oct 20, 2025",
    category: "Company News",
  },
  {
    id: "2",
    title: "New Gold Investment Packages Available",
    excerpt: "Explore our latest investment-grade gold packages with exclusive pricing for valued customers.",
    date: "Oct 18, 2025",
    category: "Products",
  },
  {
    id: "3",
    title: "Holiday Season Promotions",
    excerpt: "Get ready for our special holiday offers on premium jewelry and collector coins.",
    date: "Oct 15, 2025",
    category: "Promotions",
  },
];
