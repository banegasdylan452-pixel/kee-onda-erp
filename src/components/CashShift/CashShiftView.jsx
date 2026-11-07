import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Banknote,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  DollarSign,
  QrCode,
  CreditCard,
  UserCheck,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function CashShiftView() {
  const { cashShift, openCashShift, closeCashShift, sales, user } = useApp();

  const [initialCashInput, setInitialCashInput] = useState('25000');
  const [cashierInput, setCashierInput] = useState(user ? user.name : 'Dueño (Admin)');
  const [countedCashInput, setCountedCashInput] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  // Calculate shift statistics based on sales after cashShift.openedAt
  const shiftStats = useMemo(() => {
    if (!cashShift.isOpen && !cashShift.openedAt) {
      return { totalSales: 0, cashSales: 0, digitalSales: 0, fiadosSales: 0, expectedCash: 0, count: 0 };
    }

    const openTime = new Date(cashShift.openedAt);

    const shiftSales = sales.filter((s) => new Date(s.date) >= openTime);

    let cashSales = 0;
    let digitalSales = 0;
    let fiadosSales = 0;
    let totalSales = 0;

    shiftSales.forEach((s) => {
      totalSales += s.totalAmount;
      if (s.paymentMethod === 'Efectivo') cashSales += s.totalAmount;
      else if (s.paymentMethod === 'Cuenta Corriente') fiadosSales += s.totalAmount;
      else digitalSales += s.totalAmount;
    });

    const expectedCash = (cashShift.initialCash || 0) + cashSales;

    return {
      shiftSales,
      totalSales,
      cashSales,
      digitalSales,
      fiadosSales,
      expectedCash,
      count: shiftSales.length,
    };
  }, [cashShift, sales]);

  const handleOpenShift = (e) => {
    e.preventDefault();
    openCashShift(initialCashInput, cashierInput, 'Apertura de turno');
  };

  const handleCloseShift = (e) => {
    e.preventDefault();
    if (!countedCashInput) {
      alert('Ingresa el efectivo contado en el cajón.');
      return;
    }
    closeCashShift(countedCashInput, closingNotes);
  };

  const cashDifference = useMemo(() => {
    if (!countedCashInput) return 0;
    return Number(countedCashInput) - shiftStats.expectedCash;
  }, [countedCashInput, shiftStats.expectedCash]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Control de Caja & Turnos
            </h2>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                cashShift.isOpen
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200'
              }`}
            >
              {cashShift.isOpen ? 'CAJA ABIERTA' : 'CAJA CERRADA'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Arqueo de caja, conteo de billetes, control de turno y diferencias de efectivo
          </p>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <Clock className="w-4 h-4 text-red-600" />
          <span>
            {cashShift.isOpen ? `Abierta desde: ${new Date(cashShift.openedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} (${cashShift.cashier})` : 'Turno cerrado'}
          </span>
        </div>
      </div>

      {cashShift.isOpen ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shift Metrics */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Fondo Inicial */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Fondo Inicial de Caja</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  ${(cashShift.initialCash || 0).toLocaleString('es-AR')}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Efectivo para cambio al abrir turno</p>
              </div>

              {/* Ventas en Efectivo */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Ventas Efectivo del Turno</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  +${shiftStats.cashSales.toLocaleString('es-AR')}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Ingresado en billetes al cajón</p>
              </div>

              {/* Ventas Digitales */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Mercado Pago / Tarjetas</span>
                <div className="text-2xl font-black text-blue-600 mt-1">
                  ${shiftStats.digitalSales.toLocaleString('es-AR')}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Directo a cuenta digital (no entra a caja física)</p>
              </div>

              {/* Efectivo Teórico Esperado */}
              <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-900/60 rounded-xl p-4 shadow-sm bg-emerald-50/20">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                  Efectivo Teórico en Cajón
                </span>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  ${shiftStats.expectedCash.toLocaleString('es-AR')}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Fondo Inicial + Ventas en efectivo</p>
              </div>
            </div>

            {/* Sales in Current Shift */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">
                Últimas ventas de este turno ({shiftStats.count} ventas)
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {shiftStats.shiftSales.length === 0 ? (
                  <div className="text-xs text-slate-400 py-6 text-center">
                    Aún no hay ventas en este turno.
                  </div>
                ) : (
                  shiftStats.shiftSales.slice(0, 15).map((s) => (
                    <div
                      key={s.id}
                      className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-red-600">#{s.id}</span>
                        <span className="text-slate-500 font-medium">{s.paymentMethod}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-[11px]">
                          {new Date(s.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-black text-slate-900 dark:text-white">
                          ${s.totalAmount.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Close Shift Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Lock className="w-5 h-5 text-red-600" />
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                Cierre y Arqueo de Caja
              </h3>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Efectivo Contado en Cajón ($) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder={`Ej: ${shiftStats.expectedCash}`}
                  value={countedCashInput}
                  onChange={(e) => setCountedCashInput(e.target.value)}
                  className="w-full text-lg py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-black text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Difference calculator */}
              {countedCashInput && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Esperado:</span>
                    <span className="font-bold">${shiftStats.expectedCash.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Contado:</span>
                    <span className="font-bold">${Number(countedCashInput).toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>Diferencia:</span>
                    <span
                      className={
                        cashDifference === 0
                          ? 'text-emerald-600'
                          : cashDifference > 0
                          ? 'text-blue-600'
                          : 'text-rose-600'
                      }
                    >
                      {cashDifference === 0
                        ? 'Caja Exacta ($0)'
                        : cashDifference > 0
                        ? `Sobrante +$${cashDifference.toLocaleString('es-AR')}`
                        : `Faltante -$${Math.abs(cashDifference).toLocaleString('es-AR')}`}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Observaciones de Cierre
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre billetes rotos, diferencias, retiros..."
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
              >
                <Lock className="w-4 h-4" />
                <span>Cerrar Turno de Caja</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* OPEN SHIFT CARD */
        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-950/60 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <Unlock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Abrir Nuevo Turno de Caja
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ingresa el fondo de cambio inicial para comenzar a registrar operaciones en el POS.
          </p>

          <form onSubmit={handleOpenShift} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Fondo Inicial en Billetes ($)
              </label>
              <input
                type="number"
                required
                value={initialCashInput}
                onChange={(e) => setInitialCashInput(e.target.value)}
                className="w-full text-base py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-black focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Cajero / Responsable
              </label>
              <input
                type="text"
                required
                value={cashierInput}
                onChange={(e) => setCashierInput(e.target.value)}
                className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Turno</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

