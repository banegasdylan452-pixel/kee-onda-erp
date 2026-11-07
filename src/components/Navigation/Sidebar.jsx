import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Wallet,
  Users,
  Truck,
  Lock,
  LogOut,
  Moon,
  Sun,
  RotateCcw,
  Store,
  ChevronRight,
  Barcode,
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, isMobileOpen, setIsMobileOpen }) {
  const { user, logout, darkMode, toggleDarkMode, resetDemoData } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Analítico', icon: LayoutDashboard },
    { id: 'pos', label: 'Punto de Venta (POS)', icon: ShoppingCart },
    { id: 'sales', label: 'Ventas & Anulaciones', icon: Receipt },
    { id: 'products', label: 'Productos & Stock', icon: Package },
    { id: 'finances', label: 'Finanzas & Gastos', icon: Wallet },
    { id: 'cashShift', label: 'Caja & Turnos', icon: Lock },
    { id: 'customers', label: 'Clientes & Fiar (CRM)', icon: Users },
    { id: 'suppliers', label: 'Proveedores & Compras', icon: Truck },
  ];

  const handleNavClick = (id) => {
    setCurrentView(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main Left Sidebar - ROJO MÁS OSCURO (Dark Crimson / Vino Kiosco) */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#7a0c1a] dark:bg-[#3d060d] text-white flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out border-r border-[#5e0914] ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div>
          {/* Logo & Kiosk Header */}
          <div className="p-4 sm:p-5 border-b border-[#5e0914] dark:border-[#2a0409] flex items-center gap-3 bg-[#690915] dark:bg-[#31050a]">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-lg ring-2 ring-red-500/30">
              <img
                src="/logo.png"
                alt="KEE ONDA Logo"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-wider text-white">KEE ONDA</span>
              </div>
              <p className="text-[11px] text-red-200/90 font-medium truncate">
                Kiosco & Almacén ERP
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive
                      ? 'bg-white text-[#7a0c1a] shadow-lg font-extrabold translate-x-1'
                      : 'text-red-100 hover:bg-[#630a15] dark:hover:bg-[#4d0710] hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#7a0c1a]' : 'text-red-200'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#7a0c1a] font-bold" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Options & Profile */}
        <div className="p-3 border-t border-[#5e0914] dark:border-[#2a0409] space-y-2 bg-[#690915]/50 dark:bg-[#31050a]/50">
          {/* Night Mode Toggle Button inside Sidebar */}
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold bg-[#540711] hover:bg-[#44050d] text-red-100 transition-colors border border-[#6b0b17]"
          >
            <div className="flex items-center gap-2.5">
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-200" />}
              <span>{darkMode ? 'Modo Día' : 'Modo Noche'}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/30 text-red-200 font-mono">
              {darkMode ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={() => {
              if (confirm('¿Restablecer datos de demostración a valores de fábrica?')) {
                resetDemoData();
              }
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl text-[11px] font-medium text-red-200/80 hover:text-white hover:bg-[#540711] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-300" />
            <span>Restablecer Datos Demo</span>
          </button>

          {/* User Profile Card & Logout */}
          {user && (
            <div className="pt-2 border-t border-[#5e0914] flex items-center justify-between px-1">
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{user.name}</div>
                <div className="text-[10px] text-red-200/80 uppercase font-medium">{user.role}</div>
              </div>
              <button
                onClick={logout}
                title="Cerrar Sesión"
                className="p-1.5 rounded-lg bg-[#540711] hover:bg-[#44050d] text-white transition-colors border border-[#6b0b17]"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
