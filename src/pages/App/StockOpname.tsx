import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { imsService, TStockTransaction, TInventoryBatch } from "../../api/ims.service";
import { useToast } from "../../components/ui";
import { ShieldCheck, History, Check, AlertTriangle } from "lucide-react";

export const StockOpname = () => {
  const [batchId, setBatchId] = React.useState("");
  const [physicalQty, setPhysicalQty] = React.useState<number | "">("");
  const [description, setDescription] = React.useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: batchesResp } = useQuery({ queryKey: ["batches"], queryFn: () => imsService.getBatches() });
  const { data: txsResp, isLoading: isTxLoading } = useQuery({ queryKey: ["transactions", "adjustment"], queryFn: () => imsService.getTransactions("adjustment") });

  const batches = batchesResp?.data?.data || [];
  const recentTransactions = txsResp?.data?.data || [];

  const selectedBatch = batches.find((b: TInventoryBatch) => b.id === batchId);

  // Compute discrepancy
  const systemQty = selectedBatch ? selectedBatch.qty : 0;
  const discrepancy = physicalQty !== "" ? (physicalQty as number) - systemQty : 0;

  const opnameMutation = useMutation({
    mutationFn: (payload: any) => imsService.createStockOpname(payload),
    onSuccess: (res: any) => {
      if (res?.error) {
        toast({ title: "Failed to submit adjustment", description: res.error.message || "An error occurred", variant: "destructive" });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["transactions", "adjustment"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Stock Opname adjustment approved and saved", variant: "default" });
      // Reset form
      setBatchId("");
      setPhysicalQty("");
      setDescription("");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) {
      toast({ title: "Validation Error", description: "Please select an inventory batch to audit", variant: "destructive" });
      return;
    }
    if (physicalQty === "") {
      toast({ title: "Validation Error", description: "Please enter the physical quantity counted", variant: "destructive" });
      return;
    }

    opnameMutation.mutate({
      batch_id: batchId,
      physical_qty: Number(physicalQty),
      description,
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Stock Opname (Audit & Adjustment)
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Compare physical warehouse stock quantities with system records and commit supervisor-authorized adjustments.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-white flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-850 pb-2">
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
              Stock Audit Form
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {/* Batch ID */}
              <div className="grid gap-1">
                <label>Pilih Batch yang di-Audit</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select Inventory Batch</option>
                  {batches.map((b: TInventoryBatch) => (
                    <option key={b.id} value={b.id}>
                      {b.product?.name} ({b.batch_number}) - {b.qty} {b.product?.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Readonly Info */}
              {selectedBatch && (
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-955 rounded-xl border border-zinc-150 dark:border-zinc-800 grid gap-1.5 text-[11px] font-medium text-zinc-550 dark:text-zinc-400 animate-in fade-in duration-200">
                  <div className="flex justify-between">
                    <span>Nama Barang:</span>
                    <span className="font-bold text-zinc-800 dark:text-white">{selectedBatch.product?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gudang / Lokasi Rak:</span>
                    <span className="font-bold text-zinc-800 dark:text-white">{selectedBatch.warehouse?.name} / {selectedBatch.location?.rack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stok Sistem:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{systemQty} {selectedBatch.product?.unit}</span>
                  </div>
                </div>
              )}

              {/* Physical Qty */}
              <div className="grid gap-1">
                <label>Jumlah Fisik yang Dihitung (Physical Count)</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 45"
                  value={physicalQty}
                  onChange={(e) => setPhysicalQty(e.target.value === "" ? "" : Number(e.target.value))}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Discrepancy Preview */}
              {physicalQty !== "" && selectedBatch && (
                <div className="animate-in fade-in duration-200">
                  {discrepancy === 0 ? (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-100 dark:border-emerald-900 flex items-center gap-2">
                      <Check className="h-4.5 w-4.5" />
                      <span>Jumlah fisik cocok dengan stok sistem. Tidak butuh adjustment.</span>
                    </div>
                  ) : (
                    <div className={`p-3 rounded-xl border flex items-center justify-between ${
                      discrepancy > 0
                        ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900"
                        : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900"
                    }`}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                        <span>Selisih (Discrepancy):</span>
                      </div>
                      <span className="font-extrabold text-sm">{discrepancy > 0 ? `+${discrepancy}` : discrepancy} {selectedBatch.product?.unit}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="grid gap-1">
                <label>Keterangan Alasan Selisih</label>
                <textarea
                  placeholder="e.g. Mislabeled during receipt or broken packaging"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-white h-16 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={opnameMutation.isPending || discrepancy === 0}
                className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-xs disabled:opacity-50"
              >
                <ShieldCheck className="h-4.5 w-4.5" />
                Submit for Supervisor Approval
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: History log list */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-white flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-850 pb-2">
            <History className="h-5 w-5 text-indigo-500" />
            Histori Adjustment Stock Opname
          </h3>

          {isTxLoading ? (
            <div className="text-center py-8 text-sm text-zinc-500">Loading history logs...</div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-12 text-sm text-zinc-400 font-medium">
              No adjustments recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-955 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Ref Opname</th>
                    <th className="py-3 px-4">Barang</th>
                    <th className="py-3 px-4">Batch #</th>
                    <th className="py-3 px-4">Auditor</th>
                    <th className="py-3 px-4 text-right">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-medium text-zinc-700 dark:text-zinc-300">
                  {recentTransactions.map((tx: TStockTransaction) => (
                    <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                      <td className="py-3 px-4 text-zinc-500">
                        {new Date(tx.created_at).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white">{tx.reference_no}</td>
                      <td className="py-3 px-4">{tx.batch?.product?.name || "Deleted"}</td>
                      <td className="py-3 px-4 font-semibold text-zinc-500">{tx.batch?.batch_number}</td>
                      <td className="py-3 px-4">{tx.user?.name || "System"}</td>
                      <td className={`py-3 px-4 text-right font-bold ${
                        tx.qty > 0 ? "text-blue-600 bg-blue-50/20 dark:bg-blue-950/20" : "text-amber-600 bg-amber-50/20 dark:bg-amber-950/20"
                      }`}>
                        {tx.qty > 0 ? `+${tx.qty}` : tx.qty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
