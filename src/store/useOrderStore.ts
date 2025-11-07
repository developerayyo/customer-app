import { create } from 'zustand';
import { createSalesOrder, getSalesOrders, getSalesOrderDetails } from '../api/erpnextApi';

interface OrderItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
}

interface OrderState {
  selectedWarehouse: string | null;
  selectedPlant: string | null;
  items: OrderItem[];
  isLoading: boolean;
  error: string | null;
  orders: any[];
  currentOrder: any | null;
  totalOrders?: number;
  page?: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  fromDate?: string;
  toDate?: string;
  status?: string;
  moreItemAvailable?: boolean;

  setWarehouse: (warehouse: string) => void;
  setPlant: (plant: string) => void;
  addItem: (item: OrderItem) => void;
  removeItem: (itemCode: string) => void;
  updateItemQuantity: (itemCode: string, qty: number) => void;
  clearItems: () => void;
  submitOrder: (customer: string) => Promise<any>;
  fetchOrders: (customer: string) => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setStatus: (status: string) => void;
  setSearch: (q: string) => void;
  setSort: (field: string, order: 'asc' | 'desc') => void;
  setDateRange: (from?: string, to?: string) => void;
  fetchOrderDetails: (name: string) => Promise<void>;
}

const useOrderStore = create<OrderState>((set, get) => ({
  selectedWarehouse: null,
  selectedPlant: null,
  items: [],
  isLoading: false,
  error: null,
  orders: [],
  currentOrder: null,
  totalOrders: 0,
  page: 1,
  pageSize: 20,
  search: '',
  sortBy: 'creation',
  sortOrder: 'desc',
  fromDate: undefined,
  toDate: undefined,
  status: "all",
  moreItemAvailable: false,
  
  setWarehouse: (warehouse) => set({ selectedWarehouse: warehouse }),
  setPlant: (plant) => set({ selectedPlant: plant }),
  
  addItem: (item) => {
    const { items } = get();
    const existingItemIndex = items.findIndex(i => i.item_code === item.item_code);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...items];
      const existingItem = updatedItems[existingItemIndex];
      updatedItems[existingItemIndex] = {
        ...existingItem,
        qty: existingItem.qty + item.qty,
        amount: (existingItem.qty + item.qty) * existingItem.rate
      };
      set({ items: updatedItems });
    } else {
      // Add new item
      set({ items: [...items, item] });
    }
  },
  
  removeItem: (itemCode) => {
    const { items } = get();
    set({ items: items.filter(item => item.item_code !== itemCode) });
  },
  
  updateItemQuantity: (itemCode, qty) => {
    const { items } = get();
    const updatedItems = items.map(item => {
      if (item.item_code === itemCode) {
        return {
          ...item,
          qty,
          amount: qty * item.rate
        };
      }
      return item;
    });
    set({ items: updatedItems });
  },
  
  clearItems: () => set({ items: [] }),
  
  submitOrder: async (customer) => {
    const { items, selectedWarehouse, selectedPlant } = get();
    
    if (!customer) {
      set({ error: 'Missing customer. Please log in and try again.' });
      return null;
    }
    if (!selectedWarehouse || items.length === 0) {
      set({ error: 'Please select a warehouse, plant and add items to your order' });
      return null;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const orderData = {
        doctype: 'Sales Order',
        customer,
        transaction_date: new Date().toISOString().split('T')[0],
        delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        set_warehouse: selectedWarehouse,
        custom_plant: selectedPlant,
        selling_price_list: selectedWarehouse,
        currency: 'NGN',
        items: items.map(item => ({
          item_code: item.item_code,
          qty: item.qty,
          rate: item.rate
        }))
      };
      
      const payload = await createSalesOrder(orderData);
      const resultDoc = payload?.data || payload;
      set({ isLoading: false });
      return resultDoc;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to submit order' 
      });
      return null;
    }
  },
  
  fetchOrders: async (customer) => {
    const { page, pageSize, search, sortBy, sortOrder, fromDate, toDate, status } = get();
    set({ isLoading: true, error: null });
    const docstatusIn = status === "all" ? [0, 1] : [Number(status)];
    try {
      const response = await getSalesOrders(customer, {
        page,
        pageSize,
        sortBy,
        sortOrder,
        search,
        fromDate,
        toDate,
        docstatusIn
      });
      const payload = response?.data ?? response;
      const rows = payload?.data ?? payload ?? [];
      set((state) => {
        const newOrders = page === 1 ? rows : [...state.orders, ...rows];
        return {
          orders: newOrders,
          isLoading: false,
          totalOrders: newOrders.length,
          moreItemAvailable: rows.length >= pageSize,
        };
      });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch orders' 
      });
    }
  },

  setPage: (page) => set({ page }),
  setStatus: (status) => set({ status }),
  setPageSize: (size) => set({ pageSize: size }),
  setSearch: (q) => set({ search: q, page: 1 }),
  setSort: (field, order) => set({ sortBy: field, sortOrder: order, page: 1 }),
  setDateRange: (from, to) => set({ fromDate: from, toDate: to, page: 1 }),
  
  fetchOrderDetails: async (name) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getSalesOrderDetails(name);
      set({ currentOrder: response.data, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch order details' 
      });
    }
  }
}));

export default useOrderStore;
