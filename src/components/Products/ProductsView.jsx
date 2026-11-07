import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  TrendingUp,
  AlertTriangle,
  Barcode,
  Layers,
  ArrowUpDown,
  Tag,
  DollarSign,
  X,
  Check,
  Percent,
} from 'lucide-react';

export default function ProductsView() {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    bulkUpdatePrices,
    addCategory,
    deleteCategory,
    suppliers,
  } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL' | 'LOW' | 'OUT'

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);

  // Form State for Add/Edit Product
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: categories[0]?.name || 'Golosinas y Chocolates',
    costPrice: '',
    sellPrice: '',
    stock: '',
    minStock: '5',
    supplier: suppliers[0]?.name || '',
  });

  // Bulk Price Form State
  const [bulkCategory, setBulkCategory] = useState('TODOS');
  const [bulkPercent, setBulkPercent] = useState('10');

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#ef4444');

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm));
      const matchesCat =
        selectedCategory === 'TODOS' || p.category === selectedCategory;

      let matchesStock = true;
      if (stockFilter === 'LOW') matchesStock = p.stock > 0 && p.stock <= p.minStock;
      if (stockFilter === 'OUT') matchesStock = p.stock <= 0;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchTerm, selectedCategory, stockFilter]);

  // Open modal for new product
  const handleOpenNew = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      barcode: `779${Math.floor(100000000 + Math.random() * 900000000)}`,
      category: categories[0]?.name || 'Golosinas y Chocolates',
      costPrice: '',
      sellPrice: '',
      stock: '20',
      minStock: '5',
      supplier: suppliers[0]?.name || '',
    });
    setShowProductModal(true);
  };

  // Open modal for editing
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode || '',
      category: product.category,
      costPrice: product.costPrice.toString(),
      sellPrice: product.sellPrice.toString(),
      stock: product.stock.toString(),
      minStock: (product.minStock || 5).toString(),
      supplier: product.supplier || '',
    });
    setShowProductModal(true);
  };

  // Save product (new or update)
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sellPrice) {
      alert('Nombre y precio de venta son obligatorios.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      barcode: formData.barcode.trim(),
      category: formData.category,
      costPrice: Number(formData.costPrice) || 0,
      sellPrice: Number(formData.sellPrice) || 0,
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 5,
      supplier: formData.supplier,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }

    setShowProductModal(false);
  };

  // Apply Bulk Price Markup
  const handleApplyBulkPrices = (e) => {
    e.preventDefault();
    const pct = Number(bulkPercent);
    if (!pct || isNaN(pct)) {
      alert('Ingresa un porcentaje válido.');
      return;
    }

    bulkUpdatePrices({
      categoryName: bulkCategory,
      percentage: pct,
    });

    alert(`¡Aumento del ${pct}% aplicado correctamente a los productos!`);
    setShowBulkPriceModal(false);
  };

  // Add category
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({ name: newCatName.trim(), color: newCatColor });
    setNewCatName('');
  };

  // Profit margin calculation for form
  const formMargin = useMemo(() => {
    const cost = Number(formData.costPrice) || 0;
    const sell = Number(formData.sellPrice) || 0;
    if (sell === 0) return { profit: 0, percent: 0 };
    const profit = sell - cost;
    const percent = ((profit / sell) * 100).toFixed(1);
    return { profit, percent };
  }, [formData.costPrice, formData.sellPrice]);

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Catálogo de Productos
            </h2>
            <span className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900">
              {products.length} productos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión de precios, costos, márgenes de ganancia, stock e inventario de KEE ONDA
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowCategoriesModal(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5"
          >
            <Tag className="w-3.5 h-3.5 text-red-600" />
            <span>Categorías ({categories.length})</span>
          </button>

          <button
            onClick={() => setShowBulkPriceModal(true)}
            className="px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 flex items-center gap-1.5"
          >
            <Percent className="w-3.5 h-3.5 text-amber-600" />
            <span>Aumento Masivo (%)</span>
          </button>

          <button
            onClick={handleOpenNew}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o código de barra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Stock Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setStockFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                stockFilter === 'ALL'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStockFilter('LOW')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                stockFilter === 'LOW'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Stock Bajo</span>
            </button>
            <button
              onClick={() => setStockFilter('OUT')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                stockFilter === 'OUT'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Sin Stock
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('TODOS')}
            className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'TODOS'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Todas las Categorías
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat.name
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Producto / Código</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3 text-right">Costo Compra</th>
                <th className="py-3 px-3 text-right">Precio Venta</th>
                <th className="py-3 px-3 text-right">Margen</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron productos con los criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const profit = p.sellPrice - p.costPrice;
                  const marginPct = p.sellPrice > 0 ? ((profit / p.sellPrice) * 100).toFixed(1) : 0;
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock <= p.minStock;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 dark:text-white">{p.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Barcode className="w-3 h-3" />
                          <span>{p.barcode || 'S/C'}</span>
                          {p.supplier && <span className="text-slate-500 font-sans">· {p.supplier}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-slate-500 dark:text-slate-400">
                        ${p.costPrice.toLocaleString('es-AR')}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        ${p.sellPrice.toLocaleString('es-AR')}
                      </td>

                      <td className="py-3 px-3 text-right font-semibold">
                        <span
                          className={`text-xs ${
                            profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                          }`}
                        >
                          +${profit.toLocaleString('es-AR')} ({marginPct}%)
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          }`}
                        >
                          {p.stock} u.
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Editar producto"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar producto "${p.name}"?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            title="Eliminar producto"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT PRODUCT */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-red-600" />
                <span>{editingProduct ? 'Editar Producto' : 'Cargar Nuevo Producto'}</span>
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Coca Cola 500ml / Marlboro Box 20"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Código de Barra / SKU
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Escanear o ingresar"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full text-xs sm:text-sm py-2 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <Barcode className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Costo Compra ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej: 1500"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Precio Venta ($) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Ej: 2400"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-black text-red-600"
                  />
                </div>
              </div>

              {/* Real-time Profit Preview */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Margen Calculado:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  +${formMargin.profit.toLocaleString('es-AR')} ({formMargin.percent}% margen)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Stock Inicial / Actual
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Stock Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Proveedor
                </label>
                <select
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                >
                  <option value="">(Sin proveedor asignado)</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BULK PRICE MARKUP */}
      {showBulkPriceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-amber-500" />
                <span>Aumento Masivo de Precios</span>
              </h3>
              <button
                onClick={() => setShowBulkPriceModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyBulkPrices} className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aplica un incremento porcentual a los precios de venta de tus productos de forma automática y redondeada.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Categoría a Modificar
                </label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  <option value="TODOS">TODOS LOS PRODUCTOS (General)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Porcentaje de Aumento (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={bulkPercent}
                    onChange={(e) => setBulkPercent(e.target.value)}
                    placeholder="Ej: 10, 15, 20"
                    className="w-full text-sm py-2 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-black focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <Percent className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Quick % buttons */}
              <div className="flex items-center gap-2">
                {[5, 10, 15, 20, 25].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBulkPercent(val.toString())}
                    className="flex-1 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-950/40"
                  >
                    +{val}%
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkPriceModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm"
                >
                  Aplicar Aumento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CATEGORIES MANAGEMENT */}
      {showCategoriesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-red-600" />
                <span>Gestión de Categorías</span>
              </h3>
              <button
                onClick={() => setShowCategoriesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Nueva categoría (ej: Bebidas Energizantes)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </form>

            {/* Categories List */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {categories.map((c) => {
                const count = products.filter((p) => p.category === c.name).length;
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                      <span className="text-[10px] text-slate-400">({count} prod.)</span>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la categoría "${c.name}"?`)) {
                          deleteCategory(c.id);
                        }
                      }}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 text-right">
              <button
                onClick={() => setShowCategoriesModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-200"
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

