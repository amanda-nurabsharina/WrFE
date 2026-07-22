import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { imsService } from "../../api/ims.service";
import {
  Layers,
  DollarSign,
  AlertTriangle,
  Clock,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Printer,
  PieChart,
  BarChart3,
  ShieldAlert,
  Building2,
  Calendar,
  CheckCircle2,
  FileSpreadsheet
} from "lucide-react";

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "velocity" | "category">("overview");

  const { data: response, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => imsService.getDashboard(),
  });

  const dashboardData = response?.data?.data || null;

  if (isLoading || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-sm font-semibold text-zinc-500">Memuat Data Laporan Eksekutif...</p>
      </div>
    );
  }

  const {
    summary,
    warnings,
    monthly_movements,
    fast_moving,
    slow_moving,
    category_distribution = []
  } = dashboardData;

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const handlePrintExecutiveSummary = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 select-none">
      {/* Dynamic Print CSS for Executive Summary One-Pager */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 12mm;
          }
          body * {
            visibility: hidden !important;
          }
          .executive-print-area, .executive-print-area * {
            visibility: visible !important;
          }
          .executive-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, sans-serif !important;
            padding: 0 !important;
            z-index: 999999 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      <div className="executive-print-area space-y-8">
        {/* Executive Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                Boardroom View
              </span>
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Updated: {new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white mt-1">
              Dashboard
            </h2>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Konsolidasi Real-Time Valuasi Aset Inventaris, Mitigasi Risiko Stok, dan Kinerja Operasional Gudang.
            </p>
          </div>

          <div className="flex items-center gap-3 no-print">
            <button
              onClick={handlePrintExecutiveSummary}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Cetak Ringkasan Eksekutif (PDF)
            </button>
          </div>
        </div>

        {/* Executive Highlight KPI Cards (Gradient Cards) */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Financial Asset Valuation */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/50 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign className="w-24 h-24 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block">
                Total Valuasi Aset Inventaris
              </span>
              <h3 className="text-2xl font-extrabold mt-2 tracking-tight text-emerald-400">
                {formatIDR(summary.total_value)}
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-indigo-900/60 flex justify-between items-center text-[11px] text-slate-300">
              <span>{summary.total_products} SKU Produk</span>
              <span className="font-bold text-indigo-200">{summary.total_stock?.toLocaleString()} Qty Stok</span>
            </div>
          </div>

          {/* Card 2: Financial Risk Exposure (At-Risk Expired Value) */}
          <div className="bg-gradient-to-br from-slate-900 to-rose-950 text-white rounded-2xl p-6 shadow-xl border border-rose-900/50 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldAlert className="w-24 h-24 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest block">
                Risiko Aset Expired (&lt; 90 Hari)
              </span>
              <h3 className="text-2xl font-extrabold mt-2 tracking-tight text-rose-400">
                {formatIDR(summary.at_risk_value || 0)}
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-rose-900/60 flex justify-between items-center text-[11px] text-rose-200">
              <span>{warnings.near_expired} Batch Waspada</span>
              <span className="font-bold text-red-400">{warnings.expired} Expired (Loss)</span>
            </div>
          </div>

          {/* Card 3: Warehouse Capacity & Utilization */}
          <div className="bg-gradient-to-br from-slate-900 to-sky-950 text-white rounded-2xl p-6 shadow-xl border border-sky-900/50 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Building2 className="w-24 h-24 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-sky-300 uppercase tracking-widest block">
                Utilisasi Kapasitas Rak Gudang
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-2xl font-extrabold tracking-tight text-sky-400">
                  {summary.warehouse_utilization_pct ? summary.warehouse_utilization_pct.toFixed(1) : "0.0"}%
                </h3>
                <span className="text-xs text-sky-300 font-medium">Terpakai</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-sky-900/60 flex justify-between items-center text-[11px] text-slate-300">
              <span>{summary.occupied_locations || 0} Terisi</span>
              <span className="font-bold text-sky-200">Dari {summary.total_locations || 0} Rak Bin</span>
            </div>
          </div>

          {/* Card 4: Active Batches & Movement Summary */}
          <div className="bg-gradient-to-br from-slate-900 to-amber-950 text-white rounded-2xl p-6 shadow-xl border border-amber-900/50 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Layers className="w-24 h-24 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">
                Total Lot Batch Aktif
              </span>
              <h3 className="text-2xl font-extrabold mt-2 tracking-tight text-amber-400">
                {summary.total_batches} Batch
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-900/60 flex justify-between items-center text-[11px] text-amber-200">
              <span>{warnings.low_stock} SKU Stok Menipis</span>
              <span className="font-bold text-amber-400">{warnings.out_of_stock} SKU Habis</span>
            </div>
          </div>
        </div>

        {/* Executive Risk Alert Status Strip */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-bold shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Ringkasan Peringatan Operasional Direksi
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-400 mt-0.5">
                Terdapat <strong className="text-red-600 dark:text-red-400">{warnings.critical_expired || 0} batch</strong> kadaluarsa &lt;30 hari dan <strong className="text-amber-600 dark:text-amber-300">{warnings.low_stock} SKU</strong> di bawah batas minimum stok yang butuh penanganan segera.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 bg-white dark:bg-zinc-800 border border-amber-300 dark:border-amber-700/50 rounded-lg text-xs font-bold text-amber-800 dark:text-amber-300 shadow-sm">
              Status: Action Required
            </span>
          </div>
        </div>

        {/* Executive Navigation Tabs (No Print) */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-sm font-bold no-print">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Pergerakan Stok & Valuasi
          </button>
          <button
            onClick={() => setActiveTab("velocity")}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "velocity"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Analisis Perputaran Barang (Velocity)
          </button>
          <button
            onClick={() => setActiveTab("category")}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "category"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <PieChart className="w-4 h-4" />
            Valuasi Kategori Produk
          </button>
        </div>

        {/* Tab 1: Overview & Movements */}
        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Chart: Monthly Movements */}
            <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    Tren Pergerakan Masuk vs Keluar (6 Bulan Terakhir)
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Perbandingan kuantitas barang yang diterima (Inbound) vs barang yang terpakai/dijual (Outbound).
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] rounded-lg border border-indigo-200 dark:border-indigo-800">
                  Total Ratio 1:1.1
                </span>
              </div>

              {/* Styled CSS Bar Chart */}
              <div className="mt-8 flex items-end justify-between gap-4 h-64 border-b border-zinc-150 dark:border-zinc-800 pb-2">
                {monthly_movements.map((move: any, index: number) => {
                  const maxVal = 250;
                  const inHeight = (move.inward / maxVal) * 100;
                  const outHeight = (move.outward / maxVal) * 100;

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center gap-2 h-48">
                        {/* Inward Bar */}
                        <div
                          style={{ height: `${inHeight}%` }}
                          className="w-5 bg-indigo-600 dark:bg-indigo-500 rounded-t-md hover:opacity-85 transition-opacity relative group shadow-sm"
                        >
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-20">
                            Masuk: {move.inward}
                          </span>
                        </div>
                        {/* Outward Bar */}
                        <div
                          style={{ height: `${outHeight}%` }}
                          className="w-5 bg-emerald-500 dark:bg-emerald-400 rounded-t-md hover:opacity-85 transition-opacity relative group shadow-sm"
                        >
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-20">
                            Keluar: {move.outward}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{move.month}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-6 mt-4 justify-center text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-indigo-600 rounded-sm inline-block"></span>
                  <span className="text-zinc-600 dark:text-zinc-400">Barang Masuk (Inbound Purchase)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block"></span>
                  <span className="text-zinc-600 dark:text-zinc-400">Barang Keluar (Outbound Sales)</span>
                </div>
              </div>
            </div>

            {/* Quick Financial Summary Panel */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <h4 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  Struktur Valuasi Stok
                </h4>
                
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-955 rounded-xl border border-zinc-150 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                      <span className="text-zinc-500 block font-medium">Stok Aman (Aktif)</span>
                      <span className="font-extrabold text-zinc-800 dark:text-zinc-200 text-sm">
                        {formatIDR(summary.total_value - (summary.at_risk_value || 0))}
                      </span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>

                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 flex justify-between items-center">
                    <div>
                      <span className="text-amber-800 dark:text-amber-400 block font-medium">Stok Berisiko Expired</span>
                      <span className="font-extrabold text-amber-900 dark:text-amber-300 text-sm">
                        {formatIDR(summary.at_risk_value || 0)}
                      </span>
                    </div>
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>

                  <div className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/40 flex justify-between items-center">
                    <div>
                      <span className="text-red-800 dark:text-red-400 block font-medium">Potensi Loss Expired</span>
                      <span className="font-extrabold text-red-900 dark:text-red-300 text-sm">
                        {warnings.expired} Batch ({formatIDR((summary.at_risk_value || 0) * 0.15)})
                      </span>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Action Links for Reports */}
              <div className="bg-indigo-600 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="font-bold text-sm">Butuh Laporan Lengkap?</h4>
                  <p className="text-xs text-indigo-100 mt-1">
                    Akses Modul Laporan Resmi untuk mengekspor data Mutasi, Stok Aging, dan Reorder Point ke Excel.
                  </p>
                </div>
                <a
                  href="/app/reporting"
                  className="px-4 py-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl text-xs text-center transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Buka Modul Laporan (Reporting)
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Velocity & Turnover */}
        {activeTab === "velocity" && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Fast Moving */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-150 dark:border-zinc-800 pb-3">
                <h4 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Fast Moving Stock (Perputaran Cepat)
                </h4>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">HIGH TURNOVER</span>
              </div>
              <div className="space-y-3">
                {fast_moving.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-955 rounded-xl border border-zinc-150 dark:border-zinc-800">
                    <div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm block">{item.name}</span>
                      <span className="text-[11px] text-zinc-400">Volume Terjual Tinggi minggu ini</span>
                    </div>
                    <div className="text-right">
                      <span className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-black block">
                        {item.qty} {item.unit}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">Turnover: {item.turnover || "High"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slow Moving */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-150 dark:border-zinc-800 pb-3">
                <h4 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-rose-500" />
                  Slow / Dead Moving Stock (Stok Mengendap)
                </h4>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-extrabold rounded-full">SLOW TURNOVER</span>
              </div>
              <div className="space-y-3">
                {slow_moving.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-955 rounded-xl border border-zinc-150 dark:border-zinc-800">
                    <div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm block">{item.name}</span>
                      <span className="text-[11px] text-rose-500 font-semibold">Mengendap &gt; {item.days_stagnant || 90} Hari</span>
                    </div>
                    <div className="text-right">
                      <span className="bg-rose-500 text-white px-3 py-1 rounded-lg text-xs font-black block">
                        {item.qty} {item.unit}
                      </span>
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1 block">Rekomendasi: Promo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Category Distribution */}
        {activeTab === "category" && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
            <h4 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
              <PieChart className="h-5 w-5 text-violet-500" />
              Distribusi Valuasi Inventaris per Kategori Produk
            </h4>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category_distribution.map((cat: any, idx: number) => {
                const pct = summary.total_value > 0 ? (cat.value / summary.total_value) * 100 : 0;
                return (
                  <div key={idx} className="p-4 bg-zinc-50 dark:bg-zinc-955 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200">{cat.category || "General"}</span>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div style={{ width: `${pct}%` }} className="bg-indigo-600 h-full rounded-full"></div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-zinc-500 pt-1">
                      <span>{cat.count} SKU Produk</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-100">{formatIDR(cat.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

