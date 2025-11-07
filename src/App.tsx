import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { CreateOrder } from './pages/CreateOrder';
import { OrderDetails } from './pages/OrderDetails';
import { Payments } from './pages/Payments';
import { Invoices } from './pages/Invoices';
import { InvoiceDetails } from './pages/InvoiceDetails';
import { PriceList } from './pages/PriceList';
import { Complaints } from './pages/Complaints';
import { Feedback } from './pages/Feedback';
import { News } from './pages/News';
import { Settings } from './pages/Settings';
import { ThemeProvider } from './lib/ThemeContext';
import { useEffect } from 'react';
import useAuthStore from './store/useAuthStore';
import Login from './pages/Login';
import ShareTarget from './pages/ShareTarget';
import OpenFile from './pages/OpenFile';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  if (isLoading) {
    return <div style={{ padding: 16 }}>Checking session…</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="/orders/create" element={
          <ProtectedRoute>
            <CreateOrder />
          </ProtectedRoute>
        } />
        
        <Route path="/orders/:id" element={
          <ProtectedRoute>
            <OrderDetails />
          </ProtectedRoute>
        } />
        
        <Route path="/payments" element={
          <ProtectedRoute>
            <Payments />
          </ProtectedRoute>
        } />
        
        <Route path="/invoices" element={
          <ProtectedRoute>
            <Invoices />
          </ProtectedRoute>
        } />

        <Route path="/invoices/:id" element={
          <ProtectedRoute>
            <InvoiceDetails />
          </ProtectedRoute>
        } />
        
        <Route path="/complaints" element={
          <ProtectedRoute>
            <Complaints />
          </ProtectedRoute>
        } />
        
        <Route path="/feedback" element={
          <ProtectedRoute>
            <Feedback />
          </ProtectedRoute>
        } />
        
        <Route path="/news" element={
          <ProtectedRoute>
            <News />
          </ProtectedRoute>
        } />
        
        <Route path="/price-list" element={
          <ProtectedRoute>
            <PriceList />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />

        {/* Manifest target routes */}
        <Route path="/share-target" element={
          <ProtectedRoute>
            <ShareTarget />
          </ProtectedRoute>
        } />
        <Route path="/open-file" element={
          <ProtectedRoute>
            <OpenFile />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
