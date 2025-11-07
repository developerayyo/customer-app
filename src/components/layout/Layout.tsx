import { ReactNode, useState } from 'react';
import { MobileTabBar } from './MobileTabBar';
import { Sidebar } from './Sidebar';
import { Toaster } from '../ui/sonner';
import { FAB } from './FAB';

interface LayoutProps {
  children: ReactNode;
  onCreateOrder?: () => void;
  onCreatePayment?: () => void;
  showFab?: boolean;
  fabAction?: 'order' | 'payment';
}

export function Layout({ children, onCreateOrder, onCreatePayment, showFab = false, fabAction = 'order' }: LayoutProps) {
  const handleFabClick = () => {
    if (fabAction === 'payment' && onCreatePayment) {
      onCreatePayment();
    } else if (onCreateOrder) {
      onCreateOrder();
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      
      {/* Layout */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-0 max-sm:mb-[65px]!">
          {children}
        </main>
      </div>

      {/* Mobile Tab Bar */}
      <MobileTabBar onMenuClick={() => setSidebarOpen(true)}/>

      {/* Floating Action Button */}
      {showFab && (
        <FAB onClick={ () => handleFabClick()} label="Create Order" />
      )}
    </div>
  );
}
