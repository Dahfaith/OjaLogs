import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { TopBar } from './components/shell/TopBar';
import { BottomTabBar } from './components/shell/BottomTabBar';
import { CartDrawer } from './components/cart/CartDrawer';
import { SupportDrawer } from './components/support/SupportDrawer';
import { FloatingSupport } from './components/support/FloatingSupport';
import { Toast } from './components/feedback/Toast';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { VirtualNumbersPage } from './pages/VirtualNumbersPage';
import { WalletPage } from './pages/WalletPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

export const App: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-oj-bg dark:bg-oj-dark-bg text-oj-midnight dark:text-oj-dark-text flex flex-col font-sans transition-colors duration-200">
      {/* Top Bar */}
      <TopBar onOpenCart={() => setIsCartOpen(true)} />

      {/* Main Page Body */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/virtual-numbers" element={<VirtualNumbersPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Support & Abuse Reporting Drawer */}
      <SupportDrawer />

      {/* Floating Support Button */}
      <FloatingSupport />

      {/* Mobile Bottom Tab Bar */}
      <BottomTabBar />

      {/* Global Toast */}
      <Toast />
    </div>
  );
};

export default App;

