import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Moon,
  Sun,
  Lock,
  AlertTriangle,
  Clock,
  Sparkles,
  Database,
  CloudCheck,
  CloudOff,
} from 'lucide-react';

export default function Header({ currentView, onOpenMobileMenu }) {
  const { darkMode, toggleDarkMode, cashShift, products, supabaseConnected } = useApp();
  const [time, setTime] = useState(new Date());

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const viewTitles = {
    dashboard: 'Dashboard General & Analítica',
    pos: 'Punto de Venta Rápido (POS)',
    sales: 'Ventas Realizadas & Anulaciones',
    products: 'Administración de Productos & Stock',
    finances: 'Finanzas, Ingresos & Egresos',
    cashShift: 'Control de Turnos & Arqueo de Caja',
    customers: 'Clientes & Cuentas Corrientes (CRM)',
    suppliers: 'Proveedores & Facturas de Compra',
  };

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile Toggle Button */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* View Title */}
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-tight">
            {viewTitles[currentView] || 'KEE ONDA'}
          </h1>
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Kiosco Kee Onda · Sistema de Gestión Comercial
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Supabase Status Indicator */}
        <div
          title={supabaseConnected ? 'Conectado a la base de datos Supabase en tiempo real' : 'Esperando credenciales de Supabase en .env'}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
            supabaseConnected
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{supabaseConnected ? 'Supabase Conectado' : 'Listo para Supabase'}</span>
        </div>

        {/* Cash Status Indicator */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
            cashShift.isOpen
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${cashShift.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span>{cashShift.isOpen ? 'Caja Abierta' : 'Caja Cerrada'}</span>
        </div>

        {/* Low Stock Badge */}
        {lowStockCount > 0 && (
          <div
            title={`${lowStockCount} productos con stock bajo o agotado`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>{lowStockCount} alertas</span>
          </div>
        )}

        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-red-600" />
          <span>{time.toLocaleTimeString('es-AR')}</span>
        </div>

        {/* Dedicated NIGHT MODE TOGGLE BUTTON */}
        <button
          onClick={toggleDarkMode}
          title={darkMode ? 'Cambiar a Modo Día (Fondo Blanco)' : 'Cambiar a Modo Noche'}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all shadow-sm ${
            darkMode
              ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
              : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
          }`}
        >
          {darkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Modo Día</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline">Modo Noche</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
