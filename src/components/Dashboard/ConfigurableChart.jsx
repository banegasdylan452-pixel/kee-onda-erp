import React, { useState, useMemo } from 'react';
import 'chart.js/auto';
import '../../utils/chartSetup';
import { Chart } from 'react-chartjs-2';
import { BarChart3, PieChart, LineChart, Percent, DollarSign, HelpCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const CHART_TYPES = [
  { id: 'bar', label: 'Barra', icon: BarChart3 },
  { id: 'doughnut', label: 'Dona', icon: PieChart },
  { id: 'pie', label: 'Círculo / Torta', icon: PieChart },
  { id: 'line', label: 'Línea', icon: LineChart },
];

const DEFAULT_PALETTE = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#6366f1', // Indigo
];

export default function ConfigurableChart({
  title,
  subtitle,
  labels = [],
  datasets = [],
  defaultType = 'bar',
  allowedTypes = ['bar', 'doughnut', 'pie', 'line'],
  allowPercent = true,
  valuePrefix = '$',
  unit = '',
  height = 280,
}) {
  const { darkMode } = useApp();
  const [chartType, setChartType] = useState(defaultType);
  const [showPercent, setShowPercent] = useState(false);

  // Compute percentage transformed data if requested
  const processedData = useMemo(() => {
    const isSingleDatasetArc = chartType === 'doughnut' || chartType === 'pie' || chartType === 'polarArea';

    // Calculate total per dataset or overall for percentage conversion
    const transformedDatasets = datasets.map((ds, idx) => {
      const rawValues = ds.data || [];
      const totalSum = rawValues.reduce((acc, v) => acc + (Number(v) || 0), 0);

      let finalValues = rawValues;
      if (showPercent && totalSum > 0) {
        finalValues = rawValues.map((v) => Number(((Number(v) / totalSum) * 100).toFixed(1)));
      }

      // Ensure colors
      const bgColors = ds.backgroundColor || (isSingleDatasetArc ? DEFAULT_PALETTE.slice(0, rawValues.length) : DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length]);
      const borderColors = ds.borderColor || (isSingleDatasetArc ? '#ffffff' : DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length]);

      return {
        ...ds,
        data: finalValues,
        rawOriginalData: rawValues,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: chartType === 'line' ? 3 : 1.5,
        fill: chartType === 'line' ? (ds.fill !== undefined ? ds.fill : true) : undefined,
        tension: chartType === 'line' ? 0.35 : undefined,
        pointRadius: chartType === 'line' ? 4 : undefined,
        pointHoverRadius: chartType === 'line' ? 6 : undefined,
      };
    });

    return {
      labels,
      datasets: transformedDatasets,
    };
  }, [labels, datasets, chartType, showPercent]);

  // Options configuration adjusted for dark mode & percentage
  const chartOptions = useMemo(() => {
    const textColor = darkMode ? '#cbd5e1' : '#475569';
    const gridColor = darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const isArc = chartType === 'doughnut' || chartType === 'pie' || chartType === 'polarArea';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: isArc || datasets.length > 1,
          position: isArc ? 'right' : 'top',
          labels: {
            color: textColor,
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '500' },
            boxWidth: 12,
            padding: 12,
          },
        },
        tooltip: {
          backgroundColor: darkMode ? '#1e293b' : '#0f172a',
          titleColor: '#ffffff',
          bodyColor: '#e2e8f0',
          borderColor: darkMode ? '#334155' : '#cbd5e1',
          borderWidth: 1,
          padding: 10,
          boxPadding: 4,
          usePointStyle: true,
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || context.label || '';
              const val = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
              const originalVal = context.dataset.rawOriginalData
                ? context.dataset.rawOriginalData[context.dataIndex]
                : val;

              if (showPercent) {
                const originalFmt = typeof originalVal === 'number' ? originalVal.toLocaleString('es-AR') : originalVal;
                return ` ${label ? label + ': ' : ''}${val}% (${valuePrefix}${originalFmt} ${unit})`;
              }
              const formatted = typeof val === 'number' ? val.toLocaleString('es-AR') : val;
              return ` ${label ? label + ': ' : ''}${valuePrefix}${formatted} ${unit}`;
            },
          },
        },
      },
      scales: isArc
        ? undefined
        : {
            x: {
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                maxRotation: 45,
                minRotation: 0,
              },
            },
            y: {
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                callback: function (val) {
                  if (showPercent) return `${val}%`;
                  if (val >= 1000000) return `${valuePrefix}${(val / 1000000).toFixed(1)}M`;
                  if (val >= 1000) return `${valuePrefix}${(val / 1000).toFixed(0)}k`;
                  return `${valuePrefix}${val}`;
                },
              },
            },
          },
      animation: {
        duration: 500,
      },
    };
  }, [darkMode, chartType, showPercent, datasets.length, valuePrefix, unit]);

  const activeTypes = CHART_TYPES.filter((t) => allowedTypes.includes(t.id));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between">
      {/* Header with Title and Individual Chart Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Custom Controls Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Chart type selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            {activeTypes.map((type) => {
              const Icon = type.icon;
              const isActive = chartType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setChartType(type.id)}
                  title={`Formato: ${type.label}`}
                  className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                    isActive
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* Percentage Toggle Switch */}
          {allowPercent && (
            <button
              onClick={() => setShowPercent(!showPercent)}
              title={showPercent ? 'Ver en montos/cantidades reales' : 'Activar visualización por porcentaje (%)'}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
                showPercent
                  ? 'bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-400/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              {showPercent ? (
                <>
                  <Percent className="w-3.5 h-3.5" />
                  <span>% Porcentaje</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{valuePrefix ? '$ Monto' : 'Unidades'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Render Chart */}
      <div style={{ height: `${height}px` }} className="w-full relative">
        {labels.length === 0 || (datasets[0]?.data || []).length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
            <HelpCircle className="w-8 h-8 mb-2 opacity-50" />
            No hay datos para el período seleccionado
          </div>
        ) : (
          <Chart key={`${chartType}-${showPercent}`} type={chartType} data={processedData} options={chartOptions} />
        )}
      </div>
    </div>
  );
}

