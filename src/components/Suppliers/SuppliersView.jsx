import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Truck,
  Plus,
  Phone,
  Mail,
  Receipt,
  Package,
  Calendar,
  X,
  CheckCircle2,
} from 'lucide-react';

export default function SuppliersView() {
  const { suppliers, products, addSupplierPurchase, finances } = useApp();

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(suppliers[0]?.name || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseTotal, setPurchaseTotal] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');

  // Supplier purchase items state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [costPrice, setCostPrice] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([]);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const prod = products.find((p) => p.id === selectedProduct);
    if (!prod) return;

    const unitCost = Number(costPrice) || prod.costPrice;
    const qty = Number(quantity) || 1;

    setPurchaseItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        name: prod.name,
        quantity: qty,
        costPrice: unitCost,
        subtotal: unitCost * qty,
      },
    ]);

    setSelectedProduct('');
    setQuantity('10');
    setCostPrice('');
  };

  const handleRemoveItem = (index) => {
    setPurchaseItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSavePurchase = (e) => {
    e.preventDefault();
    const total = purchaseItems.length > 0
      ? purchaseItems.reduce((acc, i) => acc + i.subtotal, 0)
      : Number(purchaseTotal);

    if (!total || total <= 0) {
      alert('Ingresa el monto total o agrega productos a la factura.');
      return;
    }

    addSupplierPurchase({
      supplierName: selectedSupplier,
      items: purchaseItems,
      totalAmount: total,
      paymentMethod,
      invoiceNumber,
    });

    alert('¡Compra registrada! El stock de los productos ha sido actualizado y el gasto fue asentado en Finanzas.');
    setShowPurchaseModal(false);
    setPurchaseItems([]);
    setPurchaseTotal('');
    setInvoiceNumber('');
  };

  // Recent supplier expenses in finances
  const supplierExpenses = finances.filter((f) => f.category === 'Mercadería / Proveedores');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Proveedores & Compras de Mercadería
            </h2>
            <span className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900">
              {suppliers.length} proveedores
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Recepción de mercadería, actualización directa de stock y vinculación con Finanzas
          </p>
        </div>

        <button
          onClick={() => setShowPurchaseModal(true)}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all self-start md:self-auto"
        >
          <Receipt className="w-4 h-4" />
          <span>Ingresar Factura / Pedido</span>
        </button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {s.name}
                </h3>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mt-3">
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-red-500" />
                  <span>{s.contact}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{s.email}</span>
                </p>
              </div>

              <div className="mt-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                <strong>Condición:</strong> {s.terms}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex justify-between items-center text-xs">
              <span className="text-slate-400">
                {products.filter((p) => p.supplier === s.name).length} productos provistos
              </span>
              <button
                onClick={() => {
                  setSelectedSupplier(s.name);
                  setShowPurchaseModal(true);
                }}
                className="text-red-600 dark:text-red-400 font-bold hover:underline"
              >
                Cargar Factura &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Purchases List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">
          Historial Reciente de Compras a Proveedores
        </h3>
        <div className="space-y-2">
          {supplierExpenses.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No hay compras de mercadería registradas aún.
            </div>
          ) : (
            supplierExpenses.slice(0, 10).map((exp) => (
              <div
                key={exp.id}
                className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800 dark:text-white">{exp.description}</div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(exp.date).toLocaleDateString('es-AR')} · Pago: {exp.paymentMethod}
                  </div>
                </div>
                <div className="text-sm font-black text-red-600 dark:text-red-400">
                  -${Number(exp.amount).toLocaleString('es-AR')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: REGISTER SUPPLIER PURCHASE */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-red-600" />
                <span>Ingreso de Mercadería y Factura</span>
              </h3>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Proveedor
                  </label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    N° Factura / Remito
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: A-0001-0004928"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
              </div>

              {/* Add item to invoice */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Agregar productos a reponer stock (Opcional):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={selectedProduct}
                    onChange={(e) => {
                      setSelectedProduct(e.target.value);
                      const p = products.find((pr) => pr.id === e.target.value);
                      if (p) setCostPrice(p.costPrice.toString());
                    }}
                    className="sm:col-span-3 text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  >
                    <option value="">(Selecciona un producto para sumar stock)</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock act: {p.stock} u.)
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Cantidad"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="text-xs py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold"
                  />

                  <input
                    type="number"
                    placeholder="Costo u."
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="text-xs py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold"
                  />

                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!selectedProduct}
                    className="text-xs py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg disabled:opacity-50"
                  >
                    + Agregar
                  </button>
                </div>

                {purchaseItems.length > 0 && (
                  <div className="max-h-36 overflow-y-auto space-y-1 mt-2">
                    {purchaseItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">${item.subtotal.toLocaleString('es-AR')}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total and payment method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Monto Total Factura ($) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={
                      purchaseItems.length > 0
                        ? purchaseItems.reduce((acc, i) => acc + i.subtotal, 0)
                        : purchaseTotal
                    }
                    onChange={(e) => setPurchaseTotal(e.target.value)}
                    readOnly={purchaseItems.length > 0}
                    placeholder="Ej: 85000"
                    className="w-full text-base py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-black text-red-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Medio de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Mercado Pago">Mercado Pago</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
                >
                  Registrar Compra y Asentar Egreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

