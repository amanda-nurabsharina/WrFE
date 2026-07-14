import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { imsService, TStockTransaction, TInventoryBatch } from "../../api/ims.service";
import { useToast } from "../../components/ui";
import { showClearErrorToast } from "../../utils";
import { ArrowUpRight, Check, History, Layers } from "lucide-react";

export const GoodsOut = () => {
  const [productId, setProductId] = React.useState("");
  const [qty, setQty] = React.useState(1);
  const [purpose, setPurpose] = React.useState("Sales");
  const [description, setDescription] = React.useState("");
  const [fefoPreview, setFefoPreview] = React.useState<{ batch: TInventoryBatch; allocated: number }[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: prodsResp } = useQuery({ queryKey: ["products"], queryFn: () => imsService.getProducts() });
  const { data: txsResp, isLoading: isTxLoading } = useQuery({ queryKey: ["transactions", "out"], queryFn: () => imsService.getTransactions("out") });
  const { data: batchesResp } = useQuery({
    queryKey: ["batches", productId],
    queryFn: () => imsService.getBatches({ product_id: productId, status: "active" }),
    enabled: !!productId
  });

  const products = prodsResp?.data?.data || [];
  const recentTransactions = txsResp?.data?.data || [];
  const productBatches = batchesResp?.data?.data || [];

  // Compute FEFO preview allocation when Qty or Product selection changes
  React.useEffect(() => {
    if (!productId || qty <= 0 || productBatches.length === 0) {
      setFefoPreview([]);
      return;
    }

    // Sort batches by expired_date ASC
    const sorted = [...productBatches].sort(
      (a, b) => new Date(a.expired_date).getTime() - new Date(b.expired_date).getTime()
    );

    let remaining = qty;
    const allocation: { batch: TInventoryBatch; allocated: number }[] = [];

    for (const batch of sorted) {
      if (remaining <= 0) break;
      if (batch.qty <= 0) continue;

      const take = Math.min(batch.qty, remaining);
      allocation.push({ batch, allocated: take });
      remaining -= take;
    }

    setFefoPreview(allocation);
  }, [productId, qty, productBatches]);

  const outwardMutation = useMutation({
    mutationFn: (payload: any) => imsService.createOutward(payload),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(toast, res.error, "Failed to release stock");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["transactions", "out"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Outward FEFO transaction recorded successfully", variant: "default" });
      // Reset form
      setQty(1);
      setDescription("");
      setFefoPreview([]);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      toast({ title: "Validation Error", description: "Please select a product first", variant: "destructive" });
      return;
    }

    // Calculate total available stock in preview
    const totalAllocated = fefoPreview.reduce((sum, item) => sum + item.allocated, 0);
    if (totalAllocated < qty) {
      toast({ title: "Stock Shortage", description: `Cannot fulfill request. Only ${totalAllocated} units available in active batches.`, variant: "destructive" });
      return;
    }

    outwardMutation.mutate({
      product_id: productId,
      qty: Number(qty),
      purpose,
      description,
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Barang Keluar (Outward FEFO)
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Deduct stock from active inventory batches. The system automatically prioritizes the earliest expiring lot (FEFO).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Form + FEFO Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-white flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-850 pb-2">
              <ArrowUpRight className="h-5 w-5 text-indigo-500" />
              Outward Form
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {/* Product ID */}
              <div className="grid gap-1">
                <label>Pilih Barang (Product)</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select Product</option>
                  {products.map((prod: any) => (
                    <option key={prod.id} value={prod.id}>{prod.code} - {prod.name}</option>
                  ))}
                </select>
              </div>

              {/* Qty & Purpose */}
              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-1">
                  <label>Quantity Keluar</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid gap-1">
                  <label>Tujuan (Purpose)</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Sales">Sales (Penjualan)</option>
                    <option value="Production">Production (Produksi)</option>
                    <option value="Disposal">Disposal (Pemusnahan)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="grid gap-1">
                <label>Keterangan (Notes)</label>
                <textarea
                  placeholder="e.g. Order #10492 or Production line A"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-black h-20 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={outwardMutation.isPending}
                className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-xs"
              >
                <ArrowUpRight className="h-4.5 w-4.5" />
                Deduct Stock (FEFO)
              </button>
            </form>
          </div>

          {/* FEFO Allocation Preview */}
          {fefoPreview.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
              <h4 className="text-xs font-bold text-zinc-850 dark:text-white flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-indigo-500" />
                FEFO Batch Allocation Preview
              </h4>
              <p className="text-[10px] text-zinc-400 mb-4">
                The following active batches are automatically selected based on nearest expiration dates.
              </p>

              <div className="space-y-3">
                {fefoPreview.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-955 rounded-xl border border-zinc-150 dark:border-zinc-800 text-xs">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white">{item.batch.batch_number}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Exp: {new Date(item.batch.expired_date).toLocaleDateString("id-ID")}</p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="font-semibold text-zinc-400 text-[10px]">Alokasi</p>
                        <p className="font-extrabold text-indigo-600 dark:text-indigo-400">{item.allocated} Pcs</p>
                      </div>
                      <span className="p-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 rounded-full">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: History log list */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-white flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-850 pb-2">
            <History className="h-5 w-5 text-indigo-500" />
            Histori Pengeluaran Barang (Recent Outward Logs)
          </h3>

          {isTxLoading ? (
            <div className="text-center py-8 text-sm text-zinc-500">Loading history logs...</div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-12 text-sm text-zinc-400 font-medium">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Ref No.</th>
                    <th className="py-3 px-4">Nama Barang</th>
                    <th className="py-3 px-4">Batch #</th>
                    <th className="py-3 px-4">Rak</th>
                    <th className="py-3 px-4 text-right">Qty</th>
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
                      <td className="py-3 px-4 font-semibold text-rose-600 dark:text-rose-400">{tx.batch?.batch_number}</td>
                      <td className="py-3 px-4">{tx.batch?.location?.rack}</td>
                      <td className="py-3 px-4 text-right text-rose-600 font-bold bg-rose-50/20 dark:bg-rose-950/20">
                        -{tx.qty}
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
