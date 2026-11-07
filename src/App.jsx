import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Auth/Login';
import Sidebar from './components/Navigation/Sidebar';
import Header from './components/Navigation/Header';
import DashboardView from './components/Dashboard/DashboardView';
import PosView from './components/POS/PosView';
import SalesHistoryView from './components/Sales/SalesHistoryView';
import ProductsView from './components/Products/ProductsView';
import FinancesView from './components/Finances/FinancesView';
import CashShiftView from './components/CashShift/CashShiftView';
import CustomersView from './components/Customers/CustomersView';
import SuppliersView from './components/Suppliers/SuppliersView';

function MainApp() {
  const { user } = useApp();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // If user is not logged in, show Login view
  if (!user) {
    return <Login />;
  }

  // Render view component
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'pos':
        return <PosView />;
      case 'sales':
        return <SalesHistoryView />;
      case 'products':
        return <ProductsView />;
      case 'finances':
        return <FinancesView onNavigateToSales={() => setCurrentView('sales')} />;
      case 'cashShift':
        return <CashShiftView />;
      case 'customers':
        return <CustomersView />;
      case 'suppliers':
        return <SuppliersView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Left Sidebar (Dark Crimson RED) */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area (WHITE in normal mode, dark in night mode) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-slate-950">
        <Header
          currentView={currentView}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/40 dark:bg-slate-950/40">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
