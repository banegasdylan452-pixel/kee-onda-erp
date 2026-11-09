import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import ConfigurableChart from './ConfigurableChart';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Scale,
  Percent,
  RefreshCw,
  Clock,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

export default function DashboardView() {
  const { sales, finances, products } = useApp();

  // Period filter: 'today' | 'day' | 'week' | 'custom-weeks' | 'month' | 'year'
  const [period, setPeriod] = useState('custom-weeks');
  const [numWeeks, setNumWeeks] = useState(6); // Default 6 weeks as requested
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Filter sales and finances according to the selected period
  const { filteredSales, filteredFinances, periodLabel, weekBuckets } = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let label = '';
    let buckets = [];

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      label = `Hoy (${startDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })})`;
    } else if (period === 'day') {
      const [year, month, day] = customDate.split('-').map(Number);
      startDate = new Date(year, month - 1, day, 0, 0, 0);
      endDate = new Date(year, month - 1, day, 23, 59, 59);
      label = `Día ${startDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    } else if (period === 'week') {
      const currentDay = now.getDay();
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      startDate = new Date(now);
      startDate.setDate(now.getDate() + diffToMonday);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      label = `Esta Semana (${startDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })})`;
    } else if (period === 'custom-weeks') {
      // Configurable number of weeks (e.g. 6 weeks)
      const weeksCount = Math.max(1, Number(numWeeks) || 6);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      startDate = new Date(now);
      startDate.setDate(now.getDate() - weeksCount * 7 + 1);
      startDate.setHours(0, 0, 0, 0);

      label = `Últimas ${weeksCount} Semanas (${startDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} al ${endDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })})`;

      // Create weekly chronological buckets for charts
      for (let w = 0; w < weeksCount; w++) {
        const bStart = new Date(startDate);
        bStart.setDate(startDate.getDate() + w * 7);
        const bEnd = new Date(bStart);
        bEnd.setDate(bStart.getDate() + 6);
        bEnd.setHours(23, 59, 59, 999);

        buckets.push({
          key: `Sem ${w + 1} (${bStart.getDate()}/${bStart.getMonth() + 1})`,
          start: bStart,
          end: bEnd,
        });
      }
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      label = `Este Mes (${startDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })})`;
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      label = `Este Año (${now.getFullYear()})`;
    }

    const fSales = sales.filter((s) => {
      const sDate = new Date(s.date);
      return sDate >= startDate && sDate <= endDate;
    });

    const fFinances = finances.filter((f) => {
      const fDate = new Date(f.date);
      return fDate >= startDate && fDate <= endDate;
    });

    return { filteredSales: fSales, filteredFinances: fFinances, periodLabel: label, weekBuckets: buckets };
  }, [sales, finances, period, numWeeks, customDate]);

  // Aggregate Financial & Sales Metrics
  const metrics = useMemo(() => {
    // Total gross sales from POS
    const totalSalesAmount = filteredSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    // Cost of goods sold (costo compra)
    const totalCostOfGoods = filteredSales.reduce((acc, s) => acc + (s.totalCost || 0), 0);
    // Gross profit on products sold
    const grossProfit = totalSalesAmount - totalCostOfGoods;
    const grossMarginPercent = totalSalesAmount > 0 ? ((grossProfit / totalSalesAmount) * 100).toFixed(1) : 0;

    // Separate finances:
    const totalEgresos = filteredFinances
      .filter((f) => f.type === 'egreso')
      .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);

    // Operational expenses excluding mercaderia to avoid double counting with COGS
    const operationalExpensesOnly = filteredFinances
      .filter((f) => f.type === 'egreso' && !f.category.includes('Mercadería'))
      .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);

    // Extra manual incomes
    const extraIncomes = filteredFinances
      .filter((f) => f.type === 'ingreso' && f.category !== 'Venta Kiosco')
      .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);

    // Total Ingresos = Ventas POS + Otros Ingresos
    const totalIngresos = totalSalesAmount + extraIncomes;

    // Net Balance = Total Ingresos - Total Egresos (strictly synchronized with Finanzas)
    const balanceNeto = totalIngresos - totalEgresos;

    // Average ticket & count
    const totalTickets = filteredSales.length;
    const avgTicket = totalTickets > 0 ? Math.round(totalSalesAmount / totalTickets) : 0;

    // Total units of products sold
    const totalUnitsSold = filteredSales.reduce(
      (acc, s) => acc + (s.items || []).reduce((sum, item) => sum + item.quantity, 0),
      0
    );

    return {
      totalIngresos,
      totalEgresos,
      totalSalesAmount,
      totalCostOfGoods,
      grossProfit,
      grossMarginPercent,
      balanceNeto,
      totalTickets,
      avgTicket,
      totalUnitsSold,
      extraIncomes,
      operationalExpensesOnly,
    };
  }, [filteredSales, filteredFinances]);

  // CHART 1: Top 10 Productos Más Vendidos
  const topProductsChartData = useMemo(() => {
    const productStats = {};
    filteredSales.forEach((s) => {
      (s.items || []).forEach((item) => {
        if (!productStats[item.name]) {
          productStats[item.name] = { units: 0, revenue: 0 };
        }
        productStats[item.name].units += item.quantity;
        productStats[item.name].revenue += item.subtotal;
      });
    });

    const sorted = Object.entries(productStats)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 8);

    return {
      labels: sorted.map(([name]) => (name.length > 20 ? name.slice(0, 18) + '...' : name)),
      datasets: [
        {
          label: 'Total Facturado ($)',
          data: sorted.map(([, stats]) => stats.revenue),
          backgroundColor: '#ef4444',
          borderColor: '#b91c1c',
        },
      ],
    };
  }, [filteredSales]);

  // CHART 2: Ingresos vs Egresos & Balance por Períodos (Días, Semanas agrupadas o Meses)
  const timelineChartData = useMemo(() => {
    // If custom-weeks is active, group accurately into week buckets!
    if (period === 'custom-weeks' && weekBuckets && weekBuckets.length > 0) {
      const labels = weekBuckets.map((b) => b.key);
      const ingresosData = labels.map(() => 0);
      const egresosData = labels.map(() => 0);

      filteredSales.forEach((s) => {
        const sTime = new Date(s.date).getTime();
        weekBuckets.forEach((bucket, idx) => {
          if (sTime >= bucket.start.getTime() && sTime <= bucket.end.getTime()) {
            ingresosData[idx] += s.totalAmount;
          }
        });
      });

      filteredFinances.forEach((f) => {
        const fTime = new Date(f.date).getTime();
        weekBuckets.forEach((bucket, idx) => {
          if (fTime >= bucket.start.getTime() && fTime <= bucket.end.getTime()) {
            if (f.type === 'ingreso' && f.category !== 'Venta Kiosco') {
              ingresosData[idx] += Number(f.amount);
            } else if (f.type === 'egreso') {
              egresosData[idx] += Number(f.amount);
            }
          }
        });
      });

      const balanceData = ingresosData.map((ing, idx) => ing - egresosData[idx]);

      return {
        labels,
        datasets: [
          {
            label: 'Ingresos Semanales',
            data: ingresosData,
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderColor: '#16a34a',
          },
          {
            label: 'Egresos Semanales',
            data: egresosData,
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderColor: '#dc2626',
          },
          {
            label: 'Balance Neto Semanal',
            data: balanceData,
            backgroundColor: 'rgba(59, 130, 246, 0.25)',
            borderColor: '#2563eb',
          },
        ],
      };
    }

    // Default daily or monthly grouping
    const groups = {};
    const formatKey = (d) => {
      const date = new Date(d);
      if (period === 'today' || period === 'day') {
        return `${date.getHours().toString().padStart(2, '0')}:00`;
      }
      if (period === 'week' || period === 'month') {
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }
      return date.toLocaleDateString('es-AR', { month: 'short' });
    };

    filteredSales.forEach((s) => {
      const k = formatKey(s.date);
      if (!groups[k]) groups[k] = { ingresos: 0, egresos: 0 };
      groups[k].ingresos += s.totalAmount;
    });

    filteredFinances.forEach((f) => {
      const k = formatKey(f.date);
      if (!groups[k]) groups[k] = { ingresos: 0, egresos: 0 };
      if (f.type === 'ingreso' && f.category !== 'Venta Kiosco') {
        groups[k].ingresos += Number(f.amount);
      } else if (f.type === 'egreso') {
        groups[k].egresos += Number(f.amount);
      }
    });

    const labels = Object.keys(groups);
    const ingresosData = labels.map((k) => groups[k].ingresos);
    const egresosData = labels.map((k) => groups[k].egresos);
    const balanceData = labels.map((k) => groups[k].ingresos - groups[k].egresos);

    return {
      labels,
      datasets: [
        {
          label: 'Ingresos Totales',
          data: ingresosData,
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
          borderColor: '#16a34a',
        },
        {
          label: 'Egresos Totales',
          data: egresosData,
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: '#dc2626',
        },
        {
          label: 'Balance Neto',
          data: balanceData,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: '#2563eb',
        },
      ],
    };
  }, [filteredSales, filteredFinances, period, weekBuckets]);

  // CHART 3: Desglose de Egresos por Categoría
  const expenseCategoryChartData = useMemo(() => {
    const categoriesMap = {};
    filteredFinances
      .filter((f) => f.type === 'egreso')
      .forEach((f) => {
        const cat = f.category || 'Otros';
        categoriesMap[cat] = (categoriesMap[cat] || 0) + Number(f.amount);
      });

    const labels = Object.keys(categoriesMap);
    const data = Object.values(categoriesMap);

    return {
      labels,
      datasets: [
        {
          label: 'Gasto ($)',
          data,
          backgroundColor: [
            '#ef4444',
            '#f59e0b',
            '#3b82f6',
            '#8b5cf6',
            '#10b981',
            '#ec4899',
            '#64748b',
          ],
        },
      ],
    };
  }, [filteredFinances]);

  // CHART 4: Ventas por Método de Pago
  const paymentMethodsChartData = useMemo(() => {
    const paymentMap = {};
    filteredSales.forEach((s) => {
      const method = s.paymentMethod || 'Efectivo';
      paymentMap[method] = (paymentMap[method] || 0) + s.totalAmount;
    });

    const labels = Object.keys(paymentMap);
    const data = Object.values(paymentMap);

    return {
      labels,
      datasets: [
        {
          label: 'Monto Cobrado ($)',
          data,
          backgroundColor: [
            '#10b981', // Efectivo
            '#06b6d4', // Mercado Pago
            '#3b82f6', // Débito
            '#8b5cf6', // Crédito
            '#f97316', // Cuenta Corriente
          ],
        },
      ],
    };
  }, [filteredSales]);

  // CHART 5: Ventas por Categoría de Producto
  const categorySalesChartData = useMemo(() => {
    const catMap = {};
    filteredSales.forEach((s) => {
      (s.items || []).forEach((item) => {
        const cat = item.category || 'Varios';
        catMap[cat] = (catMap[cat] || 0) + item.subtotal;
      });
    });

    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([cat]) => cat);
    const data = sorted.map(([, total]) => total);

    return {
      labels,
      datasets: [
        {
          label: 'Venta por Categoría ($)',
          data,
          backgroundColor: '#dc2626',
          borderColor: '#b91c1c',
        },
      ],
    };
  }, [filteredSales]);

  return (
    <div className="space-y-6">
      {/* Top Bar with Period Selector & Date Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Dashboard Analítico
            </h2>
            <span className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900">
              KEE ONDA
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-red-600" />
            Mostrando datos para: <strong className="text-slate-700 dark:text-slate-200">{periodLabel}</strong>
          </p>
        </div>

        {/* Period Selector Tabs and Custom Range */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center flex-wrap">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === 'today'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setPeriod('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === 'day'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === 'week'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Esta Semana
            </button>

            {/* Custom Weeks Button (e.g. 6 Semanas) */}
            <button
              onClick={() => setPeriod('custom-weeks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                period === 'custom-weeks'
                  ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-400/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{numWeeks} Semanas</span>
            </button>

            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === 'month'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === 'year'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Año
            </button>
          </div>

          {/* Sub-controls when 'custom-weeks' is active */}
          {period === 'custom-weeks' && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in">
              <span className="text-[11px] font-bold text-slate-500 pl-1.5">Semanas:</span>
              {[2, 4, 6, 8, 12].map((w) => (
                <button
                  key={w}
                  onClick={() => setNumWeeks(w)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                    numWeeks === w
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {w} sem
                </button>
              ))}
              <div className="flex items-center pl-1 border-l border-slate-200 dark:border-slate-700">
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={numWeeks}
                  onChange={(e) => setNumWeeks(Number(e.target.value) || 1)}
                  className="w-12 text-center text-xs font-bold py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Date Picker if "Día" is selected */}
          {period === 'day' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos Totales */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ingresos Totales
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
              ${metrics.totalIngresos.toLocaleString('es-AR')}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-medium">Ventas POS:</span> ${metrics.totalSalesAmount.toLocaleString('es-AR')}
              {metrics.extraIncomes > 0 && (
                <span className="text-xs text-slate-400"> + ${metrics.extraIncomes.toLocaleString('es-AR')} extras</span>
              )}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        {/* Egresos Totales */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm relative overflow-hidden group hover:border-red-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Egresos Totales
            </span>
            <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
              ${metrics.totalEgresos.toLocaleString('es-AR')}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Incluye luz, gas, alquiler, mercadería y gastos operativos
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600"></div>
        </div>

        {/* Costo de Compra */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Costo de Compra (Vendido)
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
              ${metrics.totalCostOfGoods.toLocaleString('es-AR')}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span>Ganancia Bruta:</span>
              <strong className="text-emerald-600 font-bold">
                +${metrics.grossProfit.toLocaleString('es-AR')} ({metrics.grossMarginPercent}%)
              </strong>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </div>

        {/* Balance Neto */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Balance Neto
            </span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              metrics.balanceNeto >= 0
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600'
            }`}>
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-black tracking-tight font-mono ${
              metrics.balanceNeto >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'
            }`}>
              ${metrics.balanceNeto.toLocaleString('es-AR')}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {metrics.balanceNeto >= 0 ? 'Superávit operativo' : 'Déficit operativo'} · Sincronizado con Finanzas
            </p>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${
            metrics.balanceNeto >= 0 ? 'bg-blue-600' : 'bg-rose-600'
          }`}></div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="text-center p-2">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tickets Emitidos</div>
          <div className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">{metrics.totalTickets}</div>
        </div>
        <div className="text-center p-2 border-l border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ticket Promedio</div>
          <div className="text-lg font-bold text-slate-800 dark:text-white mt-0.5 font-mono">${metrics.avgTicket.toLocaleString('es-AR')}</div>
        </div>
        <div className="text-center p-2 border-l border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Unidades Vendidas</div>
          <div className="text-lg font-bold text-slate-800 dark:text-white mt-0.5 font-mono">{metrics.totalUnitsSold} u.</div>
        </div>
        <div className="text-center p-2 border-l border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Margen Promedio</div>
          <div className="text-lg font-bold text-emerald-600 mt-0.5 font-mono">{metrics.grossMarginPercent}%</div>
        </div>
      </div>

      {/* Main Charts Row 1: Top Products & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Productos Más Vendidos */}
        <ConfigurableChart
          title="Top Productos Más Vendidos"
          subtitle="Productos con mayor volumen de recaudación en el período"
          labels={topProductsChartData.labels}
          datasets={topProductsChartData.datasets}
          defaultType="bar"
          allowedTypes={['bar', 'doughnut', 'pie', 'line']}
          allowPercent={true}
          valuePrefix="$"
          height={320}
        />

        {/* Ingresos vs Egresos & Balance por Períodos */}
        <ConfigurableChart
          title={period === 'custom-weeks' ? `Evolución Semanal (${numWeeks} Semanas)` : 'Evolución: Ingresos vs Egresos & Balance'}
          subtitle="Comparativa temporal de entradas, salidas y resultado neto"
          labels={timelineChartData.labels}
          datasets={timelineChartData.datasets}
          defaultType="line"
          allowedTypes={['line', 'bar']}
          allowPercent={false}
          valuePrefix="$"
          height={320}
        />
      </div>

      {/* Main Charts Row 2: Desglose de Gastos, Métodos de Pago, Categorías */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Desglose de Egresos por Categoría */}
        <ConfigurableChart
          title="Gastos por Categoría"
          subtitle="Distribución de egresos (Luz, Alquiler, Mercadería, etc.)"
          labels={expenseCategoryChartData.labels}
          datasets={expenseCategoryChartData.datasets}
          defaultType="doughnut"
          allowedTypes={['doughnut', 'pie', 'bar']}
          allowPercent={true}
          valuePrefix="$"
          height={290}
        />

        {/* Ventas por Método de Pago */}
        <ConfigurableChart
          title="Ventas por Método de Pago"
          subtitle="Efectivo, Mercado Pago QR, Débito, Tarjetas y Fiados"
          labels={paymentMethodsChartData.labels}
          datasets={paymentMethodsChartData.datasets}
          defaultType="pie"
          allowedTypes={['pie', 'doughnut', 'bar']}
          allowPercent={true}
          valuePrefix="$"
          height={290}
        />

        {/* Ventas por Categoría de Producto */}
        <ConfigurableChart
          title="Ventas por Categoría"
          subtitle="Cigarrillos, Bebidas, Golosinas, Fiambres, etc."
          labels={categorySalesChartData.labels}
          datasets={categorySalesChartData.datasets}
          defaultType="bar"
          allowedTypes={['bar', 'doughnut', 'pie', 'line']}
          allowPercent={true}
          valuePrefix="$"
          height={290}
        />
      </div>
    </div>
  );
}
