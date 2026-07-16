import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { imsService, TStockTransaction } from "../../api/ims.service";
import { useToast } from "../../components/ui";
import { showClearErrorToast } from "../../utils";
import { ArrowDownLeft, Plus, History, Info } from "lucide-react";

export const GoodsIn = () => {
  const [productId, setProductId] = React.useState("");
  const [supplierId, setSupplierId] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("");
  const [locationId, setLocationId] = React.useState("");
  const [invoiceNo, setInvoiceNo] = React.useState("");
  const [batchNumber, setBatchNumber] = React.useState("");
  const [expiredDate, setExpiredDate] = React.useState("");
  const [qty, setQty] = React.useState(1);
  const [purchasePrice, setPurchasePrice] = React.useState(0);
  const [poId, setPoId] = React.useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: prodsResp } = useQuery({ queryKey: ["products"], queryFn: () => imsService.getProducts() });
  const { data: supsResp } = useQuery({ queryKey: ["suppliers"], queryFn: () => imsService.getSuppliers() });
  const { data: whsResp } = useQuery({ queryKey: ["warehouses"], queryFn: () => imsService.getWarehouses() });
  const { data: locsResp } = useQuery({ queryKey: ["locations"], queryFn: () => imsService.getLocations() });
  const { data: posResp } = useQuery({ queryKey: ["purchase-orders"], queryFn: () => imsService.getPurchaseOrders() });
  const { data: txsResp, isLoading: isTxLoading } = useQuery({
    queryKey: ["transactions", "in"],
    queryFn: () => imsService.getTransactions("in")
  });

  const products = prodsResp?.data?.data || [];
  const suppliers = supsResp?.data?.data || [];
  const warehouses = whsResp?.data?.data || [];
  const locations = locsResp?.data?.data || [];
  const purchaseOrders = posResp?.data?.data || [];
  const recentTransactions = txsResp?.data?.data || [];

  const activePOs = purchaseOrders.filter(
    (po: any) => po.status === "approved" || po.status === "partially_received"
  );

  const selectedPO = purchaseOrders.find((po: any) => po.id === poId);

  const filteredProducts = poId
    ? (() => {
        const poProductIds = selectedPO?.items?.map((item: any) => item.product_id) || [];
        return products.filter((prod: any) => poProductIds.includes(prod.id));
      })()
    : products;

  const selectedProduct = products.find((p: any) => p.id === productId);

  // Auto-fill price & supplier from PO, or basic product price
  React.useEffect(() => {
    if (poId && productId) {
      const poItem = selectedPO?.items?.find((item: any) => item.product_id === productId);
      if (poItem) {
        setPurchasePrice(poItem.price);
        setQty(Math.max(1, poItem.qty - poItem.received_qty));
      }
    } else if (productId) {
      if (selectedProduct) {
        setPurchasePrice(selectedProduct.purchase_price ?? 0);
      }
    }
  }, [poId, productId, selectedPO, selectedProduct]);

  const inwardMutation = useMutation({
    mutationFn: (payload: any) => imsService.createInward(payload),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(res.error, toast, "Failed to record transaction");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["transactions", "in"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Inward transaction recorded successfully", variant: "default" });
      // Reset form
      setInvoiceNo("");
      setBatchNumber("");
      setExpiredDate("");
      setQty(1);
      setPurchasePrice(0);
      setPoId("");
      setProductId("");
      setSupplierId("");
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to record inward transaction");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !supplierId || !warehouseId || !locationId) {
      toast({ title: "Validation Error", description: "Please fill all dropdown selections", variant: "destructive" });
      return;
    }
    inwardMutation.mutate({
      supplier_id: supplierId,
      invoice_no: invoiceNo,
      product_id: productId,
      batch_number: batchNumber,
      expired_date: expiredDate,
      qty: Number(qty),
      purchase_price: Number(purchasePrice),
      warehouse_id: warehouseId,
      location_id: locationId,
      po_id: poId || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Barang Masuk (Inward)
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Receive stock from suppliers, record invoices, register new batches, and map shelf rack placement.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-white flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-850 pb-2">
            <ArrowDownLeft className="h-5 w-5 text-indigo-500" />
            Inward Form
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            
            {/* PO Matcher Selector */}
            <div className="grid gap-1">
              <label>Purchase Order (Optional Link)</label>
              <select
                value={poId}
                onChange={(e) => {
                  const id = e.target.value;
                  setPoId(id);
                  setProductId("");
                  if (id) {
                    const matched = purchaseOrders.find((po: any) => po.id === id);
                    if (matched) {
                      setSupplierId(matched.supplier_id || "");
                    }
                  } else {
                    setSupplierId("");
                  }
                }}
                className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">None (Direct Inward)</option>
                {activePOs.map((po: any) => (
                  <option key={po.id} value={po.id}>{po.po_number} - {po.supplier?.name}</option>
                ))}
              </select>
            </div>

            {/* Invoice Info */}
            <div className="grid gap-4 grid-cols-2">
              <div className="grid gap-1">
                <label>No. Faktur (Invoice)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FACT-10029"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none"
                />
              </div>
              <div className="grid gap-1">
                <label>Supplier</label>
                <select
                  disabled={!!poId}
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none disabled:opacity-75"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((sup: any) => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Selection */}
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

            {/* PO Progress Helper */}
            {poId && productId && (() => {
              const poItem = selectedPO?.items?.find((item: any) => item.product_id === productId);
              if (poItem) {
                return (
                  <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 rounded-xl text-[10px] flex items-center gap-1.5 font-bold">
                    <Info className="h-4 w-4 text-indigo-500" />
                    <span>Ordered: {poItem.qty} {poItem.product?.unit} • Already Received: {poItem.received_qty} {poItem.product?.unit}</span>
                  </div>
                );
              }
            })()}

            {/* B3 Alert */}
            {selectedProduct?.reg_category === "B3" && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900 rounded-xl text-[10px] flex items-center gap-1.5 font-bold">
                <Info className="h-4 w-4 text-rose-500" />
                <span>Notice: Hazardous B3 material. Stock will be quarantined until approved.</span>
              </div>
            )}

            {/* Batch & Expiry */}
            <div className="grid gap-4 grid-cols-2">
              <div className="grid gap-1">
                <label>Batch / Lot Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LOT-PST-15"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none"
                />
              </div>
              <div className="grid gap-1">
                <label>Tanggal Expired (Expiry Date)</label>
                <input
                  type="date"
                  required
                  value={expiredDate}
                  onChange={(e) => setExpiredDate(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none"
                />
              </div>
            </div>

            {/* Qty & Price */}
            <div className="grid gap-4 grid-cols-2">
              <div className="grid gap-1">
                <label>Quantity</label>
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
                <label>Harga Beli (Purchase Price)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none"
                />
              </div>
            </div>

            {/* Warehouse & Location */}
            <div className="grid gap-4 grid-cols-2">
              <div className="grid gap-1">
                <label>Gudang (Warehouse)</label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((wh: any) => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <label>Lokasi Rak (Rack)</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none"
                >
                  <option value="">Select Rack</option>
                  {locations.map((loc: any) => (
                    <option key={loc.id} value={loc.id}>{loc.rack}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={inwardMutation.isPending}
              className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-xs"
            >
              <Plus className="h-4.5 w-4.5" />
              Simpan Barang Masuk
            </button>
          </form>
        </div>

        {/* Right Column: History log list */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-white flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-850 pb-2">
            <History className="h-5 w-5 text-indigo-500" />
            Histori Penerimaan Barang (Recent Inward Logs)
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
                    <th className="py-3 px-4">Invoice</th>
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
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {tx.reference_no}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900 dark:text-white">{tx.batch?.product?.name}</div>
                        <div className="text-[10px] text-zinc-450 font-normal">{tx.batch?.product?.code} ({tx.batch?.product?.unit})</div>
                      </td>
                      <td className="py-3 px-4 text-zinc-650 dark:text-zinc-400 font-semibold">
                        {tx.batch?.batch_number}
                        {tx.batch?.status === "quarantine" && (
                          <span className="ml-1.5 px-1 py-0.2 text-[8px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 font-bold uppercase rounded">Quarantine</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-450">
                        {tx.batch?.warehouse?.name} - {tx.batch?.location?.rack}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        +{tx.qty}
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
