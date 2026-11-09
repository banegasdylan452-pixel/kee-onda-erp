import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Receipt,
  Search,
  Filter,
  Calendar,
  Trash2,
  Printer,
  X,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  ShoppingCart,
  User,
  CreditCard,
  QrCode,
  ArrowRight,
  PackageCheck,
  Undo2,
} from 'lucide-react';

export default function SalesHistoryView() {
  const { sales, deleteSale, user } = useApp();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('TODAY'); // 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL'
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Modals state
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [saleToView, setSaleToView] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filtered sales
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return sales.filter((sale) => {
      // Date filter
      const saleDate = new Date(sale.date);
      const saleDateStr = sale.date.split('T')[0];

      if (dateFilter === 'TODAY' && saleDateStr !== todayStr) return false;
      if (dateFilter === 'YESTERDAY' && saleDateStr !== yesterdayStr) return false;
      if (dateFilter === 'WEEK' && saleDate < weekAgo) return false;
      if (dateFilter === 'MONTH' && saleDate < monthStart) return false;

      // Payment method filter
      if (methodFilter !== 'ALL' && sale.paymentMethod !== methodFilter) return false;

      // Search term (ID, customer, items)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesId = sale.id.toLowerCase().includes(term);
        const matchesCust = (sale.customerName || '').toLowerCase().includes(term);
        const matchesItem = (sale.items || []).some((item) =>
          item.name.toLowerCase().includes(term)
        );
        if (!matchesId && !matchesCust && !matchesItem) return false;
      }

      return true;
    });
  }, [sales, dateFilter, methodFilter, searchTerm]);

  // Totals of filtered sales
  const stats = useMemo(() => {
    const totalAmount = filteredSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const totalProfit = filteredSales.reduce((acc, s) => acc + (s.profit || 0), 0);
    const count = filteredSales.length;
    return { totalAmount, totalProfit, count };
  }, [filteredSales]);

  // Handle Confirm Delete / Cancel Sale
  const handleConfirmDelete = async () => {
    if (!saleToDelete) return;

    const saleId = saleToDelete.id;
    const total = saleToDelete.totalAmount;
    const success = await deleteSale(saleId);

    if (success) {
      setSaleToDelete(null);
      setToastMessage(`¡Venta #${saleId} anulada! Se repuso el stock de los productos y se sincronizó con finanzas.`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const printTicket = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Ventas Realizadas & Tickets
            </h2>
            <span className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900">
              Sección de Anulaciones
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registro de todas las ventas del POS, reimpresión de comprobantes y anulación de ventas hechas por error
          </p>
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex-wrap">
          <button
            onClick={() => setDateFilter('TODAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              dateFilter === 'TODAY'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setDateFilter('YESTERDAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              dateFilter === 'YESTERDAY'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Ayer
          </button>
          <button
            onClick={() => setDateFilter('WEEK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              dateFilter === 'WEEK'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Últimos 7 Días
          </button>
          <button
            onClick={() => setDateFilter('MONTH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              dateFilter === 'MONTH'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Este Mes
          </button>
          <button
            onClick={() => setDateFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              dateFilter === 'ALL'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todas
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Recaudación de Ventas
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            ${stats.totalAmount.toLocaleString('es-AR')}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">En el período seleccionado</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Tickets Emitidos
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {stats.count} ventas
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Operaciones registradas en caja</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600"></div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Ganancia Bruta Ventas
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            +${stats.totalProfit.toLocaleString('es-AR')}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Margen de ganancia de los productos vendidos
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Ticket #, cliente o nombre de producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="ALL">Todos los Medios de Pago</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Mercado Pago">Mercado Pago (QR)</option>
          <option value="Tarjeta Débito">Tarjeta Débito</option>
          <option value="Tarjeta Crédito">Tarjeta Crédito</option>
          <option value="Cuenta Corriente">Cuenta Corriente (Fiar)</option>
        </select>
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">N° Ticket / Fecha</th>
                <th className="py-3 px-3">Productos Vendidos</th>
                <th className="py-3 px-3">Cliente</th>
                <th className="py-3 px-3">Medio de Pago</th>
                <th className="py-3 px-3 text-right">Total ($)</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No hay ventas registradas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-black text-red-600 dark:text-red-400 text-xs">
                        #{sale.id}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(sale.date).toLocaleDateString('es-AR')}{' '}
                        <span className="font-mono">
                          {new Date(sale.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">{sale.cashier}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-0.5 max-w-xs">
                        {(sale.items || []).slice(0, 3).map((item, idx) => (
                          <div key={idx} className="text-xs text-slate-800 dark:text-slate-200 truncate">
                            <span className="font-bold text-red-600">{item.quantity}x</span> {item.name}
                          </div>
                        ))}
                        {(sale.items || []).length > 3 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            +{(sale.items || []).length - 3} productos más...
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                        {sale.customerName || 'Consumidor Final'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          sale.paymentMethod === 'Efectivo'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : sale.paymentMethod === 'Mercado Pago'
                            ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                            : sale.paymentMethod === 'Cuenta Corriente'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {sale.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="font-black text-sm text-slate-900 dark:text-white font-mono">
                        ${sale.totalAmount.toLocaleString('es-AR')}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        +${sale.profit.toLocaleString('es-AR')} ganancia
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Ver / Reimprimir */}
                        <button
                          onClick={() => setSaleToView(sale)}
                          title="Ver y reimprimir ticket"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* BORRAR / ANULAR VENTA */}
                        <button
                          onClick={() => setSaleToDelete(sale)}
                          title="Anular venta y reponer stock"
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-600 hover:text-white transition-all flex items-center gap-1 text-xs font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Anular</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CONFIRMAR ANULACIÓN Y REPOSICIÓN DE STOCK */}
      {saleToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-black text-lg text-slate-900 dark:text-white text-center">
              ¿Anular la Venta #{saleToDelete.id}?
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
              Esta acción revertirá la venta por un total de{' '}
              <strong className="text-slate-800 dark:text-white font-mono">
                ${saleToDelete.totalAmount.toLocaleString('es-AR')}
              </strong>
              .
            </p>

            {/* Side-effects summary */}
            <div className="my-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4" />
                <span>Impacto en Inventario y Finanzas:</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pl-4 list-disc">
                {(saleToDelete.items || []).map((item, idx) => (
                  <li key={idx}>
                    Se devolverán <strong>+{item.quantity} unidades</strong> de <em>{item.name}</em> al stock.
                  </li>
                ))}
                <li>Se descontará el ingreso de las finanzas y de la caja.</li>
                {saleToDelete.paymentMethod === 'Cuenta Corriente' && (
                  <li>
                    Se cancelará la deuda generada a <strong>{saleToDelete.customerName}</strong>.
                  </li>
                )}
              </ul>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSaleToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Anular y Reponer Stock</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VER / REIMPRIMIR TICKET */}
      {saleToView && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-3">
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-white font-black text-sm">
                <Receipt className="w-4 h-4 text-red-600" />
                <span>Ticket #{saleToView.id}</span>
              </div>
              <button
                onClick={() => setSaleToView(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Printable box */}
            <div
              id="thermal-receipt"
              className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 space-y-2"
            >
              <div className="text-center pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                <div className="font-black text-sm tracking-widest text-red-600">*** KEE ONDA ***</div>
                <div className="text-[10px] text-slate-500">KIOSCO & ALMACÉN 24HS</div>
                <div className="text-[10px] text-slate-400 mt-1">Ticket #{saleToView.id}</div>
                <div className="text-[10px] text-slate-400">
                  {new Date(saleToView.date).toLocaleString('es-AR')}
                </div>
                <div className="text-[10px] text-slate-500">Cajero: {saleToView.cashier}</div>
              </div>

              <div className="space-y-1 py-1 border-b border-dashed border-slate-300 dark:border-slate-700">
                {(saleToView.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[170px]">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-bold">${item.subtotal.toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1 text-[11px]">
                <div className="flex justify-between font-black text-xs">
                  <span>TOTAL:</span>
                  <span>${saleToView.totalAmount.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Pago:</span>
                  <span>{saleToView.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Cliente:</span>
                  <span>{saleToView.customerName}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400">
                ¡Gracias por tu compra! Kee Onda!
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={printTicket}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
              <button
                onClick={() => setSaleToView(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

