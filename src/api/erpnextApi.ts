import axios from 'axios';

// Environment-based token auth configuration
const API_KEY = import.meta.env.VITE_API_KEY;
const API_SECRET = import.meta.env.VITE_API_SECRET;
const IS_TOKEN_AUTH = Boolean(API_KEY && API_SECRET);

// Use the proxy URL for local development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: !IS_TOKEN_AUTH,
  // Ensure CSRF header is attached from cookie for session auth
  xsrfCookieName: 'csrf_token',
  xsrfHeaderName: 'X-Frappe-CSRF-Token',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Attach Authorization header for token-based auth in production
if (IS_TOKEN_AUTH) {
  api.defaults.headers.common['Authorization'] = `token ${API_KEY}:${API_SECRET}`;
}

// Authentication APIs
export const login = async (username: string, password: string) => {
  try {
    // If token auth is configured, bypass ERP login and authenticate locally
    if (IS_TOKEN_AUTH) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', username);
      return { message: 'Logged In', user: username };
    }

    const response = await api.post('/method/login', {
      usr: username,
      pwd: password,
    });

    // Store user info in localStorage
    if (response.data.message === 'Logged In') {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', username);
    }

    console.log('Login response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    // If token auth is configured, bypass ERP logout and clear local state only
    if (IS_TOKEN_AUTH) {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      return { message: 'Logged Out' };
    }

    const response = await api.post('/method/logout');

    // Clear localStorage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');

    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Warehouse (Location) APIs
export const getWarehouses = async (filters?: string, fields?: string, limit?: number, limitStart?: number) => {
  try {
    let url = '/resource/Warehouse';
    const params = new URLSearchParams();
    
    // Add fields parameter
    if (fields) {
      params.append('fields', fields);
    } else {
      // Default fields for warehouses
      params.append('fields', '["name", "warehouse_name", "warehouse_type", "company", "disabled", "parent_warehouse", "custom_plant"]');
    }
    
    // Add filters if provided
    if (filters) {
      params.append('filters', filters);
    } else {
      // Default filter to show only enabled warehouses
      params.append('filters', '[["disabled","=",0]]');
    }
    
    // Add pagination
    if (limit) {
      params.append('limit', limit.toString());
      params.append('limit_start', limitStart ? String(limitStart) : '0');
    }
    
    // Add ordering
    params.append('order_by', 'warehouse_name asc');
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    throw error;
  }
};

export const getWarehouseDetails = async (warehouseName: string) => {
  try {
    const response = await api.get(`/resource/Warehouse/${warehouseName}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching warehouse details:', error);
    throw error;
  }
};

// Plant APIs
export const getPlants = async (filters?: string, fields?: string, limit?: number) => {
  try {
    let url = '/resource/PLANT';
    const params = new URLSearchParams();

    // Default fields
    params.append('fields', fields || '["name"]');

    // Add filters if provided
    if (filters) {
      params.append('filters', filters);
    }

    // Add pagination
    if (limit) {
      params.append('limit', String(limit));
      params.append('limit_start', '0');
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching plants:', error);
    throw error;
  }
};

// Item APIs
export const getItems = async (filters?: string, fields?: string, limit?: number) => {
  try {
    let url = '/resource/Item';
    const params = new URLSearchParams();
    
    // Add fields parameter to fetch only necessary data
    if (fields) {
      params.append('fields', fields);
    } else {
      // Default fields for items
      params.append('fields', '["item_code", "item_name", "description", "item_group", "is_sales_item", "is_stock_item", "stock_uom", "image"]');
    }
    
    // Add filters if provided
    if (filters) {
      params.append('filters', filters);
    } else {
      // Default filter to show only sales items
      params.append('filters', '[["is_sales_item","=",1]]');
    }
    
    // Add pagination
    if (limit) {
      params.append('limit', limit.toString());
      params.append('limit_start', '0');
    }
    
    // Add ordering
    params.append('order_by', 'item_name asc');
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

export const getItemDetails = async (itemCode: string) => {
  try {
    const response = await api.get(`/resource/Item/${itemCode}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching item details:', error);
    throw error;
  }
};

// Price List APIs
export const getPriceLists = async () => {
  try {
    const response = await api.get('/resource/Price List?fields=["name", "price_list_name", "currency", "enabled"]&filters=[["enabled","=",1]]');
    return response.data;
  } catch (error) {
    console.error('Error fetching price lists:', error);
    throw error;
  }
};

export const getItemPrices = async (priceList?: string, itemCode?: string, search?: string, limit?: number, page?: number) => {
  try {
    let url = '/resource/Item Price';
    const params = new URLSearchParams();
    
    // Add fields parameter
    params.append('fields', '["name", "item_code", "item_name", "price_list", "price_list_rate", "currency", "valid_from", "valid_upto"]');
    
    // Build filters array
    const filters: any[] = [];
    
    if (priceList) {
      filters.push(['price_list', '=', priceList]);
    }
    
    if (itemCode) {
      filters.push(['item_code', '=', itemCode]);
    }
    
    if (search) {
      // Search by item_name or item_code
      filters.push(['item_name', 'like', `%${search}%`]);
    }
    
    if (filters.length > 0) {
      params.append('filters', JSON.stringify(filters));
    }
    
    // Add pagination
    const pageNum = page && page > 0 ? page : 1;
    if (limit) {
      params.append('limit', String(limit));
      params.append('limit_start', String((pageNum - 1) * limit));
    }
    
    // Add ordering
    params.append('order_by', 'item_name asc');
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching item prices:', error);
    throw error;
  }
};

export const getItemPrice = async (itemCode: string, priceList: string) => {
  try {
    const response = await getItemPrices(priceList, itemCode);
    const prices = response.data || [];
    
    // Return the most relevant price (warehouse-specific if available, otherwise general)
    if (prices.length > 0) {
      return prices[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching item price:', error);
    throw error;
  }
};

// Account APIs
export const getAccounts = async (company: string) => {
  try {
    const response = await api.get(`/resource/Account?filters=[["company","=","${company}"]]`);
    return response.data;
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }
};

// File Upload API
export const uploadFile = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/method/upload_file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// File Upload API with optional attachment to a document
export const uploadAndAttachFile = async (file: File, doctype?: string, docname?: string) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (doctype) formData.append('doctype', doctype);
    if (docname) formData.append('docname', docname);

    const response = await api.post('/method/upload_file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading and attaching file:', error);
    throw error;
  }
};

// Sales Order APIs
export const createSalesOrder = async (orderData: any) => {
  try {
    const response = await api.post('/resource/Sales Order', {
      data: orderData,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating sales order:', error);
    throw error;
  }
};

export const getSalesOrders = async (
  customer: string,
  options?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    fromDate?: string; // YYYY-MM-DD
    toDate?: string;   // YYYY-MM-DD
    docstatusIn?: number[]; // e.g. [0,1]
  }
) => {
  try {
    const params = new URLSearchParams();
    params.append('fields', JSON.stringify(["name","transaction_date","creation","status","docstatus","grand_total","currency"]));
    const filters: any[] = [["customer","=", customer]];
    if (options?.docstatusIn && options.docstatusIn.length > 0) {
      filters.push(["docstatus","in", options.docstatusIn]);
    }
    if (options?.fromDate) {
      filters.push(["transaction_date", ">=", options.fromDate]);
    }
    if (options?.toDate) {
      filters.push(["transaction_date", "<=", options.toDate]);
    }
    if (options?.search && options.search.trim().length > 0) {
      filters.push(["name","like", `%${options.search.trim()}%`]);
    }
    params.append('filters', JSON.stringify(filters));
    const sortField = options?.sortBy || 'creation';
    const sortOrder = options?.sortOrder || 'desc';
    params.append('order_by', `${sortField} ${sortOrder}`);
    const pageSize = options?.pageSize ?? 10;
    const page = options?.page ?? 1;
    const limitStart = (page - 1) * pageSize;
    params.append('limit_page_length', String(pageSize));
    params.append('limit_start', String(limitStart));
    const response = await api.get(`/resource/Sales Order?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    throw error;
  }
};

export const getSalesOrderDetails = async (name: string) => {
  try {
    const response = await api.get(`/resource/Sales Order/${name}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sales order details:', error);
    throw error;
  }
};

// Customer APIs
export const getCustomerDetails = async (name: string) => {
  try {
    const response = await api.get(`/resource/Customer/${name}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching customer details:', error);
    throw error;
  }
};

export const findCustomerByPortalUser = async (username: string) => {
  try {
    const params = new URLSearchParams();
    params.append('fields', JSON.stringify(["name"]));
    params.append('filters', JSON.stringify([["custom_user","=", username]]));
    const response = await api.get(`/resource/Customer?${params.toString()}`);
    const customers = response?.data?.data || response?.data || [];
    if (Array.isArray(customers) && customers.length > 0) {
      const name = customers[0]?.name;
      if (name) {
        localStorage.setItem('customer_name', name);
        return { name };
      }
    }
    return null;
  } catch (error) {
    console.error('Error mapping customer by custom_user:', error);
    return null;
  }
};

// Related documents lookups for timeline
export const getDeliveryNotesForOrder = async (salesOrderName: string) => {
  try {
    // Use child table dotted path (items.against_sales_order) for Delivery Note, include posting_time and creation
    const params = new URLSearchParams();
    params.append('fields', JSON.stringify(["name","posting_date","posting_time","creation","docstatus","status"]));
    params.append('filters', JSON.stringify([["Delivery Note Item","against_sales_order","=", salesOrderName]]));
    const response = await api.get(`/resource/Delivery Note?${params.toString()}`);
    const rows = response?.data?.data ?? response?.data ?? [];
    return rows;
  } catch (error) {
    console.error('Error fetching delivery notes for order:', error);
    throw error;
  }
};

export const getSalesInvoicesForOrder = async (salesOrderName: string) => {
  try {
    // Use child table dotted path (items.sales_order) for Sales Invoice, include posting_time and creation
    const params = new URLSearchParams();
    params.append('fields', JSON.stringify(["name","posting_date","posting_time","creation","docstatus","status"]));
    params.append('filters', JSON.stringify([["Sales Invoice Item","sales_order","=", salesOrderName]]));
    const response = await api.get(`/resource/Sales Invoice?${params.toString()}`);
    const rows = response?.data?.data ?? response?.data ?? [];
    return rows;
  } catch (error) {
    console.error('Error fetching sales invoices for order:', error);
    throw error;
  }
};

// Attachments for a document
export const getAttachments = async (doctype: string, docname: string) => {
  try {
    const response = await api.get(`/resource/File?fields=["name","file_name","file_url","attached_to_doctype","attached_to_name"]&filters=[["attached_to_doctype","=","${doctype}"],["attached_to_name","=","${docname}"]]`);
    const rows = response?.data?.data ?? response?.data ?? [];
    return rows;
  } catch (error) {
    console.error('Error fetching attachments:', error);
    throw error;
  }
};

// Download Delivery Note PDF
export const downloadDeliveryNotePdf = async (name: string, format = 'Waybill.') => {
  try {
    const url = `/method/frappe.utils.print_format.download_pdf?doctype=${encodeURIComponent('Delivery Note')}&name=${encodeURIComponent(name)}&format=${encodeURIComponent(format)}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data as Blob;
  } catch (error) {
    console.error('Error downloading delivery note PDF:', error);
    throw error;
  }
};

// Invoice APIs
export const getSalesInvoices = async (
  customer: string,
  options?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    fromDate?: string; // YYYY-MM-DD
    toDate?: string;   // YYYY-MM-DD
    docstatusIn?: number[]; // e.g. [0,1]
  }
) => {
  try {
    const params = new URLSearchParams();
    params.append('fields', JSON.stringify(["name","posting_date","due_date","grand_total","currency","docstatus"]));
    const filters: any[] = [["customer","=", customer]];
    if (options?.docstatusIn && options.docstatusIn.length > 0) {
      filters.push(["docstatus","in", options.docstatusIn]);
    }
    if (options?.fromDate) {
      filters.push(["posting_date", ">=", options.fromDate]);
    }
    if (options?.toDate) {
      filters.push(["posting_date", "<=", options.toDate]);
    }
    if (options?.search && options.search.trim().length > 0) {
      filters.push(["name","like", `%${options.search.trim()}%`]);
    }
    params.append('filters', JSON.stringify(filters));
    const sortField = options?.sortBy || 'creation';
    const sortOrder = options?.sortOrder || 'desc';
    params.append('order_by', `${sortField} ${sortOrder}`);
    const pageSize = options?.pageSize ?? 10;
    const page = options?.page ?? 1;
    const limitStart = (page - 1) * pageSize;
    params.append('limit_page_length', String(pageSize));
    params.append('limit_start', String(limitStart));
    const response = await api.get(`/resource/Sales Invoice?${params.toString()}`);
    const rows = response?.data?.data ?? response?.data ?? [];
    return rows;
  } catch (error) {
    console.error('Error fetching sales invoices:', error);
    throw error;
  }
};

export const downloadInvoicePdf = async (name: string, format: string = 'Sales Invoice') => {
  try {
    const url = `/method/frappe.utils.print_format.download_pdf?doctype=${encodeURIComponent('Sales Invoice')}&name=${encodeURIComponent(name)}&format=${encodeURIComponent(format)}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data as Blob;
  } catch (error) {
    console.error('Error downloading invoice PDF:', error);
    throw error;
  }
};

// Complaint/Feedback APIs
export const submitComplaint = async (complaintData: any) => {
  try {
    const response = await api.post('/resource/Customer Complaints', {
      doc: complaintData,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error submitting complaint:', error);
    throw error;
  }
};

export const submitFeedback = async (feedbackData: any) => {
  try {
    const response = await api.post('/resource/Customer Feedback', {
      doc: feedbackData,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};

export const submitReturn = async (returnData: any) => {
  try {
    const response = await api.post('/resource/Sales Return Request', {
      doc: returnData,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error submitting return request:', error);
    throw error;
  }
};

// News API
export const getNews = async () => {
  try {
    const response = await api.get('/resource/Website News');
    return response.data;
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
};

// Utility functions for data handling
export const combineItemsWithPrices = (items: any[], prices: any[], priceList?: string) => {
  return items.map(item => {
    // Find prices for this item
    const itemPrices = prices.filter(price => price.item_code === item.item_code);
    
    // If priceList is specified, prefer that price list
    let relevantPrice = null;
    if (priceList) {
      relevantPrice = itemPrices.find(price => price.price_list === priceList);
    }
    
    // Fallback to any available price
    if (!relevantPrice && itemPrices.length > 0) {
      relevantPrice = itemPrices[0];
    }
    
    return {
      ...item,
      price: relevantPrice ? relevantPrice.price_list_rate : 0,
      currency: relevantPrice ? relevantPrice.currency : null,
      price_list: relevantPrice ? relevantPrice.price_list : null,
      valid_from: relevantPrice ? relevantPrice.valid_from : null,
      valid_upto: relevantPrice ? relevantPrice.valid_upto : null,
      warehouse: relevantPrice ? relevantPrice.warehouse : null
    };
  });
};

// Search and filter utilities
export const searchItems = async (searchTerm: string, priceList?: string) => {
  try {
    const pricesResponse = await getItemPrices(priceList, undefined, searchTerm, 50);
    const prices = pricesResponse.data || [];
    return prices.map((p: any) => ({
      item_code: p.item_code,
      item_name: p.item_name,
      price: p.price_list_rate,
      currency: p.currency,
      price_list: p.price_list,
      valid_from: p.valid_from,
      valid_upto: p.valid_upto
    }));
  } catch (error) {
    console.error('Error searching items:', error);
    throw error;
  }
};

// Stock balance API
export const getStockBalance = async (itemCode: string, warehouse?: string) => {
  try {
    let filters = `[["item_code","=","${itemCode}"]]`;
    if (warehouse) {
      filters = `[["item_code","=","${itemCode}"],["warehouse","=","${warehouse}"]]`;
    }
    
    const response = await api.get(`/resource/Bin?fields=["item_code", "warehouse", "actual_qty", "reserved_qty", "projected_qty"]&filters=${filters}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stock balance:', error);
    throw error;
  }
};

// Item Group API
export const getItemGroups = async () => {
  try {
    const response = await api.get('/resource/Item Group?fields=["name", "item_group_name", "is_group", "parent_item_group"]&filters=[["disabled","=",0]]');
    return response.data;
  } catch (error) {
    console.error('Error fetching item groups:', error);
    throw error;
  }
};

// Company API
export const getCompanies = async () => {
  try {
    const response = await api.get('/resource/Company?fields=["name", "company_name", "default_currency", "country"]');
    return response.data;
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
};

// Payment Entry APIs
export const getPaymentEntries = async (customer: string,
  options?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    fromDate?: string; // YYYY-MM-DD
    toDate?: string;   // YYYY-MM-DD
    docstatusIn?: number[]; // typically [1]
  }
) => {
  try {
    const params = new URLSearchParams();
    params.append('fields', JSON.stringify(["name","posting_date","paid_amount","mode_of_payment","status","reference_no","docstatus","party","party_type"]));
    const filters: any[] = [["party_type","=","Customer"],["party","=", customer]];
    if (options?.docstatusIn && options.docstatusIn.length > 0) {
      filters.push(["docstatus","in", options.docstatusIn]);
    }
    // Ensure submitted by default if not provided
    if (!options?.docstatusIn) {
      filters.push(["docstatus","=",1]);
    }
    if (options?.fromDate) {
      filters.push(["posting_date", ">=", options.fromDate]);
    }
    if (options?.toDate) {
      filters.push(["posting_date", "<=", options.toDate]);
    }
    if (options?.search && options.search.trim().length > 0) {
      filters.push(["name","like", `%${options.search.trim()}%`]);
    }
    params.append('filters', JSON.stringify(filters));
    const sortField = options?.sortBy || 'creation';
    const sortOrder = options?.sortOrder || 'desc';
    params.append('order_by', `${sortField} ${sortOrder}`);
    const pageSize = options?.pageSize ?? 10;
    const page = options?.page ?? 1;
    const limitStart = (page - 1) * pageSize;
    params.append('limit_page_length', String(pageSize));
    params.append('limit_start', String(limitStart));
    const response = await api.get(`/resource/Payment Entry?${params.toString()}`);
    const rows = response?.data?.data ?? response?.data ?? [];
    return rows;
  } catch (error) {
    console.error('Error fetching payment entries:', error);
    throw error;
  }
};

export const downloadPaymentEntryPdf = async (name: string, format: string = 'Receipts') => {
  try {
    const url = `/method/frappe.utils.print_format.download_pdf?doctype=${encodeURIComponent('Payment Entry')}&name=${encodeURIComponent(name)}&format=${encodeURIComponent(format)}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data as Blob;
  } catch (error) {
    console.error('Error downloading payment receipt PDF:', error);
    throw error;
  }
};

export default api;
