import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  ArrowRight
} from "lucide-react";

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "velocity" | "category">("overview");
  const queryClient = useQueryClient();

  const { data: response, isLoading, isRefetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => imsService.getDashboard(),
  });

  const dashboardData = response?.data?.data || null;

  if (isLoading || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-sm font-semibold text-zinc-500">Memuat Data Laporan Eksekutif Gudang...</p>
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

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return (
    <div className="w-full space-y-6 md:space-y-8 animate-in fade-in duration-300 select-none pb-12">
      {/* Dynamic Print & Landscape CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (orientation: landscape) {
          .landscape-full {
            width: 100% !important;
            max-width: 100% !important;
          }
        }
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
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

      <div className="executive-print-area space-y-6 md:space-y-8 w-full">
        {/* Executive Dashboard Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6 w-full">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                Boardroom View
              </span>
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Updated: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white mt-2">
              Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-3xl">
              Konsolidasi real-time valuasi aset inventaris, analisis perputaran barang, mitigasi risiko kadaluarsa, dan efisiensi ruang gudang.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-center no-print">
            <button
              onClick={handleRefresh}
              disabled={isRefetching}
              className="p-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-sm transition-all text-xs font-semibold flex items-center gap-1.5"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-500 ${isRefetching ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handlePrintExecutiveSummary}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan</span>
            </button>

          </div>
        </div>

        {/* Dynamic Responsive KPI Cards Grid (Landscape Full Auto Grid) */}
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
          {/* Card 1: Total Financial Asset Valuation */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 md:p-6 shadow-xl border border-indigo-800/40 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/50 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none">
              <DollarSign className="w-24 h-24 text-indigo-400" />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                  Total Valuasi Aset Stok
                </span>
                <span className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black mt-3 tracking-tight text-emerald-400">
                {formatIDR(summary.total_value)}
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-indigo-900/60 flex justify-between items-center text-[11px] text-slate-300">
              <span className="font-medium">{summary.total_products} SKU Produk</span>
              <span className="font-extrabold text-indigo-200 bg-indigo-900/40 px-2 py-0.5 rounded-full border border-indigo-800/50">
                {summary.total_stock?.toLocaleString()} Qty Stok
              </span>
            </div>
          </div>

          {/* Card 2: Financial Risk Exposure (At-Risk Expired Value) */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 text-white rounded-2xl p-5 md:p-6 shadow-xl border border-rose-800/40 flex flex-col justify-between relative overflow-hidden group hover:border-rose-500/50 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none">
              <ShieldAlert className="w-24 h-24 text-rose-400" />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest">
                  Risiko Expired (&lt; 90 Hari)
                </span>
                <span className="p-1.5 bg-rose-500/20 text-rose-300 rounded-lg text-xs">
                  <ShieldAlert className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black mt-3 tracking-tight text-rose-400">
                {formatIDR(summary.at_risk_value || 0)}
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-rose-900/60 flex justify-between items-center text-[11px] text-rose-200">
              <span className="font-medium">{warnings.near_expired} Batch Waspada</span>
              <span className="font-extrabold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800/50">
                {warnings.expired} Expired (Loss)
              </span>
            </div>
          </div>

          {/* Card 3: Warehouse Capacity & Utilization */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white rounded-2xl p-5 md:p-6 shadow-xl border border-sky-800/40 flex flex-col justify-between relative overflow-hidden group hover:border-sky-500/50 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none">
              <Building2 className="w-24 h-24 text-sky-400" />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-sky-300 uppercase tracking-widest">
                  Utilisasi Rak Gudang
                </span>
                <span className="p-1.5 bg-sky-500/20 text-sky-300 rounded-lg text-xs">
                  <Building2 className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-sky-400">
                  {summary.warehouse_utilization_pct ? summary.warehouse_utilization_pct.toFixed(1) : "0.0"}%
                </h3>
                <span className="text-xs text-sky-300 font-medium">Kapasitas Terisi</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-sky-900/60 flex justify-between items-center text-[11px] text-slate-300">
              <span className="font-medium">{summary.occupied_locations || 0} Rak Terisi</span>
              <span className="font-extrabold text-sky-200 bg-sky-900/40 px-2 py-0.5 rounded-full border border-sky-800/50">
                Total {summary.total_locations || 0} Rak Bin
              </span>
            </div>
          </div>

          {/* Card 4: Active Batches & Stock Warning */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white rounded-2xl p-5 md:p-6 shadow-xl border border-amber-800/40 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/50 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none">
              <Layers className="w-24 h-24 text-amber-400" />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest">
                  Total Lot Batch Aktif
                </span>
                <span className="p-1.5 bg-amber-500/20 text-amber-300 rounded-lg text-xs">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black mt-3 tracking-tight text-amber-400">
                {summary.total_batches} Lot Batch
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-900/60 flex justify-between items-center text-[11px] text-amber-200">
              <span className="font-medium">{warnings.low_stock} SKU Stok Menipis</span>
              <span className="font-extrabold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/50">
                {warnings.out_of_stock} Habis
              </span>
            </div>
          </div>
        </div>

        {/* Executive Risk Alert Status Strip */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-bold shrink-0 shadow-md">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Status Operasional Ringkasan Direksi
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-400 mt-0.5">
                Terdapat <strong className="text-red-600 dark:text-red-400">{warnings.critical_expired || 0} batch</strong> kadaluarsa &lt;30 hari dan <strong className="text-amber-600 dark:text-amber-300">{warnings.low_stock} SKU</strong> di bawah batas minimum stok yang memerlukan reorder/tindakan.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="px-3 py-1 bg-white dark:bg-zinc-800 border border-amber-300 dark:border-amber-700/50 rounded-xl text-xs font-extrabold text-amber-800 dark:text-amber-300 shadow-sm">
              Status: Action Required
            </span>
          </div>
        </div>

        {/* Executive Navigation Tabs (No Print) */}
        <div className="flex flex-wrap border-b border-zinc-200 dark:border-zinc-800 gap-2 sm:gap-6 text-xs sm:text-sm font-extrabold no-print w-full">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-1 transition-all border-b-2 flex items-center gap-2 ${
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
            className={`pb-3 px-1 transition-all border-b-2 flex items-center gap-2 ${
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
            className={`pb-3 px-1 transition-all border-b-2 flex items-center gap-2 ${
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
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 w-full">
            {/* Chart: Monthly Movements */}
            <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    Tren Pergerakan Masuk vs Keluar (6 Bulan Terakhir)
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Perbandingan kuantitas barang yang diterima (Inbound) vs barang yang terpakai/dijual (Outbound).
                  </p>
                </div>
                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-[11px] rounded-xl border border-indigo-200 dark:border-indigo-800/60 self-start sm:self-center shrink-0">
                  Ratio: 1 : 1.1
                </span>
              </div>

              {/* Styled CSS Bar Chart */}
              <div className="mt-8 flex items-end justify-between gap-3 sm:gap-6 h-64 border-b border-zinc-150 dark:border-zinc-800 pb-2 w-full overflow-x-auto">
                {monthly_movements.map((move: any, index: number) => {
                  const maxVal = 250;
                  const inHeight = Math.min((move.inward / maxVal) * 100, 100);
                  const outHeight = Math.min((move.outward / maxVal) * 100, 100);

                  return (
                    <div key={index} className="flex-1 min-w-[45px] flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2 h-48">
                        {/* Inward Bar */}
                        <div
                          style={{ height: `${inHeight}%` }}
                          className="w-4 sm:w-6 bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-t-md hover:opacity-90 transition-all relative group shadow-sm"
                        >
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-20 pointer-events-none">
                            Masuk: {move.inward}
                          </span>
                        </div>
                        {/* Outward Bar */}
                        <div
                          style={{ height: `${outHeight}%` }}
                          className="w-4 sm:w-6 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md hover:opacity-90 transition-all relative group shadow-sm"
                        >
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-20 pointer-events-none">
                            Keluar: {move.outward}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">{move.month}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-4 sm:gap-6 mt-4 justify-center text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-indigo-600 rounded-sm inline-block shadow-sm"></span>
                  <span className="text-zinc-600 dark:text-zinc-400">Barang Masuk (Inbound Purchase)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block shadow-sm"></span>
                  <span className="text-zinc-600 dark:text-zinc-400">Barang Keluar (Outbound Sales)</span>
                </div>
              </div>
            </div>

            {/* Quick Financial Summary Panel */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6 w-full">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 md:p-6 shadow-sm">
                <h4 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  Struktur Valuasi Stok
                </h4>
                
                <div className="space-y-3.5 text-xs">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-955 rounded-xl border border-zinc-150 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                      <span className="text-zinc-500 block font-medium">Stok Aman (Aktif)</span>
                      <span className="font-black text-zinc-850 dark:text-zinc-200 text-sm mt-0.5 block">
                        {formatIDR(summary.total_value - (summary.at_risk_value || 0))}
                      </span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  </div>

                  <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 flex justify-between items-center">
                    <div>
                      <span className="text-amber-800 dark:text-amber-400 block font-medium">Stok Berisiko Expired</span>
                      <span className="font-black text-amber-900 dark:text-amber-300 text-sm mt-0.5 block">
                        {formatIDR(summary.at_risk_value || 0)}
                      </span>
                    </div>
                    <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                  </div>

                  <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40 flex justify-between items-center">
                    <div>
                      <span className="text-rose-800 dark:text-rose-400 block font-medium">Potensi Loss Expired</span>
                      <span className="font-black text-rose-900 dark:text-rose-300 text-sm mt-0.5 block">
                        {warnings.expired} Batch ({formatIDR((summary.at_risk_value || 0) * 0.15)})
                      </span>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Action Links for Reports */}
              <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white rounded-2xl p-5 md:p-6 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="font-black text-base">Butuh Laporan Lengkap?</h4>
                  <p className="text-xs text-indigo-100 mt-1">
                    Akses Modul Laporan Resmi untuk mengekspor data Mutasi, Stok Aging, dan Reorder Point ke Excel & PDF.
                  </p>
                </div>
                <a
                  href="/app/reporting"
                  className="px-4 py-2.5 bg-white text-indigo-800 hover:bg-indigo-50 font-black rounded-xl text-xs text-center transition-all shadow-md flex items-center justify-center gap-2 group"
                >
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>Buka Modul Laporan (Reporting)</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Velocity & Turnover */}
        {activeTab === "velocity" && (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 w-full">
            {/* Fast Moving */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 w-full">
              <div className="flex justify-between items-center border-b border-zinc-150 dark:border-zinc-800 pb-3">
                <h4 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Fast Moving Stock (Perputaran Cepat)
                </h4>
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black rounded-full border border-emerald-200 dark:border-emerald-800/60">
                  HIGH TURNOVER
                </span>
              </div>
              <div className="space-y-3">
                {fast_moving.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3.5 bg-zinc-50 dark:bg-zinc-955 rounded-xl border border-zinc-150 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm block">{item.name}</span>
                        <span className="text-[11px] text-zinc-400">Volume Terjual Tinggi minggu ini</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-black block shadow-sm">
                        {item.qty} {item.unit}
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">Turnover: {item.turnover || "High"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slow Moving */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 w-full">
              <div className="flex justify-between items-center border-b border-zinc-150 dark:border-zinc-800 pb-3">
                <h4 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-rose-500" />
                  Slow / Dead Moving Stock (Stok Mengendap)
                </h4>
                <span className="px-2.5 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-black rounded-full border border-rose-200 dark:border-rose-800/60">
                  SLOW TURNOVER
                </span>
              </div>
              <div className="space-y-3">
                {slow_moving.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3.5 bg-zinc-50 dark:bg-zinc-955 rounded-xl border border-zinc-150 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-black text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm block">{item.name}</span>
                        <span className="text-[11px] text-rose-500 font-semibold">Mengendap &gt; {item.days_stagnant || 90} Hari</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="bg-rose-500 text-white px-3 py-1 rounded-lg text-xs font-black block shadow-sm">
                        {item.qty} {item.unit}
                      </span>
                      <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 mt-1 block">Rekomendasi: Promo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Category Distribution */}
        {activeTab === "category" && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-6 w-full">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-500" />
                Distribusi Valuasi Inventaris per Kategori Produk
              </h4>
              <span className="text-xs text-zinc-400 font-bold">
                Total {category_distribution.length} Kategori
              </span>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 w-full">
              {category_distribution.map((cat: any, idx: number) => {
                const pct = summary.total_value > 0 ? (cat.value / summary.total_value) * 100 : 0;
                return (
                  <div key={idx} className="p-4 bg-zinc-50 dark:bg-zinc-955 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-3 hover:border-indigo-400 dark:hover:border-indigo-700 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 truncate pr-2">{cat.category || "General"}</span>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full shrink-0">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div style={{ width: `${pct}%` }} className="bg-gradient-to-r from-indigo-500 to-indigo-700 h-full rounded-full transition-all"></div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-zinc-500 pt-1">
                      <span>{cat.count} SKU Produk</span>
                      <span className="font-extrabold text-zinc-850 dark:text-zinc-100">{formatIDR(cat.value)}</span>
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
