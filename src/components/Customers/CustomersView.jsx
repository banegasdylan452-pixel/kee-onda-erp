import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Receipt,
  X,
  CreditCard,
  History,
} from 'lucide-react';

export default function CustomersView() {
  const { customers, addCustomer, updateCustomer, recordCustomerPayment, sales } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    limit: '25000',
    notes: '',
  });

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Total debt in the street
  const totalDebt = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.debt || 0), 0);
  }, [customers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()));

      if (filterDebtOnly && (!c.debt || c.debt <= 0)) return false;
      return matchesSearch;
    });
  }, [customers, searchTerm, filterDebtOnly]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      phone: '',
      address: '',
      limit: '25000',
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleOpenPayment = (customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount(customer.debt > 0 ? customer.debt.toString() : '');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const handleOpenHistory = (customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
  };

  const handleSaveCustomer = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addCustomer({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      limit: Number(formData.limit) || 20000,
      notes: formData.notes.trim(),
      debt: 0,
    });

    setShowAddModal(false);
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!selectedCustomer || !paymentAmount || Number(paymentAmount) <= 0) {
      alert('Ingresa un monto válido.');
      return;
    }

    recordCustomerPayment(
      selectedCustomer.id,
      Number(paymentAmount),
      paymentMethod,
      paymentNotes
    );

    alert(`¡Abono de $${Number(paymentAmount).toLocaleString('es-AR')} registrado exitosamente e impactado en Finanzas!`);
    setShowPaymentModal(false);
  };

  // Find sales for selected customer
  const customerSales = useMemo(() => {
    if (!selectedCustomer) return [];
    return sales.filter((s) => s.customerName === selectedCustomer.name);
  }, [sales, selectedCustomer]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Clientes & Cuenta Corriente (Fiar)
            </h2>
            <span className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900">
              CRM KEE ONDA
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Control de fiados, límites de crédito, pagos y libreta de cuentas de vecinos
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Total Fiado ("En la Calle")
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">
            ${totalDebt.toLocaleString('es-AR')}
          </div>
          <p className="text-xs text-slate-400 mt-1">Saldo pendiente por cobrar a clientes</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Clientes Registrados
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {customers.length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Vecinos con cuenta corriente abierta</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Con Saldo Deudor
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">
            {customers.filter((c) => c.debt > 0).length} clientes
          </div>
          <p className="text-xs text-slate-400 mt-1">Clientes con pagos pendientes</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-600"></div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex-1 relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <button
          onClick={() => setFilterDebtOnly(!filterDebtOnly)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 whitespace-nowrap ${
            filterDebtOnly
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Solo con Deuda Activa</span>
        </button>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => {
          const hasDebt = (c.debt || 0) > 0;
          const isNearLimit = c.limit && c.debt >= c.limit * 0.8;

          return (
            <div
              key={c.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                hasDebt
                  ? 'border-amber-200 dark:border-amber-900/60'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {c.name}
                    </h3>
                    {c.phone && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-red-500" />
                        <span>{c.phone}</span>
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                      hasDebt
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {hasDebt ? `Debe $${c.debt.toLocaleString('es-AR')}` : 'Al Día ($0)'}
                  </span>
                </div>

                {c.address && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{c.address}</span>
                  </p>
                )}

                {c.notes && (
                  <p className="text-[11px] italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800 mb-3">
                    "{c.notes}"
                  </p>
                )}

                {/* Credit Limit progress bar */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <span>Límite de fiado: ${c.limit.toLocaleString('es-AR')}</span>
                    <span>{((c.debt / c.limit) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isNearLimit ? 'bg-red-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, (c.debt / c.limit) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => handleOpenHistory(c)}
                  className="flex-1 py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 flex items-center justify-center gap-1"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Historial</span>
                </button>

                <button
                  onClick={() => handleOpenPayment(c)}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Cobrar Abono</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD CUSTOMER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-red-600" />
                <span>Registrar Cliente Habitual</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Nombre Completo / Apodo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Don Carlos Mecánico / Mariana 3°B"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 11-3456-7890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Límite Máximo Fiado ($)
                  </label>
                  <input
                    type="number"
                    value={formData.limit}
                    onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Dirección / Dpto / Referencia
                </label>
                <input
                  type="text"
                  placeholder="Ej: Enfrente del local o taller a la vuelta"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Notas (Días de pago, mandados)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Paga los viernes cuando cobra en la fábrica..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
                >
                  Registrar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD PAYMENT (ABONO) */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Cobro de Deuda / Abono</span>
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-800 dark:text-white text-sm">{selectedCustomer.name}</div>
                  <div className="text-xs text-slate-400">Saldo actual adeudado:</div>
                </div>
                <div className="text-xl font-black text-rose-600">
                  ${selectedCustomer.debt.toLocaleString('es-AR')}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Monto a Abonar ($) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full text-base py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black text-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Medio de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="Efectivo">Efectivo a Caja</option>
                  <option value="Mercado Pago">Mercado Pago / Transferencia</option>
                  <option value="Tarjeta">Tarjeta Débito</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Nota / Detalle
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pago total de la semana / adelanto"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER SALES HISTORY */}
      {showHistoryModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-red-600" />
                <span>Historial de Compras: {selectedCustomer.name}</span>
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {customerSales.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No hay compras registradas para este cliente aún.
                </div>
              ) : (
                customerSales.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-white">
                        Ticket #{s.id} · {s.paymentMethod}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(s.date).toLocaleString('es-AR')} · {(s.items || []).length} ítems
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        ${s.totalAmount.toLocaleString('es-AR')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl"
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

