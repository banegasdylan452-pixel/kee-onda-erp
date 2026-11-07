import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Calendar,
  Receipt,
  Scale,
  DollarSign,
  Download,
  Trash2,
  X,
  Zap,
  Building2,
  Users,
  Truck,
  FileText,
  Sparkles,
  ArrowRight,
  ShoppingCart,
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  'Servicios (Luz)',
  'Servicios (Gas)',
  'Servicios (Internet/Tel)',
  'Alquiler',
  'Mercadería / Proveedores',
  'Sueldos / Turnos',
  'Impuestos / Tasas',
  'Mantenimiento / Limpieza',
  'Otros Gastos',
];

const INCOME_CATEGORIES = [
  'Comisiones / Servicios (SUBE, Cargas)',
  'Cobro de Cuenta Corriente',
  'Aporte de Capital',
  'Otros Ingresos',
];

export default function FinancesView({ onNavigateToSales }) {
  const { finances, addFinanceMovement, deleteFinanceMovement, sales } = useApp();

  // Tabs: 'EGRESOS' | 'INGRESOS_EXTRAS' | 'VENTAS_POS' | 'ALL'
  const [activeTab, setActiveTab] = useState('EGRESOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');
  const [dateFilter, setDateFilter] = useState('MONTH'); // 'ALL' | 'TODAY' | 'MONTH'

  // Modals state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category: EXPENSE_CATEGORIES[0],
    description: '',
    amount: '',
    paymentMethod: 'Efectivo',
    date: new Date().toISOString().split('T')[0],
  });

  // Filtered movements
  const filteredFinances = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return finances.filter((item) => {
      // Tab filter
      if (activeTab === 'EGRESOS' && item.type !== 'egreso') return false;
      if (activeTab === 'INGRESOS_EXTRAS' && (item.type !== 'ingreso' || item.category === 'Venta Kiosco')) return false;
      if (activeTab === 'VENTAS_POS' && item.category !== 'Venta Kiosco') return false;

      // Category filter
      if (categoryFilter !== 'TODAS' && item.category !== categoryFilter) return false;

      // Search term
      if (
        searchTerm &&
        !item.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !item.category.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Date filter
      if (dateFilter === 'TODAY') {
        const itemDateStr = new Date(item.date).toISOString().split('T')[0];
        if (itemDateStr !== todayStr) return false;
      } else if (dateFilter === 'MONTH') {
        const itemDate = new Date(item.date);
        if (itemDate.getMonth() !== currentMonth || itemDate.getFullYear() !== currentYear) {
          return false;
        }
      }

      return true;
    });
  }, [finances, activeTab, categoryFilter, searchTerm, dateFilter]);

  // Aggregate stats
  const totals = useMemo(() => {
    let ventasPOS = 0;
    let ingresosExtras = 0;
    let egresos = 0;
    let gastosLuz = 0;
    let alquiler = 0;

    finances.forEach((f) => {
      const amt = Number(f.amount) || 0;
      if (f.type === 'ingreso') {
        if (f.category === 'Venta Kiosco') {
          ventasPOS += amt;
        } else {
          ingresosExtras += amt;
        }
      } else if (f.type === 'egreso') {
        egresos += amt;
        if (f.category.includes('Luz')) gastosLuz += amt;
        if (f.category.includes('Alquiler')) alquiler += amt;
      }
    });

    const totalIngresos = ventasPOS + ingresosExtras;

    return {
      ventasPOS,
      ingresosExtras,
      totalIngresos,
      egresos,
      balance: totalIngresos - egresos,
      gastosLuz,
      alquiler,
    };
  }, [finances]);

  // Open Modals
  const handleOpenExpense = () => {
    setFormData({
      category: EXPENSE_CATEGORIES[0],
      description: '',
      amount: '',
      paymentMethod: 'Efectivo',
      date: new Date().toISOString().split('T')[0],
    });
    setShowExpenseModal(true);
  };

  const handleOpenIncome = () => {
    setFormData({
      category: INCOME_CATEGORIES[0],
      description: '',
      amount: '',
      paymentMethod: 'Efectivo',
      date: new Date().toISOString().split('T')[0],
    });
    setShowIncomeModal(true);
  };

  // Submit Expense
  const handleSubmitExpense = (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Ingresa un monto válido.');
      return;
    }

    addFinanceMovement({
      type: 'egreso',
      category: formData.category,
      description: formData.description || `Gasto de ${formData.category}`,
      amount: Number(formData.amount),
      paymentMethod: formData.paymentMethod,
      date: formData.date,
    });

    setShowExpenseModal(false);
  };

  // Submit Income
  const handleSubmitIncome = (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Ingresa un monto válido.');
      return;
    }

    addFinanceMovement({
      type: 'ingreso',
      category: formData.category,
      description: formData.description || `Ingreso por ${formData.category}`,
      amount: Number(formData.amount),
      paymentMethod: formData.paymentMethod,
      date: formData.date,
    });

    setShowIncomeModal(false);
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = ['ID', 'Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Método'];
    const rows = filteredFinances.map((f) => [
      f.id,
      new Date(f.date).toLocaleDateString('es-AR'),
      f.type.toUpperCase(),
      `"${f.category}"`,
      `"${f.description.replace(/"/g, '""')}"`,
      f.amount,
      f.paymentMethod,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KEE_ONDA_Finanzas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Informative Banner about the new dedicated Sales Section */}
      <div className="bg-gradient-to-r from-red-900/10 via-red-800/5 to-transparent border border-red-200 dark:border-red-900/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Ventas del POS ahora en su sección dedicada
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Para ver el detalle de cada ticket emitido o anular ventas hechas por error, utiliza la sección de <strong>Ventas & Tickets</strong>.
            </p>
          </div>
        </div>

        {onNavigateToSales && (
          <button
            onClick={onNavigateToSales}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
          >
            <span>Ir a Ventas & Anulaciones</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Finanzas & Gastos Operativos
            </h2>
            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
              Control Contable
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Control de gastos (luz, gas, alquiler, proveedores, haberes) e ingresos adicionales (SUBE, comisiones)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportToCSV}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handleOpenIncome}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ingreso Extra</span>
          </button>

          <button
            onClick={handleOpenExpense}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Gasto / Egreso</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Separated Ventas, Ingresos Extras, Egresos & Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventas POS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Ventas Kiosco (POS)
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center font-bold">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            ${totals.ventasPOS.toLocaleString('es-AR')}
          </div>
          <p className="text-xs text-slate-400 mt-1">Facturación total de mostrador</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600"></div>
        </div>

        {/* Ingresos Extras */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Ingresos Extras (SUBE, etc.)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ${totals.ingresosExtras.toLocaleString('es-AR')}
          </div>
          <p className="text-xs text-slate-400 mt-1">Comisiones, aportes y cobranzas</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        {/* Total Egresos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Egresos / Gastos
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center font-bold">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 font-mono">
            ${totals.egresos.toLocaleString('es-AR')}
          </div>
          <p className="text-xs text-slate-400 mt-1">Luz, alquiler, proveedores, etc.</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-600"></div>
        </div>

        {/* Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Balance Neto
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${totals.balance >= 0 ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600' : 'bg-rose-50 text-rose-600'
              }`}>
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className={`mt-2 text-2xl font-black font-mono ${totals.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'
            }`}>
            ${totals.balance.toLocaleString('es-AR')}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {totals.balance >= 0 ? 'Superávit operativo' : 'Déficit en este período'}
          </p>
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${totals.balance >= 0 ? 'bg-blue-600' : 'bg-rose-600'
            }`}></div>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Main Separated Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto flex-wrap">
            <button
              onClick={() => setActiveTab('EGRESOS')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'EGRESOS'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              Egresos / Gastos
            </button>
            <button
              onClick={() => setActiveTab('INGRESOS_EXTRAS')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'INGRESOS_EXTRAS'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              Ingresos Extras (SUBE/Aportes)
            </button>
            <button
              onClick={() => setActiveTab('VENTAS_POS')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'VENTAS_POS'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              Ventas POS ({sales.length})
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'ALL'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              Libro Completo
            </button>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setDateFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${dateFilter === 'ALL' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
            >
              Histórico
            </button>
            <button
              onClick={() => setDateFilter('MONTH')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${dateFilter === 'MONTH' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => setDateFilter('TODAY')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${dateFilter === 'TODAY' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
            >
              Hoy
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por concepto, proveedor o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="TODAS">Todas las Categorías</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                [Gasto] {c}
              </option>
            ))}
            {INCOME_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                [Ingreso Extra] {c}
              </option>
            ))}
            <option value="Venta Kiosco">[Venta] Venta Kiosco (POS)</option>
          </select>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3">Concepto / Descripción</th>
                <th className="py-3 px-3">Medio de Pago</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {filteredFinances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No hay movimientos registrados en este filtro.
                  </td>
                </tr>
              ) : (
                filteredFinances.slice(0, 100).map((f) => {
                  const isIngreso = f.type === 'ingreso';

                  return (
                    <tr
                      key={f.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs font-medium">
                        {new Date(f.date).toLocaleDateString('es-AR')}{' '}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(f.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${isIngreso
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                            }`}
                        >
                          {isIngreso ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{isIngreso ? 'INGRESO' : 'EGRESO'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                          {f.category}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {f.description}
                      </td>

                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-xs">
                        {f.paymentMethod}
                      </td>

                      <td className="py-3 px-4 text-right font-black text-sm font-mono">
                        <span
                          className={
                            isIngreso
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }
                        >
                          {isIngreso ? '+' : '-'}${Number(f.amount).toLocaleString('es-AR')}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {f.referenceId && f.category === 'Venta Kiosco' ? (
                          <span className="text-[10px] text-slate-400 font-mono">Vía Ventas</span>
                        ) : (
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar este movimiento financiero?')) {
                                deleteFinanceMovement(f.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD EXPENSE (EGRESO - LUZ, ALQUILER, PROVEEDORES) */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span>Registrar Gasto / Egreso</span>
              </h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Categoría del Gasto *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Concepto / Detalle
                </label>
                <input
                  type="text"
                  placeholder="Ej: Factura Luz Edenor Heladeras KEE ONDA / Alquiler Noviembre"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Monto ($) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Ej: 45000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-black text-red-600 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Forma de Pago
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                  >
                    <option value="Efectivo">Efectivo de Caja</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Mercado Pago">Mercado Pago</option>
                    <option value="Tarjeta">Tarjeta de Débito</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Fecha del Comprobante
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
                >
                  Guardar Egreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXTRA INCOME (INGRESO) */}
      {showIncomeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>Registrar Ingreso Extra</span>
              </h3>
              <button
                onClick={() => setShowIncomeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitIncome} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Categoría del Ingreso *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  {INCOME_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Concepto / Detalle
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ganancia semanal comisiones SUBE / Cargas virtuales"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Monto ($) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Ej: 15000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black text-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Medio Ingreso
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Efectivo">Efectivo a Caja</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Mercado Pago">Mercado Pago</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  Guardar Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
