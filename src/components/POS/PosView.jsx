import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { playScannerBeep } from '../../utils/soundAndBarcode';
import confetti from 'canvas-confetti';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  DollarSign,
  CreditCard,
  QrCode,
  UserCheck,
  Printer,
  X,
  AlertTriangle,
  RotateCcw,
  Volume2,
  HelpCircle,
  Sparkles,
  ArrowLeftRight,
  Zap,
} from 'lucide-react';

export default function PosView({ onNavigateToCreateProduct }) {
  const { products, customers, addSale, user } = useApp();

  // POS State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [lastCompletedSale, setLastCompletedSale] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState('');
  const [unregisteredCode, setUnregisteredCode] = useState(null);
  const [scannerFeedback, setScannerFeedback] = useState(null); // { message, type: 'success' | 'error' }

  // Ergonomic Layout Toggle: 'left' (Recommended, near sidebar) vs 'right'
  const [ticketPosition, setTicketPosition] = useState(() => {
    return localStorage.getItem('KEE_ONDA_POS_POS') || 'left';
  });

  const barcodeInputRef = useRef(null);

  // Save layout preference
  const toggleTicketPosition = () => {
    const next = ticketPosition === 'left' ? 'right' : 'left';
    setTicketPosition(next);
    localStorage.setItem('KEE_ONDA_POS_POS', next);
  };

  // Focus barcode input on mount
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Filter products by search and category (NO IMAGES used)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm));
      const matchesCat =
        selectedCategory === 'TODOS' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  // Extract unique categories
  const categoriesList = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['TODOS', ...Array.from(set)];
  }, [products]);

  // Add item to cart
  const addToCart = (product, playBeep = false) => {
    if (product.stock <= 0) {
      if (playBeep) playScannerBeep(false);
      showScannerToast(`¡Sin Stock! "${product.name}"`, 'error');
      return;
    }

    if (playBeep) playScannerBeep(true);
    showScannerToast(`+1 "${product.name}" ($${product.sellPrice})`, 'success');

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showScannerToast(`Stock máximo alcanzado (${product.stock} u.)`, 'error');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            productId: product.id,
            name: product.name,
            category: product.category,
            price: product.sellPrice,
            costPrice: product.costPrice,
            quantity: 1,
            maxStock: product.stock,
            barcode: product.barcode,
          },
        ];
      }
    });
  };

  // Toast feedback helper
  const showScannerToast = (message, type = 'success') => {
    setScannerFeedback({ message, type });
    setTimeout(() => {
      setScannerFeedback(null);
    }, 2200);
  };

  // Direct Barcode Lookup & Auto Add
  const handleBarcodeSubmit = (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    const code = searchTerm.trim();
    const found = products.find(
      (p) => p.barcode === code || p.name.toLowerCase() === code.toLowerCase()
    );

    if (found) {
      addToCart(found, true);
      setSearchTerm('');
      setLastScannedBarcode(code);
      setUnregisteredCode(null);
    } else {
      playScannerBeep(false);
      setUnregisteredCode(code);
      showScannerToast(`Código no encontrado: ${code}`, 'error');
    }
  };

  // ========================================================
  // GLOBAL HARDWARE USB / BLUETOOTH BARCODE SCANNER LISTENER
  // ========================================================
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e) => {
      // If user is typing in a text/number input other than the barcode input, let it type normally
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = activeTag === 'input' || activeTag === 'textarea';
      const isOurBarcodeInput = document.activeElement === barcodeInputRef.current;

      // Keyboard shortcut: F12 or Ctrl+Enter to quick-confirm sale
      if (e.key === 'F12' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        handleCheckout();
        return;
      }

      // Check key timing to detect automated scanner keystroke bursts
      const now = Date.now();
      const diff = now - lastKeyTime;
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          // Rapid barcode scan detected!
          const scannedCode = buffer.trim();
          buffer = '';
          const found = products.find((p) => p.barcode === scannedCode);
          if (found) {
            e.preventDefault();
            addToCart(found, true);
            setLastScannedBarcode(scannedCode);
            setUnregisteredCode(null);
            return;
          } else {
            // Unregistered barcode in POS
            playScannerBeep(false);
            setUnregisteredCode(scannedCode);
            showScannerToast(`Código no encontrado: ${scannedCode}`, 'error');
          }
        }
        buffer = '';
      } else if (e.key.length === 1) {
        // Accumulate alphanumeric characters if within fast scanner interval
        if (diff > 80 && !isOurBarcodeInput) {
          buffer = ''; // Reset if typing slowly like a human
        }
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [products, cart]);

  // Cart operations
  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.maxStock) {
              alert(`Stock máximo disponible: ${item.maxStock}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashReceived('');
  };

  // Totals calculations
  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const cashChange = useMemo(() => {
    if (paymentMethod !== 'Efectivo') return 0;
    const received = Number(cashReceived) || 0;
    return received >= cartTotal ? received - cartTotal : 0;
  }, [cashReceived, cartTotal, paymentMethod]);

  // Handle Checkout
  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'Cuenta Corriente' && !selectedCustomer) {
      alert('Debes seleccionar un cliente para registrar una venta en Cuenta Corriente (Fiar).');
      return;
    }

    if (paymentMethod === 'Efectivo' && cashReceived && Number(cashReceived) < cartTotal) {
      alert('El monto recibido en efectivo es menor al total a pagar.');
      return;
    }

    const receivedNum = paymentMethod === 'Efectivo' ? Number(cashReceived) || cartTotal : cartTotal;
    const changeNum = paymentMethod === 'Efectivo' ? cashChange : 0;

    const completedSale = addSale({
      items: cart,
      paymentMethod,
      customerName: selectedCustomer || 'Consumidor Final',
      receivedCash: receivedNum,
      changeCash: changeNum,
    });

    // Confetti effect
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'],
      });
    } catch {
      // safe fallback
    }

    setLastCompletedSale(completedSale);
    setShowReceiptModal(true);
    clearCart();
  };

  const printReceipt = () => {
    window.print();
  };

  // Simulating barcode scanner trigger for demo testing
  const simulateScan = (barcode) => {
    const found = products.find((p) => p.barcode === barcode);
    if (found) {
      addToCart(found, true);
      setLastScannedBarcode(barcode);
    }
  };

  // Render the Ticket & Checkout Component (can be placed Left or Right)
  const renderTicketPanel = () => (
    <div className="w-full lg:w-[440px] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md overflow-hidden shrink-0">
      {/* 1. TOP PINNED ACTION BAR: BIG TOTAL & ONE-CLICK CONFIRM BUTTON (NEVER SCROLLS!) */}
      <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-b border-slate-700 shadow-inner">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white shadow-sm">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight">TICKET DE VENTA</span>
              <span className="text-[11px] text-slate-400 ml-1.5 font-mono">
                ({cart.reduce((s, i) => s + i.quantity, 0)} ítems)
              </span>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              title="Vaciar ticket"
              className="text-[11px] text-rose-300 hover:text-white flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg bg-white/10 hover:bg-rose-600/80 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Vaciar</span>
            </button>
          )}
        </div>

        {/* Big Total Header */}
        <div className="flex items-baseline justify-between py-1">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Total a Cobrar:</span>
          <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight font-mono">
            ${cartTotal.toLocaleString('es-AR')}
          </span>
        </div>

        {/* PROMINENT ONE-CLICK CONFIRM BUTTON (ALWAYS VISIBLE AT TOP!) */}
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className={`w-full mt-2.5 py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
            cart.length === 0
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-60'
              : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400/40'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>CONFIRMAR COBRO (F12 / ENTER)</span>
        </button>
      </div>

      {/* 2. PAYMENT METHODS & CASH CALCULATOR (COMPACT, NO SCROLL) */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 space-y-2">
        {/* Payment Methods Grid */}
        <div className="grid grid-cols-5 gap-1 text-[11px]">
          {[
            { id: 'Efectivo', label: 'Efectivo' },
            { id: 'Mercado Pago', label: 'QR / MP' },
            { id: 'Tarjeta Débito', label: 'Débito' },
            { id: 'Tarjeta Crédito', label: 'Crédito' },
            { id: 'Cuenta Corriente', label: 'Fiar' },
          ].map((m) => {
            const isSelected = paymentMethod === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                className={`py-1.5 px-1 rounded-lg font-bold text-center border transition-all truncate ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Cash Calculation Bar (if Cash selected) */}
        {paymentMethod === 'Efectivo' && (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-1.5 flex-1">
              <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px]">Paga con $:</span>
              <input
                type="number"
                placeholder={cartTotal ? `${cartTotal}` : 'Monto'}
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="w-24 text-right font-black text-xs py-1 px-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <button
                onClick={() => setCashReceived(cartTotal.toString())}
                className="px-1.5 py-1 text-[10px] font-bold bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-200"
              >
                Exacto
              </button>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Vuelto:</span>
              <span className={`font-black text-xs ${cashChange > 0 ? 'text-emerald-600 font-mono' : 'text-slate-600 dark:text-slate-400'}`}>
                ${cashChange.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        )}

        {/* Customer Select (for Fiar) */}
        <div className="flex items-center gap-1.5 pt-1 text-xs">
          <UserCheck className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full text-xs font-semibold py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
          >
            <option value="">Consumidor Final (General)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name} {c.debt > 0 ? `(Debe: $${c.debt.toLocaleString('es-AR')})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. CART ITEMS LIST (SCROLLABLE, NEVER PUSHES THE CHECKOUT BUTTON) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[220px] max-h-[calc(100vh-420px)] lg:max-h-none">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-10">
            <ShoppingCart className="w-10 h-10 mb-2 opacity-25 stroke-1" />
            <span className="font-semibold">El ticket está vacío</span>
            <span className="text-[11px] text-slate-500 mt-1 text-center">
              Escanea con el lector o haz clic en los productos
            </span>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.productId}
              className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-2 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {item.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-mono">
                  ${item.price.toLocaleString('es-AR')} c/u
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded-lg shadow-sm">
                <button
                  onClick={() => updateQuantity(item.productId, -1)}
                  className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-red-600 rounded font-bold"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-black w-6 text-center text-slate-800 dark:text-white font-mono">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.productId, 1)}
                  className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-red-600 rounded font-bold"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right min-w-[65px] font-mono font-black text-xs text-slate-900 dark:text-white">
                ${(item.price * item.quantity).toLocaleString('es-AR')}
              </div>

              {/* Delete */}
              <button
                onClick={() => removeFromCart(item.productId)}
                className="text-slate-400 hover:text-red-500 p-1 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Top Banner: Barcode Status, Position Toggle & Fast Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 px-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Lector de Código de Barras Status Pill */}
          <button
            onClick={() => setShowScannerModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all shadow-sm"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <Barcode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Lector de Código de Barra ACTIVO</span>
            <HelpCircle className="w-3.5 h-3.5 opacity-60 ml-0.5" />
          </button>

          {/* Toast feedback pill */}
          {scannerFeedback && (
            <div
              className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 ${
                scannerFeedback.type === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{scannerFeedback.message}</span>
            </div>
          )}
        </div>

        {/* Layout Switcher (Ticket Izquierda vs Derecha) */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={toggleTicketPosition}
            title="Cambiar posición del ticket para mayor comodidad"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-red-600" />
            <span>Ticket: {ticketPosition === 'left' ? 'Izquierda (Cerca)' : 'Derecha'}</span>
          </button>
        </div>
      </div>

      {/* Unregistered Barcode Alert Banner with 1-Click Action to Load */}
      {unregisteredCode && onNavigateToCreateProduct && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-2 flex-wrap">
                <span>Código no registrado en el sistema:</span>
                <span className="font-mono bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 font-black px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700">
                  {unregisteredCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                ¿Deseas dar de alta este producto en el catálogo ahora sin tener que escribir el código?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => {
                onNavigateToCreateProduct(unregisteredCode);
                setUnregisteredCode(null);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Cargar Producto con este Código</span>
            </button>
            <button
              onClick={() => setUnregisteredCode(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              title="Descartar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main POS Workspace */}
      <div className={`flex flex-col ${ticketPosition === 'left' ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-5 min-h-[calc(100vh-180px)]`}>
        {/* TICKET PANEL (POSITIONED ACCORDING TO USER PREFERENCE, DEFAULT LEFT!) */}
        {renderTicketPanel()}

        {/* PRODUCT CATALOG (NO IMAGES, FAST GRID) */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm min-w-0">
          {/* Search & Barcode input bar */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Escanear código de barra o escribir nombre de producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm"
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>Enter</span>
              </button>
            </form>

            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-3 scrollbar-none">
            {categoriesList.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-400/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Products Grid (NO IMAGES - Optimized for Speed) */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
                <AlertTriangle className="w-8 h-8 mb-2 text-amber-500 opacity-60" />
                <span>No se encontraron productos con ese filtro</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock <= p.minStock;

                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p, true)}
                      disabled={isOutOfStock}
                      className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between relative group ${
                        isOutOfStock
                          ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:border-red-500 hover:shadow-md active:scale-[0.98]'
                      }`}
                    >
                      <div>
                        {/* Category & Stock */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-[95px]">
                            {p.category}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              isOutOfStock
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            }`}
                          >
                            {p.stock} u.
                          </span>
                        </div>

                        {/* Name */}
                        <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                          {p.name}
                        </div>
                      </div>

                      {/* Price and Barcode */}
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                        <div className="text-sm sm:text-base font-black text-red-600 dark:text-red-400 font-mono">
                          ${p.sellPrice.toLocaleString('es-AR')}
                        </div>
                        {p.barcode && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            *{p.barcode.slice(-4)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: BARCODE SCANNER GUIDE & DEMO SIMULATOR */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <Barcode className="w-6 h-6" />
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  Lector de Código de Barras (Web vs Tauri)
                </h3>
              </div>
              <button
                onClick={() => setShowScannerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                <div className="font-black text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>¿Se puede usar lector USB directo en la Web o hace falta Tauri/Rust?</span>
                </div>
                <p className="leading-relaxed">
                  <strong>¡SÍ, SE PUEDE USAR 100% DIRECTO EN LA WEB! NO HACE FALTA TAURI NI RUST.</strong>
                </p>
                <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                  Cualquier lector de código de barra USB o Bluetooth (Honeywell, Zebra, lectores comunes de Mercado Libre) funciona bajo el estándar <strong>HID (Emulación de Teclado)</strong>. Al gatillar el lector frente al código del producto, la PC recibe los números en milisegundos seguidos de un <em>Enter</em> automático.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-800 dark:text-white text-xs">
                  ¿Cómo funciona en este CRM/ERP KEE ONDA?
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400">
                  <li>
                    <strong>Detección Global:</strong> No necesitas hacer clic en la caja de búsqueda. El sistema escucha las pulsaciones rápidas del lector en cualquier parte de la pantalla.
                  </li>
                  <li>
                    <strong>Bip Electrónico Real:</strong> Emite el sonido agudo de caja registradora sintetizado mediante la Web Audio API al leer un código.
                  </li>
                  <li>
                    <strong>Auto-agregado:</strong> Suma el producto directamente al ticket y actualiza el total al instante.
                  </li>
                </ul>
              </div>

              {/* Live Scan Simulator */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-bold text-slate-800 dark:text-white flex items-center justify-between">
                  <span>Prueba Interactiva de Escaneo (Sin lector físico):</span>
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Haz clic en cualquiera de estos productos para simular el gatillo del lector físico:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => simulateScan('779123456006')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-left hover:border-emerald-500 transition-colors font-medium"
                  >
                    <div className="font-bold text-slate-800 dark:text-white">Coca Cola 500ml</div>
                    <div className="text-[10px] text-slate-400 font-mono">779123456006</div>
                  </button>
                  <button
                    onClick={() => simulateScan('779123456001')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-left hover:border-emerald-500 transition-colors font-medium"
                  >
                    <div className="font-bold text-slate-800 dark:text-white">Marlboro Box 20</div>
                    <div className="text-[10px] text-slate-400 font-mono">779123456001</div>
                  </button>
                  <button
                    onClick={() => simulateScan('779123456017')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-left hover:border-emerald-500 transition-colors font-medium"
                  >
                    <div className="font-bold text-slate-800 dark:text-white">Guaymallén Blanco</div>
                    <div className="text-[10px] text-slate-400 font-mono">779123456017</div>
                  </button>
                  <button
                    onClick={() => simulateScan('779123456009')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-left hover:border-emerald-500 transition-colors font-medium"
                  >
                    <div className="font-bold text-slate-800 dark:text-white">Monster Energy</div>
                    <div className="text-[10px] text-slate-400 font-mono">779123456009</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setShowScannerModal(false)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                Entendido, Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THERMAL RECEIPT MODAL (TICKET KEE ONDA) */}
      {showReceiptModal && lastCompletedSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-extrabold text-sm">¡Venta Confirmada!</span>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Thermal Receipt Box */}
            <div
              id="thermal-receipt"
              className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 space-y-2"
            >
              <div className="text-center pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                <div className="font-black text-sm tracking-widest text-red-600">*** KEE ONDA ***</div>
                <div className="text-[10px] text-slate-500">KIOSCO & ALMACÉN 24HS</div>
                <div className="text-[10px] text-slate-400 mt-1">Ticket #{lastCompletedSale.id}</div>
                <div className="text-[10px] text-slate-400">
                  {new Date(lastCompletedSale.date).toLocaleString('es-AR')}
                </div>
                <div className="text-[10px] text-slate-500">Cajero: {lastCompletedSale.cashier}</div>
              </div>

              {/* Items List */}
              <div className="space-y-1 py-1 border-b border-dashed border-slate-300 dark:border-slate-700">
                {lastCompletedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[170px]">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-bold font-mono">${item.subtotal.toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 pt-1 text-[11px]">
                <div className="flex justify-between font-black text-xs">
                  <span>TOTAL:</span>
                  <span className="font-mono">${lastCompletedSale.totalAmount.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Pago:</span>
                  <span>{lastCompletedSale.paymentMethod}</span>
                </div>
                {lastCompletedSale.paymentMethod === 'Efectivo' && (
                  <>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Recibido:</span>
                      <span className="font-mono">${lastCompletedSale.receivedCash.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-emerald-600">
                      <span>Vuelto:</span>
                      <span className="font-mono">${lastCompletedSale.changeCash.toLocaleString('es-AR')}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Cliente:</span>
                  <span>{lastCompletedSale.customerName}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-2 text-[10px] text-slate-400">
                ¡Gracias por tu compra! Kee Onda!
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={printReceipt}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
