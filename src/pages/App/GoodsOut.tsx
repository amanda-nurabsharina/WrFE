import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { imsService, TStockTransaction, TInventoryBatch } from "../../api/ims.service";
import { useToast } from "../../components/ui";
import { showClearErrorToast } from "../../utils";
import { ArrowUpRight, Check, History, Layers, Info } from "lucide-react";

export const GoodsOut = () => {
  const [productId, setProductId] = React.useState("");
  const [qty, setQty] = React.useState(1);
  const [purpose, setPurpose] = React.useState("Sales");
  const [description, setDescription] = React.useState("");
  const [soId, setSoId] = React.useState("");
  const [sellingPrice, setSellingPrice] = React.useState(0);
  const [uom, setUom] = React.useState("base"); // "base" (e.g. Liters) or "packaging" (e.g. Box)
  
  const [fefoPreview, setFefoPreview] = React.useState<{ batch: TInventoryBatch; allocated: number }[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: prodsResp } = useQuery({ queryKey: ["products"], queryFn: () => imsService.getProducts() });
  const { data: sosResp } = useQuery({ queryKey: ["sales-orders"], queryFn: () => imsService.getSalesOrders() });
  const { data: txsResp, isLoading: isTxLoading } = useQuery({
    queryKey: ["transactions", "out"],
    queryFn: () => imsService.getTransactions("out")
  });
  const { data: batchesResp } = useQuery({
    queryKey: ["batches", productId],
    queryFn: () => imsService.getBatches({ product_id: productId, status: "active" }),
    enabled: !!productId
  });

  const products = prodsResp?.data?.data || [];
  const salesOrders = sosResp?.data?.data || [];
  const recentTransactions = txsResp?.data?.data || [];
  const productBatches = batchesResp?.data?.data || [];

  const selectedProduct = products.find((p: any) => p.id === productId);
  const selectedSO = salesOrders.find((so: any) => so.id === soId);

  const activeSOs = salesOrders.filter(
    (so: any) => so.status === "approved" || so.status === "partially_shipped"
  );

  const filteredProducts = soId
    ? (() => {
        const soProductIds = selectedSO?.items?.map((item: any) => item.product_id) || [];
        return products.filter((prod: any) => soProductIds.includes(prod.id));
      })()
    : products;

  // Auto-fill price & Qty from SO
  React.useEffect(() => {
    if (soId && productId) {
      const soItem = selectedSO?.items?.find((item: any) => item.product_id === productId);
      if (soItem) {
        setSellingPrice(soItem.price);
        setQty(Math.max(1, soItem.qty - soItem.shipped_qty));
        setUom("base"); // SO quantities are saved in base units
      }
    } else if (productId && selectedProduct) {
      setSellingPrice(selectedProduct.price_retail ?? 0);
    }
  }, [soId, productId, selectedSO, selectedProduct]);

  // Compute actual base quantity (input qty scaled by conversion ratio if packaging is selected)
  const actualBaseQty = React.useMemo(() => {
    if (!selectedProduct || qty <= 0) return 0;
    if (uom === "packaging") {
      return qty * (selectedProduct.conversion_ratio || 1);
    }
    return qty;
  }, [qty, uom, selectedProduct]);

  // Compute FEFO preview allocation
  React.useEffect(() => {
    if (!productId || actualBaseQty <= 0 || productBatches.length === 0) {
      setFefoPreview([]);
      return;
    }

    // Sort batches by expired_date ASC
    const sorted = [...productBatches].sort(
      (a, b) => new Date(a.expired_date).getTime() - new Date(b.expired_date).getTime()
    );

    let remaining = actualBaseQty;
    const allocation: { batch: TInventoryBatch; allocated: number }[] = [];

    for (const batch of sorted) {
      if (remaining <= 0) break;
      if (batch.qty <= 0) continue;

      const take = Math.min(batch.qty, remaining);
      allocation.push({ batch, allocated: take });
      remaining -= take;
    }

    setFefoPreview(allocation);
  }, [productId, actualBaseQty, productBatches]);

  const outwardMutation = useMutation({
    mutationFn: (payload: any) => imsService.createOutward(payload),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(res.error, toast, "Failed to release stock");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["transactions", "out"] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Outward FEFO transaction recorded successfully", variant: "default" });
      // Reset form
      setQty(1);
      setDescription("");
      setSoId("");
      setProductId("");
      setFefoPreview([]);
      setUom("base");
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to release stock");
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
    if (totalAllocated < actualBaseQty) {
      toast({
        title: "Stock Shortage",
        description: `Cannot fulfill request. Only ${totalAllocated} units available in active batches, but ${actualBaseQty} units requested.`,
        variant: "destructive"
      });
      return;
    }

    outwardMutation.mutate({
      product_id: productId,
      qty: Number(actualBaseQty),
      purpose,
      description,
      so_id: soId || undefined,
      selling_price: Number(sellingPrice),
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
              
              {/* Sales Order Matcher */}
              <div className="grid gap-1">
                <label>Sales Order (Optional Link)</label>
                <select
                  value={soId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSoId(id);
                    setProductId("");
                    if (id) {
                      setPurpose("Sales");
                    }
                  }}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">None (Direct Outward)</option>
                  {activeSOs.map((so: any) => (
                    <option key={so.id} value={so.id}>{so.so_number} - {so.customer?.name}</option>
                  ))}
                </select>
              </div>

              {/* Product ID */}
              <div className="grid gap-1">
                <label>Pilih Barang (Product)</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select Product</option>
                  {filteredProducts.map((prod: any) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.code} - {prod.name} {prod.reg_category === "B3" ? "[B3]" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* SO Progress Helper */}
              {soId && productId && (() => {
                const soItem = selectedSO?.items?.find((item: any) => item.product_id === productId);
                if (soItem) {
                  return (
                    <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 rounded-xl text-[10px] flex items-center gap-1.5 font-bold">
                      <Info className="h-4 w-4 text-indigo-500" />
                      <span>Ordered: {soItem.qty} {soItem.product?.unit} • Shipped: {soItem.shipped_qty} {soItem.product?.unit}</span>
                    </div>
                  );
                }
              })()}

              {/* Qty & UOM */}
              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-1">
                  <label>Quantity Keluar</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none"
                  />
                </div>
                <div className="grid gap-1">
                  <label>Unit of Measure (UOM)</label>
                  <select
                    value={uom}
                    onChange={(e) => setUom(e.target.value)}
                    className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none"
                  >
                    <option value="base">Base Unit ({selectedProduct?.unit || "Liters/Kg"})</option>
                    {selectedProduct?.packaging_unit && (
                      <option value="packaging">
                        Packaging ({selectedProduct.packaging_unit.name} = {selectedProduct.conversion_ratio} {selectedProduct.unit})
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {/* Equivalent Quantity details */}
              {uom === "packaging" && selectedProduct && (
                <div className="p-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-150 dark:border-zinc-800 rounded-lg text-[10px] text-zinc-500 font-semibold">
                  Equivalent base quantity to deduct: <strong className="text-zinc-900 dark:text-white">{actualBaseQty} {selectedProduct.unit}</strong>
                </div>
              )}

              {/* Price & Purpose */}
              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-1">
                  <label>Harga Jual (Selling Price)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none"
                  />
                </div>
                <div className="grid gap-1">
                  <label>Tujuan (Purpose)</label>
                  <select
                    disabled={!!soId}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none"
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
                  placeholder="e.g. Delivery order notes..."
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
                FEFO Batch Allocation Preview (Picking List)
              </h4>
              <p className="text-[10px] text-zinc-400 mb-4">
                The following active batches are automatically selected based on nearest expiration dates.
              </p>

              <div className="space-y-3">
                {fefoPreview.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-955 rounded-xl border border-zinc-150 dark:border-zinc-800 text-xs">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white">{item.batch.batch_number}</p>
                      <p className="text-[10px] text-zinc-450">Location: {item.batch.warehouse?.name} - {item.batch.location?.rack}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Exp: {new Date(item.batch.expired_date).toLocaleDateString("id-ID")}</p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="font-semibold text-zinc-400 text-[10px]">Alokasi</p>
                        <p className="font-extrabold text-indigo-600 dark:text-indigo-400">{item.allocated} {selectedProduct?.unit}</p>
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
                  <tr className="bg-zinc-50 dark:bg-zinc-955 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Ref No.</th>
                    <th className="py-3 px-4">Nama Barang</th>
                    <th className="py-3 px-4">Batch #</th>
                    <th className="py-3 px-4">Harga Jual</th>
                    <th className="py-3 px-4 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-medium text-zinc-700 dark:text-zinc-300">
                  {recentTransactions.map((tx: TStockTransaction) => (
                    <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                      <td className="py-3 px-4 text-zinc-500">
                        {new Date(tx.created_at).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {tx.reference_no}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900 dark:text-white">{tx.batch?.product?.name}</div>
                        <div className="text-[10px] text-zinc-450 font-normal">{tx.batch?.product?.code} ({tx.batch?.product?.unit})</div>
                      </td>
                      <td className="py-3 px-4 text-zinc-650 dark:text-zinc-400 font-semibold">
                        {tx.batch?.batch_number}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        Rp {tx.selling_price?.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
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
