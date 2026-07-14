import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { imsService, TInventoryBatch } from "../../api/ims.service";
import { Clock, Search, ShieldAlert, AlertTriangle, ShieldCheck } from "lucide-react";

export const ExpiredMonitoring = () => {
  const [search, setSearch] = React.useState("");
  const [expiryFilter, setExpiryFilter] = React.useState("all");

  const { data: response, isLoading } = useQuery({
    queryKey: ["batches", search, expiryFilter],
    queryFn: () => imsService.getBatches({
      search,
      expiry_days: expiryFilter !== "all" ? expiryFilter : undefined
    }),
  });

  const batches = response?.data?.data || [];

  const getExpiryStatus = (expDateStr: string) => {
    const expDate = new Date(expDateStr);
    const today = new Date();
    // Reset hours
    today.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        label: "Expired",
        days: diffDays,
        color: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900",
        icon: ShieldAlert,
      };
    } else if (diffDays <= 30) {
      return {
        label: "Near Expired (<30d)",
        days: diffDays,
        color: "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900",
        icon: AlertTriangle,
      };
    } else if (diffDays <= 90) {
      return {
        label: "Hampir Expired (<90d)",
        days: diffDays,
        color: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
        icon: Clock,
      };
    } else {
      return {
        label: "Aman (>90d)",
        days: diffDays,
        color: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
        icon: ShieldCheck,
      };
    }
  };

  const filterTabs = [
    { value: "all", label: "Semua Batch" },
    { value: "expired", label: "Sudah Expired" },
    { value: "30", label: "Expired <30 Hari" },
    { value: "90", label: "Expired <90 Hari" },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Monitoring Expired
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Perform real-time tracking of active batches and identify risk profiles using warning alerts.
        </p>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by batch number, code, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 text-xs">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setExpiryFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                expiryFilter === tab.value
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-zinc-50 border-zinc-200 text-zinc-650 hover:bg-zinc-100 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table grid */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-zinc-500">Loading batches...</div>
        ) : batches.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-450 font-semibold">
            No batch matching criteria found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">Barang</th>
                  <th className="py-4 px-6">Batch Number</th>
                  <th className="py-4 px-6">Gudang</th>
                  <th className="py-4 px-6">Lokasi Rak</th>
                  <th className="py-4 px-6">Quantity</th>
                  <th className="py-4 px-6">Expiry Date</th>
                  <th className="py-4 px-6">Status Expired</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-medium text-zinc-700 dark:text-zinc-300">
                {batches.map((batch: TInventoryBatch) => {
                  const status = getExpiryStatus(batch.expired_date);
                  return (
                    <tr key={batch.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                      <td className="py-4 px-6">
                        <p className="font-bold text-zinc-900 dark:text-white">{batch.product?.name}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{batch.product?.code}</p>
                      </td>
                      <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-white">{batch.batch_number}</td>
                      <td className="py-4 px-6 text-zinc-500">{batch.warehouse?.name}</td>
                      <td className="py-4 px-6">
                        <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">
                          {batch.location?.rack}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-zinc-900 dark:text-white">{batch.qty} {batch.product?.unit}</td>
                      <td className="py-4 px-6 text-zinc-500">{new Date(batch.expired_date).toLocaleDateString("id-ID")}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] uppercase font-bold inline-flex items-center gap-1.5 ${status.color}`}>
                          <status.icon className="h-3.5 w-3.5" />
                          {status.label} ({status.days <= 0 ? "Expired" : `${status.days} hari lagi`})
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
