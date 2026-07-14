import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { imsService, TStockTransaction } from "../../api/ims.service";
import { useToast } from "../../components/ui";
import { ArrowDownLeft, Plus, History } from "lucide-react";

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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: prodsResp } = useQuery({ queryKey: ["products"], queryFn: () => imsService.getProducts() });
  const { data: supsResp } = useQuery({ queryKey: ["suppliers"], queryFn: () => imsService.getSuppliers() });
  const { data: whsResp } = useQuery({ queryKey: ["warehouses"], queryFn: () => imsService.getWarehouses() });
  const { data: locsResp } = useQuery({ queryKey: ["locations"], queryFn: () => imsService.getLocations() });
  const { data: txsResp, isLoading: isTxLoading } = useQuery({ queryKey: ["transactions", "in"], queryFn: () => imsService.getTransactions("in") });

  const products = prodsResp?.data?.data || [];
  const suppliers = supsResp?.data?.data || [];
  const warehouses = whsResp?.data?.data || [];
  const locations = locsResp?.data?.data || [];
  const recentTransactions = txsResp?.data?.data || [];

  const inwardMutation = useMutation({
    mutationFn: (payload: any) => imsService.createInward(payload),
    onSuccess: (res: any) => {
      if (res?.error) {
        toast({ title: "Failed to record transaction", description: res.error.message || "An error occurred", variant: "destructive" });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["transactions", "in"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Inward transaction recorded successfully", variant: "default" });
      // Reset form
      setInvoiceNo("");
      setBatchNumber("");
      setExpiredDate("");
      setQty(1);
      setPurchasePrice(0);
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
            {/* Invoice Info */}
            <div className="grid gap-4 grid-cols-2">
              <div className="grid gap-1">
                <label>No. Faktur (Invoice)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-10029"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="grid gap-1">
                <label>Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((sup: any) => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product ID */}
            <div className="grid gap-1">
              <label>Pilih Barang (Product)</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select Product</option>
                {products.map((prod: any) => (
                  <option key={prod.id} value={prod.id}>{prod.code} - {prod.name}</option>
                ))}
              </select>
            </div>

            {/* Batch & Expiry */}
            <div className="grid gap-4 grid-cols-2">
              <div className="grid gap-1">
                <label>Batch / Lot Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B-PCT-003"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="grid gap-1">
                <label>Tanggal Expired (Expiry Date)</label>
                <input
                  type="date"
                  required
                  value={expiredDate}
                  onChange={(e) => setExpiredDate(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
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
                      <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white">{tx.reference_no}</td>
                      <td className="py-3 px-4">{tx.batch?.product?.name || "Deleted"}</td>
                      <td className="py-3 px-4 font-semibold text-indigo-600 dark:text-indigo-400">{tx.batch?.batch_number}</td>
                      <td className="py-3 px-4">{tx.batch?.location?.rack}</td>
                      <td className="py-3 px-4 text-right text-indigo-600 font-bold bg-indigo-50/20 dark:bg-indigo-950/20">
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
