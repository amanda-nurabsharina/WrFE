import { useQuery } from "@tanstack/react-query";
import { imsService } from "../../api/ims.service";
import {
  Package,
  Layers,
  Archive,
  DollarSign,
  AlertTriangle,
  Clock,
  TrendingDown,
  TrendingUp,
  AlertCircle
} from "lucide-react";

export const Dashboard = () => {
  const { data: response, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => imsService.getDashboard(),
  });

  const dashboardData = response?.data?.data || null;

  if (isLoading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const { summary, warnings, monthly_movements, fast_moving, slow_moving } = dashboardData;

  const kpis = [
    { label: "Total Barang", value: summary.total_products, icon: Package, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-300" },
    { label: "Total Batch", value: summary.total_batches, icon: Layers, color: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-300" },
    { label: "Total Stok", value: summary.total_stock, icon: Archive, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300" },
    {
      label: "Nilai Inventory",
      value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(summary.total_value),
      icon: DollarSign,
      color: "text-violet-600 bg-violet-50 dark:bg-violet-950 dark:text-violet-300"
    },
  ];

  const warningCards = [
    { label: "Barang Expired", value: warnings.expired, icon: AlertCircle, color: "border-red-100 dark:border-red-950 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-300" },
    { label: "Hampir Expired (<90d)", value: warnings.near_expired, icon: Clock, color: "border-amber-100 dark:border-amber-950 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300" },
    { label: "Low Stock", value: warnings.low_stock, icon: TrendingDown, color: "border-orange-100 dark:border-orange-950 bg-orange-50/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300" },
    { label: "Out of Stock", value: warnings.out_of_stock, icon: AlertTriangle, color: "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Inventory Overview
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Real-time metrics, alerts, and stock movements.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center gap-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
            <div className={`p-4 rounded-xl ${kpi.color}`}>
              <kpi.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                {kpi.label}
              </p>
              <h3 className="text-xl font-bold text-zinc-800 dark:text-white mt-1">
                {kpi.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Warning Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {warningCards.map((warn, idx) => (
          <div key={idx} className={`border rounded-2xl p-5 shadow-none flex items-center justify-between ${warn.color}`}>
            <div className="flex items-center gap-3">
              <warn.icon className="h-5 w-5 shrink-0" />
              <span className="text-sm font-semibold">{warn.label}</span>
            </div>
            <span className="text-2xl font-black">{warn.value}</span>
          </div>
        ))}
      </div>

      {/* Analytics Dashboard Sections */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Charts: Monthly Inward & Outward */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-md font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Stock Movements (Last 6 Months)
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Comparison of items received (In) vs issued (Out)
            </p>
          </div>

          {/* Styled CSS Bar Chart */}
          <div className="mt-8 flex items-end justify-between gap-4 h-64 border-b border-zinc-150 dark:border-zinc-800 pb-2">
            {monthly_movements.map((move: any, index: number) => {
              const maxVal = 250;
              const inHeight = (move.inward / maxVal) * 100;
              const outHeight = (move.outward / maxVal) * 100;

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center gap-1.5 h-48">
                    {/* Inward Bar */}
                    <div
                      style={{ height: `${inHeight}%` }}
                      className="w-4 bg-indigo-500 rounded-t-sm hover:opacity-85 transition-opacity relative group"
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        In: {move.inward}
                      </span>
                    </div>
                    {/* Outward Bar */}
                    <div
                      style={{ height: `${outHeight}%` }}
                      className="w-4 bg-emerald-500 rounded-t-sm hover:opacity-85 transition-opacity relative group"
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Out: {move.outward}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400 font-semibold uppercase">{move.month}</span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 mt-4 justify-center text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-indigo-500 rounded-sm inline-block"></span>
              <span className="text-zinc-500">Barang Masuk (In)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block"></span>
              <span className="text-zinc-500">Barang Keluar (Out)</span>
            </div>
          </div>
        </div>

        {/* Fast & Slow Moving Items */}
        <div className="lg:col-span-4 space-y-6">
          {/* Fast Moving */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-zinc-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Fast Moving Stock
            </h4>
            <div className="mt-4 space-y-4">
              {fast_moving.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b border-zinc-100 dark:border-zinc-850 pb-2">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.name}</span>
                  <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 px-2.5 py-1 rounded-full font-bold">
                    {item.qty} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Slow Moving */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-zinc-800 dark:text-white flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-rose-500" />
              Slow Moving Stock
            </h4>
            <div className="mt-4 space-y-4">
              {slow_moving.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b border-zinc-100 dark:border-zinc-850 pb-2">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.name}</span>
                  <span className="bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300 px-2.5 py-1 rounded-full font-bold">
                    {item.qty} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
