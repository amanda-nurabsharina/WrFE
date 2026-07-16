import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { imsService, TInventoryBatch } from "../../api/ims.service";
import { Search, ShieldAlert, AlertTriangle, ShieldCheck, Check } from "lucide-react";
import { useToast } from "../../components/ui";
import { showClearErrorToast } from "../../utils";
import { useStore } from "../../store/store";

export const ExpiredMonitoring = () => {
  const [search, setSearch] = React.useState("");
  const [expiryFilter, setExpiryFilter] = React.useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useStore((state) => state.user);
  const { data: rolesResp } = useQuery({ queryKey: ["roles"], queryFn: () => imsService.getRoles() });
  const roles = rolesResp?.data?.data || [];
  const roleName = user?.rawRole || (user?.role as unknown as string) || "";
  const userRoleObj = roles.find((r: any) => r.name === roleName);
  const userMenus = userRoleObj?.accessible_menus || [];
  const isSuperAdmin = roleName === "super_admin" || roleName === "super admin";
  const isApprover = isSuperAdmin || roleName === "approver" || userMenus.includes("approver") || roleName === "admin";

  const { data: response, isLoading } = useQuery({
    queryKey: ["batches", search, expiryFilter],
    queryFn: () => imsService.getBatches({
      search,
      expiry_days: (expiryFilter !== "all" && expiryFilter !== "quarantine") ? expiryFilter : undefined,
      status: expiryFilter === "quarantine" ? "quarantine" : "active"
    }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => imsService.approveB3Inward(id),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(res.error, toast, "Failed to approve batch");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "B3 quarantined batch approved and added to active stock", variant: "default" });
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to approve batch");
    }
  });

  const batches = response?.data?.data || [];

  const getExpiryStatus = (expDateStr: string, isQuarantine: boolean) => {
    if (isQuarantine) {
      return {
        label: "Quarantined (B3)",
        days: 0,
        color: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900",
        icon: AlertTriangle,
      };
    }

    const expDate = new Date(expDateStr);
    const today = new Date();
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
        color: "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 border-yellow-205 dark:border-yellow-900",
        icon: AlertTriangle,
      };
    } else {
      return {
        label: "Safe (>90d)",
        days: diffDays,
        color: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
        icon: ShieldCheck,
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Monitoring Expired & Quarantine
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Pantau tanggal kadaluarsa produk pertanian dan verifikasi stock karantina B3.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 self-start">
          <button
            onClick={() => setExpiryFilter("all")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              expiryFilter === "all"
                ? "bg-white dark:bg-zinc-850 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            All Active Batches
          </button>
          <button
            onClick={() => setExpiryFilter("30")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              expiryFilter === "30"
                ? "bg-white dark:bg-zinc-850 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            {"Near Expired (<30d)"}
          </button>
          <button
            onClick={() => setExpiryFilter("quarantine")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              expiryFilter === "quarantine"
                ? "bg-white dark:bg-zinc-850 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Quarantine (B3)
          </button>
        </div>

        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari barang atau batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full text-sm bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Grid List / Table */}
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
                <tr className="bg-zinc-50 dark:bg-zinc-955 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">Barang</th>
                  <th className="py-4 px-6">Batch Number</th>
                  <th className="py-4 px-6">Gudang</th>
                  <th className="py-4 px-6">Lokasi Rak</th>
                  <th className="py-4 px-6">Quantity</th>
                  <th className="py-4 px-6">Expiry Date</th>
                  <th className="py-4 px-6">Status</th>
                  {expiryFilter === "quarantine" && isApprover && (
                    <th className="py-4 px-6 text-center">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-medium text-zinc-700 dark:text-zinc-300">
                {batches.map((batch: TInventoryBatch) => {
                  const status = getExpiryStatus(batch.expired_date, batch.status === "quarantine");
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
                          {status.label} {batch.status !== "quarantine" && (status.days <= 0 ? "" : `(${status.days} hari lagi)`)}
                        </span>
                      </td>
                      {expiryFilter === "quarantine" && isApprover && (
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => {
                              if (confirm("Approve B3 batch and release to active stock?")) {
                                approveMutation.mutate(batch.id);
                              }
                            }}
                            className="flex items-center justify-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold tracking-wide transition-all"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve Stock
                          </button>
                        </td>
                      )}
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
