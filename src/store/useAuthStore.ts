import { create } from 'zustand';
import {
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
  getCsrfToken,
  findCustomerByPortalUser,
} from '../api/erpnextApi';

interface AuthState {
  isAuthenticated: boolean;
  user: string | null;
  customerName: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

// Export as default
const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: localStorage.getItem('isAuthenticated') === 'true',
  user: localStorage.getItem('user'),
  customerName: localStorage.getItem('customer_name'),
  // Start in loading state so ProtectedRoute waits for session check
  isLoading: true,
  error: null,
  
  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiLogin(username, password);
      const user = await getCurrentUser();
      if (!user || user === 'Guest') {
        throw new Error('Login failed: no active session');
      }
      await getCsrfToken();
      const customerDoc = await findCustomerByPortalUser(username);
      set({ 
        isAuthenticated: true, 
        user: user,
        customerName: customerDoc?.name || null,
        isLoading: false 
      });
      try {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', user);
        if (customerDoc?.name) localStorage.setItem('customer_name', customerDoc.name);
      } catch {}
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      });
    }
  },
  
  logout: async () => {
    set({ isLoading: true });
    try {
      await apiLogout();
      set({ 
        isAuthenticated: false, 
        user: null,
        customerName: null,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Logout failed' 
      });
    }
  },
  
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const user = await getCurrentUser();
      if (user) {
        let customerName = localStorage.getItem('customer_name');
        if (!customerName) {
          try {
            const customerDoc = await findCustomerByPortalUser(user);
            customerName = customerDoc?.name || null;
            if (customerName) localStorage.setItem('customer_name', customerName);
          } catch {}
        }
        set({ isAuthenticated: true, user, customerName, isLoading: false });
        try {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('user', user);
        } catch {}
      } else {
        set({ isAuthenticated: false, user: null, customerName: null, isLoading: false });
        try {
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('user');
          localStorage.removeItem('customer_name');
        } catch {}
      }
    } catch (error) {
      set({ isAuthenticated: false, user: null, customerName: null, isLoading: false });
    }
  }
}));

// Export both as default and named export to support both import styles
export default useAuthStore;
export { useAuthStore };