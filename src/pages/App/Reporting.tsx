import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { imsService } from "../../api/ims.service";
import { 
  FileSpreadsheet, 
  TrendingUp, 
  Clock, 
  ArrowLeftRight, 
  Download, 
  RefreshCw, 
  Layers, 
  AlertCircle,
  AlertTriangle
} from "lucide-react";
import { useToast } from "../../components/ui";

export const Reporting = () => {
  const { toast } = useToast();
  
  // Tab State: "value" | "aging" | "mutation" | "distribution" | "reorder"
  const [activeTab, setActiveTab] = React.useState<"value" | "aging" | "mutation" | "distribution" | "reorder">("value");

  // General Filter States
  const [categoryId, setCategoryId] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("");
  const [productId, setProductId] = React.useState("");
  const [subCategory, setSubCategory] = React.useState("");
  
  // Reorder Point Filters
  const [leadTime, setLeadTime] = React.useState(7);
  const [needsRestockOnly, setNeedsRestockOnly] = React.useState(false);
  
  // Date states
  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = React.useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Reset filters when changing tabs
  React.useEffect(() => {
    setCategoryId("");
    setWarehouseId("");
    setProductId("");
    setSubCategory("");
  }, [activeTab]);

  // Fetch Meta Dropdowns
  const { data: warehousesResp } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => imsService.getWarehouses()
  });
  const warehouses = warehousesResp?.data?.data || [];

  const { data: productsResp } = useQuery({
    queryKey: ["products"],
    queryFn: () => imsService.getProducts()
  });
  const products = productsResp?.data?.data || [];

  // Fetch Report Data based on active tab
  const { 
    data: valueReportResp, 
    isLoading: isValueLoading
  } = useQuery({
    queryKey: ["report-value", categoryId, warehouseId],
    queryFn: () => imsService.getInventoryValueReport(categoryId, warehouseId),
    enabled: activeTab === "value"
  });

  const { 
    data: agingReportResp, 
    isLoading: isAgingLoading
  } = useQuery({
    queryKey: ["report-aging", categoryId, warehouseId, productId],
    queryFn: () => imsService.getStockAgingReport(categoryId, warehouseId, productId),
    enabled: activeTab === "aging"
  });

  const { 
    data: mutationReportResp, 
    isLoading: isMutationLoading
  } = useQuery({
    queryKey: ["report-mutation", startDate, endDate, productId, warehouseId],
    queryFn: () => imsService.getStockMutationReport(startDate, endDate, productId, warehouseId),
    enabled: activeTab === "mutation"
  });

  const { 
    data: distributionReportResp, 
    isLoading: isDistributionLoading
  } = useQuery({
    queryKey: ["report-distribution", categoryId, subCategory, startDate, endDate],
    queryFn: () => imsService.getDistributionReport(categoryId, subCategory, startDate, endDate),
    enabled: activeTab === "distribution"
  });

  const { 
    data: reorderPointResp, 
    isLoading: isReorderLoading 
  } = useQuery({
    queryKey: ["report-reorder-point", leadTime],
    queryFn: () => imsService.getReorderPointReport(leadTime),
    enabled: activeTab === "reorder"
  });

  // Safe Extract Data
  const valueReport = valueReportResp?.data?.data || [];
  const agingReport = agingReportResp?.data?.data || [];
  const mutationReport = mutationReportResp?.data?.data || [];
  const distributionReport = distributionReportResp?.data?.data || [];
  const reorderReport = reorderPointResp?.data?.data || [];

  // Format IDR helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // CSV Export utility
  const handleExportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({
        title: "Ekspor Gagal",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive"
      });
      return;
    }

    // Clean details for CSV
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const stringVal = val === null || val === undefined ? "" : String(val);
        // Escape quotes
        const escaped = stringVal.replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sukses Ekspor",
      description: `Laporan berhasil diekspor sebagai ${filename}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-800 dark:text-white flex items-center gap-3">
            <FileSpreadsheet className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Laporan Gudang
          </h1>
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mt-1">
            Analisis data persediaan, umur stok, dan penyaluran barang
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        <button
          onClick={() => setActiveTab("value")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px ${
            activeTab === "value"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold"
              : "border-transparent text-zinc-450 hover:text-zinc-800 dark:hover:text-white"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Nilai Persediaan
        </button>
        <button
          onClick={() => setActiveTab("aging")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px ${
            activeTab === "aging"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold"
              : "border-transparent text-zinc-450 hover:text-zinc-800 dark:hover:text-white"
          }`}
        >
          <Clock className="h-4 w-4" />
          Usia Stok (Aging)
        </button>
        <button
          onClick={() => setActiveTab("mutation")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px ${
            activeTab === "mutation"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold"
              : "border-transparent text-zinc-450 hover:text-zinc-800 dark:hover:text-white"
          }`}
        >
          <ArrowLeftRight className="h-4 w-4" />
          Mutasi Stok
        </button>
        <button
          onClick={() => setActiveTab("distribution")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px ${
            activeTab === "distribution"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold"
              : "border-transparent text-zinc-450 hover:text-zinc-800 dark:hover:text-white"
          }`}
        >
          <Layers className="h-4 w-4" />
          Laporan Penyaluran
        </button>
        <button
          onClick={() => setActiveTab("reorder")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px ${
            activeTab === "reorder"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold"
              : "border-transparent text-zinc-450 hover:text-zinc-800 dark:hover:text-white"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Reorder Point
        </button>
      </div>

      {/* Value Report Tab */}
      {activeTab === "value" && (
        <div className="space-y-6">
          {/* Filters Card */}
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-wrap gap-4 items-end">
            <div className="w-full sm:w-auto flex-1 min-w-[200px]">
              <label className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block mb-1">
                Kategori Barang
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua Kategori</option>
                <option value="Pupuk">Pupuk</option>
                <option value="Pestisida">Pestisida</option>
              </select>
            </div>
            
            <div className="w-full sm:w-auto flex-1 min-w-[200px]">
              <label className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block mb-1">
                Gudang
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua Gudang</option>
                {warehouses.map((wh: any) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setCategoryId("");
                setWarehouseId("");
              }}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-500 dark:text-zinc-400 transition-colors"
            >
              Clear
            </button>

            <button
              onClick={() => handleExportCSV(valueReport.items, "laporan_nilai_persediaan.csv")}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Download className="h-4 w-4" />
              Ekspor CSV
            </button>
          </div>

          {/* Summaries Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block">
                  Total Kuantitas Persediaan
                </span>
                <span className="text-2xl font-black text-zinc-800 dark:text-white">
                  {valueReport.total_qty} <span className="text-xs font-medium text-zinc-400">Unit</span>
                </span>
              </div>
              <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block">
                  Total Estimasi Nilai Persediaan
                </span>
                <span className="text-2xl font-black text-emerald-650 dark:text-emerald-400">
                  {formatCurrency(valueReport.total_value)}
                </span>
              </div>
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-950 text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-850">
                  <tr>
                    <th className="p-4">Kode Barang</th>
                    <th className="p-4">Nama Barang</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Batch</th>
                    <th className="p-4 text-right">Jumlah</th>
                    <th className="p-4">Satuan</th>
                    <th className="p-4 text-right">Harga Beli</th>
                    <th className="p-4 text-right">Total Nilai</th>
                    <th className="p-4">Gudang</th>
                    <th className="p-4">Rak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                  {isValueLoading ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-zinc-400">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-500" />
                        Memuat data...
                      </td>
                    </tr>
                  ) : valueReport.items.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-zinc-400 font-medium">
                        Tidak ada data nilai persediaan ditemukan.
                      </td>
                    </tr>
                  ) : (
                    valueReport.items.map((item: any) => (
                      <tr key={item.batch_id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/50">
                        <td className="p-4 font-bold text-zinc-800 dark:text-zinc-200">{item.product_code}</td>
                        <td className="p-4 font-semibold">{item.product_name}</td>
                        <td className="p-4 font-medium text-zinc-500">{item.category}</td>
                        <td className="p-4 font-extrabold text-indigo-600 dark:text-indigo-400">{item.batch_number}</td>
                        <td className="p-4 text-right font-black">{item.qty}</td>
                        <td className="p-4 text-zinc-400 font-semibold">{item.unit}</td>
                        <td className="p-4 text-right font-semibold text-zinc-600 dark:text-zinc-300">{formatCurrency(item.purchase_price)}</td>
                        <td className="p-4 text-right font-black text-zinc-800 dark:text-white">{formatCurrency(item.total_value)}</td>
                        <td className="p-4 text-zinc-500 font-semibold">{item.warehouse_name}</td>
                        <td className="p-4 text-zinc-400 font-bold">{item.location_rack}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stock Aging Tab */}
      {activeTab === "aging" && (
        <div className="space-y-6">
          {/* Filters Card */}
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-wrap gap-4 items-end">
            <div className="w-full sm:w-auto flex-1 min-w-[150px]">
              <label className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block mb-1">
                Barang / Produk
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua Barang</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-auto flex-1 min-w-[150px]">
              <label className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block mb-1">
                Kategori
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua Kategori</option>
                <option value="Pupuk">Pupuk</option>
                <option value="Pestisida">Pestisida</option>
              </select>
            </div>

            <div className="w-full sm:w-auto flex-1 min-w-[150px]">
              <label className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block mb-1">
                Gudang
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua Gudang</option>
                {warehouses.map((wh: any) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setProductId("");
                setCategoryId("");
                setWarehouseId("");
              }}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-500 dark:text-zinc-400 transition-colors"
            >
              Clear
            </button>

            <button
              onClick={() => handleExportCSV(agingReport.items, "laporan_usia_stok.csv")}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Download className="h-4 w-4" />
              Ekspor CSV
            </button>
          </div>

          {/* Aging Buckets Summaries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl">
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">
                0 - 30 Hari (Aman)
              </span>
              <div className="flex justify-between items-end mt-2">
                <div>
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                    {agingReport.summary.bucket_0_30.total_qty} <span className="text-xs font-semibold text-emerald-500">Unit</span>
                  </p>
                  <p className="text-[10px] font-bold text-emerald-500 mt-1">{formatCurrency(agingReport.summary.bucket_0_30.total_value)}</p>
                </div>
                <span className="text-[9px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                  {agingReport.summary.bucket_0_30.count} Batch
                </span>
              </div>
            </div>

            <div className="p-4 bg-yellow-50/50 dark:bg-yellow-950/10 border border-yellow-100 dark:border-yellow-900/50 rounded-2xl">
              <span className="text-[10px] font-extrabold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest block mb-1">
                31 - 60 Hari
              </span>
              <div className="flex justify-between items-end mt-2">
                <div>
                  <p className="text-xl font-black text-yellow-700 dark:text-yellow-300">
                    {agingReport.summary.bucket_31_60.total_qty} <span className="text-xs font-semibold text-yellow-500">Unit</span>
                  </p>
                  <p className="text-[10px] font-bold text-yellow-500 mt-1">{formatCurrency(agingReport.summary.bucket_31_60.total_value)}</p>
                </div>
                <span className="text-[9px] font-black bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                  {agingReport.summary.bucket_31_60.count} Batch
                </span>
              </div>
            </div>

            <div className="p-4 bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/50 rounded-2xl">
              <span className="text-[10px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-widest block mb-1">
                61 - 90 Hari
              </span>
              <div className="flex justify-between items-end mt-2">
                <div>
                  <p className="text-xl font-black text-orange-700 dark:text-orange-300">
                    {agingReport.summary.bucket_61_90.total_qty} <span className="text-xs font-semibold text-orange-500">Unit</span>
                  </p>
                  <p className="text-[10px] font-bold text-orange-500 mt-1">{formatCurrency(agingReport.summary.bucket_61_90.total_value)}</p>
                </div>
                <span className="text-[9px] font-black bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-400 px-2 py-0.5 rounded-full">
                  {agingReport.summary.bucket_61_90.count} Batch
                </span>
              </div>
            </div>

            <div className="p-4 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/50 rounded-2xl">
              <span className="text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-widest block mb-1">
                &gt; 90 Hari (Lambat/Aging)
              </span>
              <div className="flex justify-between items-end mt-2">
                <div>
                  <p className="text-xl font-black text-red-700 dark:text-red-300">
                    {agingReport.summary.bucket_over_90.total_qty} <span className="text-xs font-semibold text-red-500">Unit</span>
                  </p>
                  <p className="text-[10px] font-bold text-red-500 mt-1">{formatCurrency(agingReport.summary.bucket_over_90.total_value)}</p>
                </div>
                <span className="text-[9px] font-black bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-400 px-2 py-0.5 rounded-full">
                  {agingReport.summary.bucket_over_90.count} Batch
                </span>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-950 text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-850">
                  <tr>
                    <th className="p-4">Kode Barang</th>
                    <th className="p-4">Nama Barang</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Batch</th>
                    <th className="p-4 text-right">Jumlah</th>
                    <th className="p-4">Satuan</th>
                    <th className="p-4">Tanggal Terima</th>
                    <th className="p-4 text-right">Usia Stok</th>
                    <th className="p-4">Status Usia</th>
                    <th className="p-4">Gudang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                  {isAgingLoading ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-zinc-400">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-500" />
                        Memuat data...
                      </td>
                    </tr>
                  ) : agingReport.items.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-zinc-400 font-medium">
                        Tidak ada data umur persediaan ditemukan.
                      </td>
                    </tr>
                  ) : (
                    agingReport.items.map((item: any) => {
                      let badgeColor = "bg-zinc-100 text-zinc-800";
                      if (item.bucket === "0-30") badgeColor = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50";
                      else if (item.bucket === "31-60") badgeColor = "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 border border-yellow-100 dark:border-yellow-900/50";
                      else if (item.bucket === "61-90") badgeColor = "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-900/50";
                      else if (item.bucket === ">90") badgeColor = "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/50";

                      return (
                        <tr key={item.batch_id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/50">
                          <td className="p-4 font-bold text-zinc-800 dark:text-zinc-200">{item.product_code}</td>
                          <td className="p-4 font-semibold">{item.product_name}</td>
                          <td className="p-4 font-medium text-zinc-500">{item.category}</td>
                          <td className="p-4 font-extrabold text-indigo-600 dark:text-indigo-400">{item.batch_number}</td>
                          <td className="p-4 text-right font-black">{item.qty}</td>
                          <td className="p-4 text-zinc-400 font-semibold">{item.unit}</td>
                          <td className="p-4 font-semibold text-zinc-650 dark:text-zinc-350">
                            {new Date(item.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                          <td className="p-4 text-right font-black text-zinc-800 dark:text-white">
                            {item.age_days} Hari
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${badgeColor}`}>
                              {item.bucket === "0-30" ? "Aman" : item.bucket === ">90" ? "Aging" : `${item.bucket} Hari`}
                            </span>
                          </td>
                          <td className="p-4 text-zinc-500 font-semibold">{item.warehouse_name}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stock Mutation Tab */}
      {activeTab === "mutation" && (
        <div className="space-y-6">
          {/* Filters Card */}
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-wrap gap-4 items-end">
            <div className="w-full sm:w-auto flex-1 min-w-[150px]">
              <label className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block mb-1">
                Mulai Tanggal
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="w-full sm:w-auto flex-1 min-w-[150px]">
              <label className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block mb-1">
                Sampai Tanggal
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="w-full sm:w-auto flex-1 min-w-[150px]">
              <label className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block mb-1">
                Barang / Produk
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua Barang</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-auto flex-1 min-w-[150px]">
              <label className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block mb-1">
                Gudang
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua Gudang</option>
                {warehouses.map((wh: any) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setProductId("");
                setWarehouseId("");
                const d = new Date();
                d.setDate(1);
                setStartDate(d.toISOString().split("T")[0]);
                setEndDate(new Date().toISOString().split("T")[0]);
              }}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-500 dark:text-zinc-400 transition-colors"
            >
              Clear
            </button>

            <button
              onClick={() => handleExportCSV(mutationReport, "laporan_mutasi_stok.csv")}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Download className="h-4 w-4" />
              Ekspor CSV
            </button>
          </div>

          {/* Table Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-950 text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-850">
                  <tr>
                    <th className="p-4">Kode Barang</th>
                    <th className="p-4">Nama Barang</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Satuan</th>
                    <th className="p-4 text-right">Saldo Awal</th>
                    <th className="p-4 text-right text-emerald-600 dark:text-emerald-400">Masuk (+)</th>
                    <th className="p-4 text-right text-rose-600 dark:text-rose-400">Keluar (-)</th>
                    <th className="p-4 text-right">Saldo Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                  {isMutationLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-zinc-400">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-500" />
                        Memuat data...
                      </td>
                    </tr>
                  ) : mutationReport.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-zinc-400 font-medium">
                        Tidak ada data mutasi persediaan ditemukan untuk filter terpilih.
                      </td>
                    </tr>
                  ) : (
                    mutationReport.map((item: any) => (
                      <tr key={item.product_id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/50">
                        <td className="p-4 font-bold text-zinc-800 dark:text-zinc-200">{item.product_code}</td>
                        <td className="p-4 font-semibold">{item.product_name}</td>
                        <td className="p-4 font-medium text-zinc-500">{item.category}</td>
                        <td className="p-4 text-zinc-450 font-bold uppercase">{item.unit}</td>
                        <td className="p-4 text-right font-black text-zinc-500">{item.beginning_balance}</td>
                        <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/10">+{item.in_qty}</td>
                        <td className="p-4 text-right font-black text-rose-600 dark:text-rose-400 bg-rose-50/10">-{item.out_qty}</td>
                        <td className="p-4 text-right font-black text-zinc-800 dark:text-white bg-indigo-50/5">{item.ending_balance}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Report Tab */}
      {activeTab === "distribution" && (
        <div className="space-y-6">
          {/* Note Callout */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-amber-800 dark:text-amber-300">Catatan Regulasi Penyaluran</h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                Laporan penyaluran ini dapat digunakan sebagai referensi dokumen pelaporan resmi distribusi Pestisida/B3 maupun Pupuk kepada instansi/kementerian terkait (misal Kementan). Tekan tombol <strong>Ekspor CSV</strong> untuk mengunduh laporan dalam bentuk berkas spreadsheet.
              </p>
            </div>
          </div>

          {/* Filters Card */}
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-wrap gap-4 items-end">
            <div className="w-full sm:w-auto flex-1 min-w-[150px]">
              <label className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block mb-1">
                Kategori Barang
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua Kategori</option>
                <option value="Pupuk">Pupuk</option>
                <option value="Pestisida">Pestisida</option>
              </select>
            </div>

            <div className="w-full sm:w-auto flex-1 min-w-[150px]">
              <label className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block mb-1">
                Sub-Kategori
              </label>
              <input
                type="text"
                placeholder="Cari sub-kategori..."
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="w-full sm:w-auto flex-1 min-w-[150px]">
              <label className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="w-full sm:w-auto flex-1 min-w-[150px]">
              <label className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={() => {
                setCategoryId("");
                setSubCategory("");
                const d = new Date();
                d.setDate(1);
                setStartDate(d.toISOString().split("T")[0]);
                setEndDate(new Date().toISOString().split("T")[0]);
              }}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-500 dark:text-zinc-400 transition-colors"
            >
              Clear
            </button>

            <button
              onClick={() => handleExportCSV(distributionReport, "laporan_penyaluran_barang.csv")}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Download className="h-4 w-4" />
              Ekspor CSV
            </button>
          </div>

          {/* Table Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1000px]">
                <thead className="bg-zinc-50 dark:bg-zinc-950 text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-850">
                  <tr>
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">No. Ref / SO</th>
                    <th className="p-4">Barang</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Sub-Kategori</th>
                    <th className="p-4 text-right">Jumlah Keluar</th>
                    <th className="p-4">Satuan</th>
                    <th className="p-4">Nama Customer</th>
                    <th className="p-4">PIC</th>
                    <th className="p-4">NPWP</th>
                    <th className="p-4">Alamat Penyaluran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                  {isDistributionLoading ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-zinc-400">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-500" />
                        Memuat data...
                      </td>
                    </tr>
                  ) : distributionReport.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-zinc-400 font-medium">
                        Tidak ada data transaksi penyaluran keluar ditemukan.
                      </td>
                    </tr>
                  ) : (
                    distributionReport.map((item: any) => (
                      <tr key={item.tx_id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/50">
                        <td className="p-4 font-semibold text-zinc-500">
                          {new Date(item.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="p-4 font-bold text-zinc-800 dark:text-zinc-200">{item.reference_no}</td>
                        <td className="p-4 font-semibold text-indigo-600 dark:text-indigo-400">
                          <div>{item.product_name}</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">{item.product_code}</div>
                        </td>
                        <td className="p-4 font-medium text-zinc-500">{item.category}</td>
                        <td className="p-4 font-semibold text-zinc-400">{item.sub_category || "-"}</td>
                        <td className="p-4 text-right font-black text-rose-600 dark:text-rose-450">{item.qty}</td>
                        <td className="p-4 text-zinc-400 font-semibold uppercase">{item.unit}</td>
                        <td className="p-4 font-bold text-zinc-800 dark:text-zinc-100">{item.customer_name}</td>
                        <td className="p-4 font-semibold text-zinc-600 dark:text-zinc-350">{item.customer_pic || "-"}</td>
                        <td className="p-4 text-zinc-400 font-semibold font-mono text-[10px]">{item.customer_npwp || "-"}</td>
                        <td className="p-4 text-zinc-500 font-medium max-w-[200px] truncate" title={item.customer_address}>
                          {item.customer_address || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reorder Point Tab */}
      {activeTab === "reorder" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <div className="text-zinc-400 text-[10px] font-black uppercase tracking-wider mb-1">Total SKU Terpantau</div>
              <div className="text-2xl font-black text-zinc-800 dark:text-white">{reorderReport.length}</div>
            </div>
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
              <div className="text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider mb-1">Perlu Restock</div>
              <div className="text-2xl font-black text-rose-650 dark:text-rose-400">
                {reorderReport.filter((item: any) => item.status === "RESTOCK").length}
              </div>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
              <div className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-1">Stok Aman</div>
              <div className="text-2xl font-black text-emerald-650 dark:text-emerald-400">
                {reorderReport.filter((item: any) => item.status === "SAFE").length}
              </div>
            </div>
          </div>

          {/* Filters Card */}
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-wrap gap-4 items-end justify-between">
            <div className="flex flex-wrap gap-4 items-end flex-1">
              <div className="w-full sm:w-auto">
                <label className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block mb-1">
                  Lead Time (Hari)
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={leadTime}
                  onChange={(e) => setLeadTime(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 w-24 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center h-10">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 dark:text-zinc-200 select-none">
                  <input
                    type="checkbox"
                    checked={needsRestockOnly}
                    onChange={(e) => setNeedsRestockOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-650 focus:ring-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 cursor-pointer"
                  />
                  Hanya Tampilkan Perlu Restock
                </label>
              </div>
            </div>

            <button
              onClick={() => {
                const formatted = reorderReport.map((item: any) => ({
                  "Kode Barang": item.product_code,
                  "Nama Barang": item.product_name,
                  "Kategori": item.category,
                  "Stok Saat Ini": item.current_stock,
                  "Safety Stock (Min)": item.minimum_stock,
                  "Konsumsi Harian (ADU)": item.adu.toFixed(2),
                  "Reorder Point (ROP)": item.rop,
                  "Status": item.status,
                  "Saran Order Qty": item.suggested_qty,
                  "Supplier Rekomendasi": item.last_supplier_name || "-"
                }));
                handleExportCSV(formatted, `Laporan_Reorder_Point_LeadTime_${leadTime}d.csv`);
              }}
              className="bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-md shadow-indigo-600/10"
            >
              <Download className="h-4 w-4" />
              Ekspor CSV
            </button>
          </div>

          {/* Table Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-450 dark:text-zinc-500 font-extrabold uppercase tracking-wider">
                    <th className="p-4">Barang</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4 text-right">Stok Aktif</th>
                    <th className="p-4 text-right">Safety Stock</th>
                    <th className="p-4 text-right">ADU (30 Hari)</th>
                    <th className="p-4 text-right">Reorder Point</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Saran Order</th>
                    <th className="p-4">Supplier</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {isReorderLoading ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-zinc-400 font-semibold">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-500" />
                        Memuat data reorder point...
                      </td>
                    </tr>
                  ) : reorderReport.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-zinc-400 font-semibold">
                        Tidak ada data barang tersedia
                      </td>
                    </tr>
                  ) : (
                    reorderReport
                      .filter((item: any) => !needsRestockOnly || item.status === "RESTOCK")
                      .map((item: any) => (
                        <tr
                          key={item.product_id}
                          className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-950/50 transition-colors ${
                            item.status === "RESTOCK" ? "bg-rose-50/10 dark:bg-rose-950/5" : ""
                          }`}
                        >
                          <td className="p-4 font-semibold">
                            <div className="font-bold text-zinc-800 dark:text-zinc-200">{item.product_name}</div>
                            <div className="text-[10px] text-zinc-450 dark:text-zinc-500 font-mono mt-0.5">{item.product_code}</div>
                          </td>
                          <td className="p-4 font-medium text-zinc-500">{item.category}</td>
                          <td className="p-4 text-right font-bold text-zinc-700 dark:text-zinc-350">
                            {item.current_stock}
                          </td>
                          <td className="p-4 text-right text-zinc-450 dark:text-zinc-500 font-medium">
                            {item.minimum_stock}
                          </td>
                          <td className="p-4 text-right font-medium text-zinc-550 dark:text-zinc-400">
                            {item.adu.toFixed(2)} <span className="text-[9px] text-zinc-400">/hari</span>
                          </td>
                          <td className="p-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                            {item.rop}
                          </td>
                          <td className="p-4 text-center">
                            {item.status === "RESTOCK" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-450 uppercase animate-pulse">
                                <AlertTriangle className="h-3 w-3" />
                                Restock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-450 uppercase">
                                Aman
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right font-black text-zinc-800 dark:text-zinc-100">
                            {item.suggested_qty > 0 ? (
                              <span className="text-amber-600 dark:text-amber-450">{item.suggested_qty}</span>
                            ) : (
                              <span className="text-zinc-350 dark:text-zinc-650">-</span>
                            )}
                          </td>
                          <td className="p-4 font-medium text-zinc-600 dark:text-zinc-300 truncate max-w-[120px]" title={item.last_supplier_name}>
                            {item.last_supplier_name || "-"}
                          </td>
                          <td className="p-4 text-center">
                            {item.status === "RESTOCK" && item.last_supplier_id ? (
                              <button
                                onClick={() => {
                                  window.location.href = `/app/purchase-orders?supplier_id=${item.last_supplier_id}&product_id=${item.product_id}&qty=${item.suggested_qty}`;
                                }}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] px-2.5 py-1.5 rounded-lg transition-all shadow-sm uppercase tracking-wider"
                              >
                                Buat PO
                              </button>
                            ) : (
                              <span className="text-zinc-300 dark:text-zinc-700 font-semibold">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
