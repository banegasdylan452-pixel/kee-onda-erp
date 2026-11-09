import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AppContext = createContext();

const STORAGE_KEY = 'KEE_ONDA_ERP_EMPTY_V2';

// UUID validation helper for Postgres UUID columns
const isValidUuid = (val) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

// -------------------------------------------------------------
// Helper Mappers between CamelCase (React) and SnakeCase (SQL)
// -------------------------------------------------------------
const mapProductFromDb = (p) => ({
  id: p.id,
  barcode: p.barcode || '',
  name: p.name,
  category: p.category || 'Varios',
  costPrice: Number(p.cost_price) || 0,
  sellPrice: Number(p.sell_price) || 0,
  stock: Number(p.stock) || 0,
  minStock: Number(p.min_stock) || 5,
  supplier: p.supplier || '',
});

const mapProductToDb = (p) => ({
  barcode: p.barcode || '',
  name: p.name,
  category: p.category || 'Varios',
  cost_price: Number(p.costPrice) || 0,
  sell_price: Number(p.sellPrice) || 0,
  stock: Number(p.stock) || 0,
  min_stock: Number(p.minStock) || 5,
  supplier: p.supplier || '',
});

const mapCustomerFromDb = (c) => ({
  id: c.id,
  name: c.name,
  phone: c.phone || '',
  address: c.address || '',
  debt: Number(c.debt) || 0,
  limit: Number(c.credit_limit) || 20000,
  notes: c.notes || '',
  lastPaymentDate: c.last_payment_date || null,
});

const mapCustomerToDb = (c) => ({
  name: c.name,
  phone: c.phone || '',
  address: c.address || '',
  debt: Number(c.debt) || 0,
  credit_limit: Number(c.limit) || 20000,
  notes: c.notes || '',
  last_payment_date: c.lastPaymentDate || null,
});

const mapFinanceFromDb = (f) => ({
  id: f.id,
  type: f.type,
  category: f.category,
  description: f.description || '',
  amount: Number(f.amount) || 0,
  costAmount: Number(f.cost_amount) || 0,
  paymentMethod: f.payment_method || 'Efectivo',
  date: f.date,
  referenceId: f.reference_id || null,
});

const mapFinanceToDb = (f) => ({
  id: f.id,
  type: f.type,
  category: f.category,
  description: f.description || '',
  amount: Number(f.amount) || 0,
  cost_amount: Number(f.costAmount) || 0,
  payment_method: f.paymentMethod || 'Efectivo',
  date: f.date,
  reference_id: f.referenceId || null,
});

