import { create } from 'zustand';
import { login as apiLogin, logout as apiLogout, findCustomerByPortalUser } from '../api/erpnextApi';

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
  isLoading: false,
  error: null,
  
  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiLogin(username, password);
      const customerDoc = await findCustomerByPortalUser(username);
      set({ 
        isAuthenticated: true, 
        user: username,
        customerName: customerDoc?.name || null,
        isLoading: false 
      });
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
        isLoading: false 
      });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Logout failed' 
      });
    }
  },
  
  checkAuth: () => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const user = localStorage.getItem('user');
    const customerName = localStorage.getItem('customer_name');
    set({ isAuthenticated, user, customerName });
  }
}));

// Export both as default and named export to support both import styles
export default useAuthStore;
export { useAuthStore };