export function AppProvider({ children }) {
  const [supabaseConnected, setSupabaseConnected] = useState(isSupabaseConfigured());
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Auth state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_USER`);
    return saved ? JSON.parse(saved) : { id: 'u-1', username: 'Kioscokeonda', name: 'Dueño KEE ONDA', role: 'admin' };
  });

  // Dark Mode state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_DARK`);
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Business State (COMPLETELY EMPTY BY DEFAULT)
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sales, setSales] = useState([]);
  const [finances, setFinances] = useState([]);
  const [cashShift, setCashShift] = useState({
    isOpen: false,
    openedAt: null,
    closedAt: null,
    initialCash: 0,
    countedCash: 0,
    cashier: 'Dueño (Admin)',
    notes: '',
  });

  // Sync Dark Mode with <html> class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(`${STORAGE_KEY}_DARK`, JSON.stringify(darkMode));
  }, [darkMode]);

  // -------------------------------------------------------------
  // Load data: From Supabase (if configured) or empty LocalStorage
  // -------------------------------------------------------------
  const fetchAllFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      setLoading(true);

      const [
        { data: catData },
        { data: prodData },
        { data: custData },
        { data: suppData },
        { data: salesData },
        { data: itemsData },
        { data: finData },
        { data: shiftData },
      ] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('*').order('name'),
        supabase.from('customers').select('*').order('name'),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('sales').select('*').order('date', { ascending: false }),
        supabase.from('sale_items').select('*'),
        supabase.from('finances').select('*').order('date', { ascending: false }),
        supabase.from('cash_shifts').select('*').order('created_at', { ascending: false }).limit(1),
      ]);

      if (catData) setCategories(catData);
      if (prodData) setProducts(prodData.map(mapProductFromDb));
      if (custData) setCustomers(custData.map(mapCustomerFromDb));
      if (suppData) setSuppliers(suppData);

      // Reconstruct sales with line items
      const validSaleIds = new Set();
      if (salesData) {
        const itemsMap = {};
        (itemsData || []).forEach((item) => {
          if (!itemsMap[item.sale_id]) itemsMap[item.sale_id] = [];
          itemsMap[item.sale_id].push({
            productId: item.product_id,
            name: item.name,
            category: item.category,
            price: Number(item.price),
            costPrice: Number(item.cost_price),
            quantity: Number(item.quantity),
            subtotal: Number(item.subtotal),
            subcost: Number(item.subcost),
          });
        });

        const mappedSales = salesData.map((s) => {
          validSaleIds.add(s.id);
          return {
            id: s.id,
            date: s.date,
            totalAmount: Number(s.total_amount),
            totalCost: Number(s.total_cost),
            profit: Number(s.profit),
            paymentMethod: s.payment_method,
            customerName: s.customer_name,
            cashier: s.cashier,
            receivedCash: Number(s.received_cash),
            changeCash: Number(s.change_cash),
            items: itemsMap[s.id] || [],
          };
        });
        setSales(mappedSales);
      } else {
        setSales([]);
      }

      // Map and sanitize finances: purge any orphaned "Venta Kiosco" entries without a valid sale in salesData
      if (finData) {
        const mappedFinances = finData.map(mapFinanceFromDb);
        const cleanFinances = mappedFinances.filter((f) => {
          if (f.category === 'Venta Kiosco') {
            return f.referenceId && validSaleIds.has(f.referenceId);
          }
          return true;
        });
        setFinances(cleanFinances);

        // Clean orphaned entries from Supabase table to keep DB permanently clean
        const orphanedInDb = finData.filter(
          (f) => f.category === 'Venta Kiosco' && (!f.reference_id || !validSaleIds.has(f.reference_id))
        );
        if (orphanedInDb.length > 0 && supabase) {
          const orphanIds = orphanedInDb.map((o) => o.id);
          supabase.from('finances').delete().in('id', orphanIds).then(() => {});
        }
      } else {
        setFinances([]);
      }

      if (shiftData && shiftData.length > 0) {
        const s = shiftData[0];
        setCashShift({
          id: s.id,
          isOpen: s.is_open,
          openedAt: s.opened_at,
          closedAt: s.closed_at,
          initialCash: Number(s.initial_cash),
          countedCash: Number(s.counted_cash),
          cashier: s.cashier,
          notes: s.notes || '',
          closingNotes: s.closing_notes || '',
        });
      }

      setSupabaseConnected(true);
    } catch (err) {
      console.warn('Error fetching data from Supabase, operating locally:', err);
      setSupabaseConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchAllFromSupabase();
    } else {
      // Load clean local state if any exists
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.categories) setCategories(parsed.categories);
          if (parsed.products) setProducts(parsed.products);
          if (parsed.customers) setCustomers(parsed.customers);
          if (parsed.suppliers) setSuppliers(parsed.suppliers);
          if (parsed.sales) setSales(parsed.sales);
          if (parsed.finances) {
            const validSaleIds = new Set((parsed.sales || []).map((s) => s.id));
            const cleanFin = parsed.finances.filter((f) => {
              if (f.category === 'Venta Kiosco') {
                return f.referenceId && validSaleIds.has(f.referenceId);
              }
              return true;
            });
            setFinances(cleanFin);
          }
          if (parsed.cashShift) setCashShift(parsed.cashShift);
        }
      } catch (e) {
        console.warn('LocalStorage load error:', e);
      }
    }
    setInitialized(true);
  }, [fetchAllFromSupabase]);

  // Persist locally as fallback
  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ categories, products, customers, suppliers, sales, finances, cashShift })
      );
    } catch (e) {
      // safe fallback
    }
  }, [categories, products, customers, suppliers, sales, finances, cashShift, initialized]);

  // Auth
  const login = (username, password) => {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (cleanUser === 'kioscokeonda' && cleanPass === '1656') {
      const u = { id: 'u-1', username: 'Kioscokeonda', name: 'Dueño KEE ONDA (Admin)', role: 'admin' };
      setUser(u);
      localStorage.setItem(`${STORAGE_KEY}_USER`, JSON.stringify(u));
      return { success: true };
    }
    if (cleanUser === 'cajero' && (cleanPass === '1656' || cleanPass === '1234')) {
      const u = { id: 'u-2', username: 'cajero', name: 'Cajero KEE ONDA', role: 'cajero' };
      setUser(u);
      localStorage.setItem(`${STORAGE_KEY}_USER`, JSON.stringify(u));
      return { success: true };
    }
    // Also allow admin as fallback
    if (cleanUser === 'admin' && (cleanPass === '1656' || cleanPass === '1234')) {
      const u = { id: 'u-1', username: 'Kioscokeonda', name: 'Dueño KEE ONDA (Admin)', role: 'admin' };
      setUser(u);
      localStorage.setItem(`${STORAGE_KEY}_USER`, JSON.stringify(u));
      return { success: true };
    }

    return {
      success: false,
      message: 'Usuario o contraseña incorrectos. Usuario: Kioscokeonda | Clave: 1656',
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(`${STORAGE_KEY}_USER`);
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // -------------------------------------------------------------
  // PRODUCTS CRUD
  // -------------------------------------------------------------
  const addProduct = async (prodData) => {
    const cleanBarcode = (prodData.barcode || '').trim();
    if (cleanBarcode) {
      const existing = products.find(
        (p) => (p.barcode || '').trim().toLowerCase() === cleanBarcode.toLowerCase()
      );
      if (existing) {
        return {
          error: `El código de barra "${cleanBarcode}" ya pertenece al producto "${existing.name}". No se pueden duplicar códigos.`,
          existingProduct: existing,
        };
      }
    }

    const newProd = {
      ...prodData,
      barcode: cleanBarcode,
      id: `prod-${Date.now()}`,
      stock: Number(prodData.stock) || 0,
      minStock: Number(prodData.minStock) || 5,
      costPrice: Number(prodData.costPrice) || 0,
      sellPrice: Number(prodData.sellPrice) || 0,
    };

    setProducts((prev) => [newProd, ...prev]);

    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('products').insert([mapProductToDb(newProd)]).select();
        if (data && data[0]) {
          setProducts((prev) => prev.map((p) => (p.id === newProd.id ? mapProductFromDb(data[0]) : p)));
        }
      } catch (err) {
        console.error('Supabase addProduct error:', err);
      }
    }
    return { success: true, product: newProd };
  };

  const updateProduct = async (id, updatedFields) => {
    if (updatedFields.barcode !== undefined) {
      const cleanBarcode = (updatedFields.barcode || '').trim();
      if (cleanBarcode) {
        const existing = products.find(
          (p) =>
            p.id !== id &&
            (p.barcode || '').trim().toLowerCase() === cleanBarcode.toLowerCase()
        );
        if (existing) {
          return {
            error: `El código de barra "${cleanBarcode}" ya pertenece a "${existing.name}". No se pueden duplicar códigos.`,
            existingProduct: existing,
          };
        }
      }
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...updatedFields,
              stock: Number(updatedFields.stock !== undefined ? updatedFields.stock : p.stock),
              minStock: Number(updatedFields.minStock !== undefined ? updatedFields.minStock : p.minStock),
              costPrice: Number(updatedFields.costPrice !== undefined ? updatedFields.costPrice : p.costPrice),
              sellPrice: Number(updatedFields.sellPrice !== undefined ? updatedFields.sellPrice : p.sellPrice),
            }
          : p
      )
    );

    if (supabase && isSupabaseConfigured()) {
      try {
        const payload = {};
        if (updatedFields.name !== undefined) payload.name = updatedFields.name;
        if (updatedFields.barcode !== undefined) payload.barcode = updatedFields.barcode;
        if (updatedFields.category !== undefined) payload.category = updatedFields.category;
        if (updatedFields.costPrice !== undefined) payload.cost_price = Number(updatedFields.costPrice);
        if (updatedFields.sellPrice !== undefined) payload.sell_price = Number(updatedFields.sellPrice);
        if (updatedFields.stock !== undefined) payload.stock = Number(updatedFields.stock);
        if (updatedFields.minStock !== undefined) payload.min_stock = Number(updatedFields.minStock);
        if (updatedFields.supplier !== undefined) payload.supplier = updatedFields.supplier;

        await supabase.from('products').update(payload).eq('id', id);
      } catch (err) {
        console.error('Supabase updateProduct error:', err);
      }
    }
  };

  const deleteProduct = async (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase deleteProduct error:', err);
      }
    }
  };

  const bulkUpdatePrices = async ({ categoryName, percentage }) => {
    const factor = 1 + percentage / 100;
    const updatedList = products.map((p) => {
      if (!categoryName || categoryName === 'TODOS' || p.category === categoryName) {
        const newSell = Math.round((p.sellPrice * factor) / 10) * 10;
        return { ...p, sellPrice: newSell };
      }
      return p;
    });

    setProducts(updatedList);

    if (supabase && isSupabaseConfigured()) {
      try {
        // Update in Supabase
        for (const p of updatedList) {
          if (!categoryName || categoryName === 'TODOS' || p.category === categoryName) {
            await supabase.from('products').update({ sell_price: p.sellPrice }).eq('id', p.id);
          }
        }
      } catch (err) {
        console.error('Supabase bulkUpdatePrices error:', err);
      }
    }
  };

  // -------------------------------------------------------------
  // CATEGORIES CRUD
  // -------------------------------------------------------------
  const addCategory = async (category) => {
    const newCat = {
      id: `cat-${Date.now()}`,
      name: category.name,
      color: category.color || '#ef4444',
    };
    setCategories((prev) => [...prev, newCat]);

    if (supabase && isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('categories').insert([{ name: newCat.name, color: newCat.color }]).select();
        if (data && data[0]) {
          setCategories((prev) => prev.map((c) => (c.id === newCat.id ? data[0] : c)));
        }
      } catch (err) {
        console.error('Supabase addCategory error:', err);
      }
    }
  };

  const deleteCategory = async (id) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase deleteCategory error:', err);
      }
    }
  };

  // -------------------------------------------------------------
  // CUSTOMERS (CRM / FIAR)
  // -------------------------------------------------------------
  const addCustomer = async (customerData) => {
    const newCust = {
      ...customerData,
      id: `cust-${Date.now()}`,
      debt: Number(customerData.debt) || 0,
      limit: Number(customerData.limit) || 20000,
      lastPaymentDate: null,
    };
    setCustomers((prev) => [...prev, newCust]);

    if (supabase && isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('customers').insert([mapCustomerToDb(newCust)]).select();
        if (data && data[0]) {
          setCustomers((prev) => prev.map((c) => (c.id === newCust.id ? mapCustomerFromDb(data[0]) : c)));
        }
      } catch (err) {
        console.error('Supabase addCustomer error:', err);
      }
    }
  };

  const updateCustomer = async (id, fields) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...fields } : c)));
    if (supabase && isSupabaseConfigured()) {
      try {
        const payload = {};
        if (fields.name !== undefined) payload.name = fields.name;
        if (fields.phone !== undefined) payload.phone = fields.phone;
        if (fields.address !== undefined) payload.address = fields.address;
        if (fields.debt !== undefined) payload.debt = Number(fields.debt);
        if (fields.limit !== undefined) payload.credit_limit = Number(fields.limit);
        if (fields.notes !== undefined) payload.notes = fields.notes;
        if (fields.lastPaymentDate !== undefined) payload.last_payment_date = fields.lastPaymentDate;
        await supabase.from('customers').update(payload).eq('id', id);
      } catch (err) {
        console.error('Supabase updateCustomer error:', err);
      }
    }
  };

  const recordCustomerPayment = async (customerId, amount, paymentMethod, notes = '') => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;
    const paidAmount = Number(amount);
    const nowIso = new Date().toISOString();
    const newDebt = Math.max(0, cust.debt - paidAmount);

    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, debt: newDebt, lastPaymentDate: nowIso.split('T')[0] } : c))
    );

    const newFin = {
      id: `FIN-COB-${Date.now()}`,
      type: 'ingreso',
      category: 'Cobro de Cuenta Corriente',
      description: `Cobro fiado a ${cust.name}: ${notes || 'Pago de deuda'}`,
      amount: paidAmount,
      costAmount: 0,
      paymentMethod,
      date: nowIso,
      referenceId: customerId,
    };
    setFinances((prev) => [newFin, ...prev]);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('customers').update({ debt: newDebt, last_payment_date: nowIso.split('T')[0] }).eq('id', customerId);
        await supabase.from('finances').insert([mapFinanceToDb(newFin)]);
      } catch (err) {
        console.error('Supabase recordCustomerPayment error:', err);
      }
    }
  };

  // -------------------------------------------------------------
  // SALES & POS WITH FULL SUPABASE SYNC
  // -------------------------------------------------------------
  const addSale = async ({ items, paymentMethod, customerName, receivedCash = 0, changeCash = 0 }) => {
    const saleId = `VTA-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    let totalAmount = 0;
    let totalCost = 0;

    // Deduct stock in memory
    const updatedProducts = [...products];
    const saleItems = items.map((item) => {
      const prodIdx = updatedProducts.findIndex((p) => p.id === item.productId);
      if (prodIdx >= 0) {
        const currentProd = updatedProducts[prodIdx];
        updatedProducts[prodIdx] = {
          ...currentProd,
          stock: Math.max(0, currentProd.stock - item.quantity),
        };
      }
      const subtotal = item.price * item.quantity;
      const subcost = (item.costPrice || 0) * item.quantity;
      totalAmount += subtotal;
      totalCost += subcost;

      return {
        ...item,
        subtotal,
        subcost,
      };
    });

    const newSale = {
      id: saleId,
      date: nowIso,
      items: saleItems,
      totalAmount,
      totalCost,
      profit: totalAmount - totalCost,
      paymentMethod,
      customerName: customerName || 'Consumidor Final',
      cashier: user ? user.name : 'Dueño (Admin)',
      receivedCash,
      changeCash,
    };

    setProducts(updatedProducts);
    setSales((prev) => [newSale, ...prev]);

    // Financial entry
    const newFinanceEntry = {
      id: `FIN-ING-${saleId}`,
      type: 'ingreso',
      category: 'Venta Kiosco',
      description: `Venta POS #${saleId} (${paymentMethod})`,
      amount: totalAmount,
      costAmount: totalCost,
      paymentMethod,
      date: nowIso,
      referenceId: saleId,
    };

    setFinances((prev) => [newFinanceEntry, ...prev]);

    // Update customer debt if Cuenta Corriente
    if (paymentMethod === 'Cuenta Corriente' && customerName) {
      setCustomers((prev) =>
        prev.map((c) => (c.name === customerName ? { ...c, debt: (c.debt || 0) + totalAmount } : c))
      );
    }

    // Persist to Supabase
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('sales').insert([
          {
            id: newSale.id,
            date: newSale.date,
            total_amount: newSale.totalAmount,
            total_cost: newSale.totalCost,
            profit: newSale.profit,
            payment_method: newSale.paymentMethod,
            customer_name: newSale.customerName,
            cashier: newSale.cashier,
            received_cash: newSale.receivedCash,
            change_cash: newSale.changeCash,
          },
        ]);

        const dbItems = saleItems.map((item) => ({
          sale_id: newSale.id,
          product_id: isValidUuid(item.productId) ? item.productId : null,
          name: item.name,
          category: item.category,
          price: item.price,
          cost_price: item.costPrice || 0,
          quantity: item.quantity,
          subtotal: item.subtotal,
          subcost: item.subcost,
        }));
        await supabase.from('sale_items').insert(dbItems);

        await supabase.from('finances').insert([mapFinanceToDb(newFinanceEntry)]);

        // Update product stocks in Supabase
        for (const item of saleItems) {
          const p = updatedProducts.find((pr) => pr.id === item.productId);
          if (p && isValidUuid(p.id)) {
            await supabase.from('products').update({ stock: p.stock }).eq('id', p.id);
          }
        }

        if (paymentMethod === 'Cuenta Corriente' && customerName) {
          const cust = customers.find((c) => c.name === customerName);
          if (cust && isValidUuid(cust.id)) {
            await supabase.from('customers').update({ debt: (cust.debt || 0) + totalAmount }).eq('id', cust.id);
          }
        }
      } catch (err) {
        console.error('Supabase sale insert error:', err);
      }
    }

    return newSale;
  };

  // DELETE SALE (Anular venta y reponer stock)
  const deleteSale = async (saleId) => {
    const saleToDelete = sales.find((s) => s.id === saleId);
    if (!saleToDelete) return false;

    // 1. Replenish product inventory stock
    const updatedProducts = [...products];
    (saleToDelete.items || []).forEach((item) => {
      const pIdx = updatedProducts.findIndex((p) => p.id === item.productId);
      if (pIdx >= 0) {
        updatedProducts[pIdx] = {
          ...updatedProducts[pIdx],
          stock: updatedProducts[pIdx].stock + item.quantity,
        };
      }
    });
    setProducts(updatedProducts);

    // 2. Remove from finances
    setFinances((prevFinances) =>
      prevFinances.filter((f) => f.referenceId !== saleId && f.id !== `FIN-ING-${saleId}`)
    );

    // 3. Revert customer debt
    if (saleToDelete.paymentMethod === 'Cuenta Corriente' && saleToDelete.customerName) {
      setCustomers((prevCustomers) =>
        prevCustomers.map((c) =>
          c.name === saleToDelete.customerName
            ? { ...c, debt: Math.max(0, (c.debt || 0) - saleToDelete.totalAmount) }
            : c
        )
      );
    }

    // 4. Remove from sales
    setSales((prevSales) => prevSales.filter((s) => s.id !== saleId));

    // Delete in Supabase
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('sale_items').delete().eq('sale_id', saleId);
        await supabase.from('sales').delete().eq('id', saleId);
        await supabase.from('finances').delete().eq('reference_id', saleId);
        await supabase.from('finances').delete().eq('id', `FIN-ING-${saleId}`);

        // Update product stock in DB
        for (const item of saleToDelete.items || []) {
          const p = updatedProducts.find((pr) => pr.id === item.productId);
          if (p && !p.id.startsWith('prod-')) {
            await supabase.from('products').update({ stock: p.stock }).eq('id', p.id);
          }
        }

        if (saleToDelete.paymentMethod === 'Cuenta Corriente' && saleToDelete.customerName) {
          const cust = customers.find((c) => c.name === saleToDelete.customerName);
          if (cust && !cust.id.startsWith('cust-')) {
            await supabase.from('customers').update({ debt: Math.max(0, (cust.debt || 0) - saleToDelete.totalAmount) }).eq('id', cust.id);
          }
        }
      } catch (err) {
        console.error('Supabase deleteSale error:', err);
      }
    }

    return true;
  };

  // -------------------------------------------------------------
  // FINANCES (INGRESOS Y EGRESOS MANUALES)
  // -------------------------------------------------------------
  const addFinanceMovement = async ({ type, category, description, amount, paymentMethod, date, costAmount = 0 }) => {
    const numAmount = Number(amount);
    const newEntry = {
      id: `FIN-${type === 'egreso' ? 'EGR' : 'ING'}-${Date.now()}`,
      type,
      category,
      description,
      amount: numAmount,
      costAmount: type === 'egreso' ? numAmount : Number(costAmount),
      paymentMethod: paymentMethod || 'Efectivo',
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      referenceId: null,
    };
    setFinances((prev) => [newEntry, ...prev]);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('finances').insert([mapFinanceToDb(newEntry)]);
      } catch (err) {
        console.error('Supabase addFinanceMovement error:', err);
      }
    }
  };

  const deleteFinanceMovement = async (id) => {
    setFinances((prev) => prev.filter((f) => f.id !== id));
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('finances').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase deleteFinanceMovement error:', err);
      }
    }
  };

  // -------------------------------------------------------------
  // CASH SHIFTS (ARQUEO DE CAJA)
  // -------------------------------------------------------------
  const openCashShift = async (initialCash, cashier, notes) => {
    const shift = {
      id: `shift-${Date.now()}`,
      isOpen: true,
      openedAt: new Date().toISOString(),
      closedAt: null,
      initialCash: Number(initialCash),
      countedCash: 0,
      cashier: cashier || (user ? user.name : 'Dueño'),
      notes: notes || '',
    };
    setCashShift(shift);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('cash_shifts').insert([
          {
            is_open: true,
            opened_at: shift.openedAt,
            initial_cash: shift.initialCash,
            cashier: shift.cashier,
            notes: shift.notes,
          },
        ]);
      } catch (err) {
        console.error('Supabase openCashShift error:', err);
      }
    }
  };

  const closeCashShift = async (countedCash, closingNotes) => {
    const updated = {
      ...cashShift,
      isOpen: false,
      closedAt: new Date().toISOString(),
      countedCash: Number(countedCash),
      closingNotes: closingNotes || '',
    };
    setCashShift(updated);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('cash_shifts').update({
          is_open: false,
          closed_at: updated.closedAt,
          counted_cash: updated.countedCash,
          closing_notes: updated.closingNotes,
        }).eq('is_open', true);
      } catch (err) {
        console.error('Supabase closeCashShift error:', err);
      }
    }
  };

  // -------------------------------------------------------------
  // SUPPLIER PURCHASES (RECEPCIÓN MERCADERÍA)
  // -------------------------------------------------------------
  const addSupplierPurchase = async ({ supplierName, items, totalAmount, paymentMethod, invoiceNumber }) => {
    const nowIso = new Date().toISOString();
    const updatedProducts = [...products];

    if (items && items.length > 0) {
      items.forEach((item) => {
        const idx = updatedProducts.findIndex((p) => p.id === item.productId);
        if (idx >= 0) {
          updatedProducts[idx] = {
            ...updatedProducts[idx],
            stock: updatedProducts[idx].stock + Number(item.quantity),
            costPrice: Number(item.costPrice) || updatedProducts[idx].costPrice,
          };
        }
      });
      setProducts(updatedProducts);
    }

    addFinanceMovement({
      type: 'egreso',
      category: 'Mercadería / Proveedores',
      description: `Compra Proveedor: ${supplierName} (Factura #${invoiceNumber || 'S/N'})`,
      amount: totalAmount,
      paymentMethod,
      date: nowIso,
    });
  };

  // Reset to clean empty state
  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCategories([]);
    setProducts([]);
    setCustomers([]);
    setSuppliers([]);
    setSales([]);
    setFinances([]);
    setCashShift({
      isOpen: false,
      openedAt: null,
      closedAt: null,
      initialCash: 0,
      countedCash: 0,
      cashier: 'Dueño (Admin)',
      notes: '',
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        darkMode,
        toggleDarkMode,
        supabaseConnected,
        loading,
        categories,
        products,
        customers,
        suppliers,
        sales,
        finances,
        cashShift,
        addSale,
        deleteSale,
        addProduct,
        updateProduct,
        deleteProduct,
        bulkUpdatePrices,
        addCategory,
        deleteCategory,
        addCustomer,
        updateCustomer,
        recordCustomerPayment,
        addFinanceMovement,
        deleteFinanceMovement,
        openCashShift,
        closeCashShift,
        addSupplierPurchase,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
