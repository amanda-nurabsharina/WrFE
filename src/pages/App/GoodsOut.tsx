import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { imsService, TInventoryBatch } from "../../api/ims.service";
import { useToast } from "../../components/ui";
import { showClearErrorToast, downloadExcelCSV } from "../../utils";
import { ArrowUpRight, Check, History, Layers, Info, Download, Edit, CheckCircle, UploadCloud } from "lucide-react";

export const GoodsOut = () => {
  const apiOrigin = new URL(import.meta.env.VITE_API_URL || "http://127.0.0.1:3000").origin;
  const [productId, setProductId] = React.useState("");
  const [qty, setQty] = React.useState(1);
  const [purpose, setPurpose] = React.useState("Sales");
  const [description, setDescription] = React.useState("");
  const [soId, setSoId] = React.useState("");
  const [sellingPrice, setSellingPrice] = React.useState(0);
  const [uom, setUom] = React.useState("base"); // "base" (e.g. Liters) or "packaging" (e.g. Box)
  const [destination, setDestination] = React.useState("");
  const [invoiceNo, setInvoiceNo] = React.useState("");
  const [proofDocument, setProofDocument] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"completed" | "draft">("completed");
  const [selectedPreviewImage, setSelectedPreviewImage] = React.useState<string | null>(null);

  // Modals state
  const [editingTx, setEditingTx] = React.useState<any | null>(null);
  const [completingTx, setCompletingTx] = React.useState<any | null>(null);

  // Edit fields
  const [editQty, setEditQty] = React.useState(1);
  const [editPrice, setEditPrice] = React.useState(0);
  const [editInvoiceNo, setEditInvoiceNo] = React.useState("");
  const [editDestination, setEditDestination] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editProof, setEditProof] = React.useState("");

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
  }, [soId, productId, selectedSO?.id, selectedProduct?.id]);

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

  // File Upload Helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false, isComplete = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const res = await imsService.uploadFile(file);
    setIsUploading(false);

    if (res?.error) {
      toast({ title: "Upload Gagal", description: res.error.message, variant: "destructive" });
      return;
    }

    const fileUrl = res.data?.data;
    if (fileUrl) {
      if (isEdit) {
        setEditProof(fileUrl);
      } else if (isComplete) {
        setEditProof(fileUrl);
      } else {
        setProofDocument(fileUrl);
      }
      toast({ title: "Bukti pengiriman berhasil diupload" });
    }
  };

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
      setDestination("");
      setInvoiceNo("");
      setProofDocument("");
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to release stock");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => imsService.updateTransaction(id, payload),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(res.error, toast, "Failed to update transaction");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["transactions", "out"] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Transaction updated successfully" });
      setEditingTx(null);
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to update transaction");
    }
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, proof }: { id: string; proof: string }) => imsService.completeTransaction(id, proof),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(res.error, toast, "Failed to finalize transaction");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["transactions", "out"] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Transaction finalized successfully" });
      setCompletingTx(null);
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to finalize transaction");
    }
  });

  const handleSubmit = (e: React.FormEvent, status: "draft" | "completed" = "completed") => {
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
      destination,
      proof_document: proofDocument,
      invoice_no: invoiceNo,
      status,
    });
  };

  const handleEditClick = (tx: any) => {
    setEditingTx(tx);
    setEditQty(tx.qty);
    setEditPrice(tx.selling_price || 0);
    setEditInvoiceNo(tx.reference_no);
    setEditDestination(tx.destination || "");
    setEditDescription(tx.description || "");
    setEditProof(tx.proof_document || "");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    updateMutation.mutate({
      id: editingTx.id,
      payload: {
        qty: Number(editQty),
        price: Number(editPrice),
        reference_no: editInvoiceNo,
        destination: editDestination,
        description: editDescription,
        proof_document: editProof,
      }
    });
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTx) return;

    completeMutation.mutate({
      id: completingTx.id,
      proof: editProof,
    });
  };

  const downloadCSV = () => {
    if (recentTransactions.length === 0) return;

    const headers = ["Tanggal", "Invoice / Surat Jalan", "Tujuan / Recipient", "Nama Barang", "Kode Barang", "Batch #", "Harga Jual", "Qty", "Keterangan", "Status"];
    const rows = recentTransactions
      .filter((tx: any) => (tx.status || "completed") === activeTab)
      .map((tx: any) => [
        new Date(tx.created_at).toLocaleString("id-ID"),
        tx.reference_no,
        tx.destination || "-",
        tx.batch?.product?.name || "",
        tx.batch?.product?.code || "",
        tx.batch?.batch_number || "",
        tx.selling_price || 0,
        tx.qty,
        tx.description || "",
        tx.status || "completed"
      ]);

    downloadExcelCSV(`Laporan_Barang_Keluar_${activeTab === "completed" ? "Completed" : "Draft"}.csv`, headers, rows);
  };

  const filteredTransactions = recentTransactions.filter((tx: any) => (tx.status || "completed") === activeTab);

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

            <form onSubmit={(e) => handleSubmit(e, "completed")} className="space-y-4 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              
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
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">None (Direct Outward)</option>
                  {activeSOs.map((so: any) => (
                    <option key={so.id} value={so.id}>{so.so_number} - {so.customer?.name}</option>
                  ))}
                </select>
              </div>

              {/* Invoice Info */}
              <div className="grid gap-1 bg-zinc-50 dark:bg-zinc-950/20 p-3 rounded-xl border border-zinc-150 dark:border-zinc-850">
                <label className="text-[10px] font-bold text-zinc-500 mb-0.5">No. Faktur / Invoice / Surat Jalan</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., INV-OUT-2026-001"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-800 dark:text-black bg-white dark:bg-zinc-955"
                />
              </div>

              {/* Product ID */}
              <div className="grid gap-1">
                <label>Pilih Barang (Product)</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

              {/* Destination / Purpose */}
              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-1">
                  <label>Tujuan Penerima (Destination / Company)</label>
                  <input
                    type="text"
                    placeholder="e.g. Toko Tani Makmur"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none"
                  />
                </div>
                <div className="grid gap-1">
                  <label>Keperluan (Purpose)</label>
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

              {/* Price & Description */}
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
                  <label>Keterangan (Notes)</label>
                  <input
                    type="text"
                    placeholder="e.g. Delivery order notes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none"
                  />
                </div>
              </div>

              {/* Proof document upload */}
              <div className="grid gap-1 border border-dashed border-zinc-250 dark:border-zinc-800 p-4 rounded-xl text-center bg-zinc-50/50 dark:bg-zinc-955/20">
                <label className="text-[10px] font-bold text-zinc-500 mb-1 block">Bukti Pengiriman (Upload Photo)</label>
                <div className="flex flex-col items-center justify-center gap-2">
                  <UploadCloud className="h-6 w-6 text-zinc-400" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="pod-out-file-input"
                  />
                  <label
                    htmlFor="pod-out-file-input"
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-[10px] font-bold cursor-pointer text-zinc-700 dark:text-zinc-300"
                  >
                    {isUploading ? "Uploading..." : "Pilih File Foto"}
                  </label>
                  {proofDocument && (
                    <div className="mt-2 flex flex-col items-center gap-1.5">
                      <img
                        src={`${apiOrigin}${proofDocument}`}
                        alt="Preview"
                        onClick={() => setSelectedPreviewImage(`${apiOrigin}${proofDocument}`)}
                        className="h-14 w-14 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-zoom-in hover:opacity-80 transition-all shadow-sm"
                      />
                      <span className="text-[9px] text-emerald-600 font-bold block truncate max-w-full">✓ {proofDocument.split("/").pop()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, "draft")}
                  disabled={outwardMutation.isPending}
                  className="flex-1 px-4 py-3 border border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-955 text-indigo-600 rounded-xl font-bold transition-all text-xs text-center"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  disabled={outwardMutation.isPending}
                  className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-xs"
                >
                  <ArrowUpRight className="h-4.5 w-4.5" />
                  Deduct Stock (FEFO)
                </button>
              </div>
            </form>
          </div>

          {/* FEFO Allocation Preview */}
          {fefoPreview.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
              <h4 className="text-xs font-bold text-zinc-850 dark:text-white flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-indigo-500" />
                FEFO Batch Allocation Preview (Picking List)
              </h4>
              <p className="text-[10px] text-zinc-450 mb-4">
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
          
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-zinc-100 dark:border-zinc-850 pb-3">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-white flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-500" />
              Histori Pengeluaran Barang
            </h3>
            
            <div className="flex items-center gap-3">
              {/* Tab Toggles */}
              <div className="flex p-0.5 bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setActiveTab("completed")}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                    activeTab === "completed"
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setActiveTab("draft")}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                    activeTab === "draft"
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  Drafts
                </button>
              </div>

              {/* Download CSV */}
              <button
                onClick={downloadCSV}
                disabled={filteredTransactions.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </button>
            </div>
          </div>

          {isTxLoading ? (
            <div className="text-center py-8 text-sm text-zinc-500">Loading history logs...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-sm text-zinc-400 font-medium">
              No {activeTab} transactions found.
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-955 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Invoice / SJ</th>
                    <th className="py-3 px-4">Tujuan</th>
                    <th className="py-3 px-4">Barang</th>
                    <th className="py-3 px-4">Batch #</th>
                    <th className="py-3 px-4">Bukti</th>
                    <th className="py-3 px-4">Harga Jual</th>
                    <th className="py-3 px-4 text-right">Qty</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-medium text-zinc-700 dark:text-zinc-300">
                  {filteredTransactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                      <td className="py-3 px-4 text-zinc-500">
                        {new Date(tx.created_at).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {tx.reference_no}
                      </td>
                      <td className="py-3 px-4 font-bold text-zinc-800 dark:text-zinc-200">
                        {tx.destination || tx.purpose || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900 dark:text-white">{tx.batch?.product?.name}</div>
                        <div className="text-[10px] text-zinc-450 font-normal">{tx.batch?.product?.code} ({tx.batch?.product?.unit})</div>
                      </td>
                      <td className="py-3 px-4 text-zinc-650 dark:text-zinc-400 font-semibold">
                        {tx.batch?.batch_number}
                        {tx.status === "draft" && (
                          <span className="ml-1.5 px-1 py-0.2 text-[8px] bg-amber-100 text-amber-700 font-bold uppercase rounded">Draft</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {tx.proof_document ? (
                          <img
                            src={`${apiOrigin}${tx.proof_document}`}
                            alt="Bukti"
                            onClick={() => setSelectedPreviewImage(`${apiOrigin}${tx.proof_document}`)}
                            className="h-9 w-9 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-zoom-in hover:opacity-80 transition-all shadow-sm"
                          />
                        ) : (
                          <span className="text-zinc-400 font-normal">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        Rp {tx.selling_price?.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                        -{tx.qty}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {tx.status === "draft" && (
                            <button
                              onClick={() => {
                                setCompletingTx(tx);
                                setEditProof(tx.proof_document || "");
                              }}
                              title="Finalisasi Draft"
                              className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded transition-all"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditClick(tx)}
                            title="Edit / Koreksi Data"
                            className="p-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-650 rounded transition-all"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingTx && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-md font-bold text-zinc-900 dark:text-white">Koreksi Data Pengeluaran (Edit Outward)</h3>
              <button onClick={() => setEditingTx(null)} className="text-zinc-400 hover:text-zinc-650 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto text-xs font-semibold text-zinc-650">
              <div className="grid gap-1">
                <label className="text-zinc-550">Referensi No. (Delivery / Invoice)</label>
                <input
                  type="text"
                  required
                  value={editInvoiceNo}
                  onChange={(e) => setEditInvoiceNo(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:outline-none"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-zinc-550">Tujuan Penerima (Destination / Company)</label>
                <input
                  type="text"
                  value={editDestination}
                  onChange={(e) => setEditDestination(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-955 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-zinc-550">Quantity Released</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value))}
                    className="px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:outline-none"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-zinc-550">Harga Jual (Selling Price)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-955 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-1">
                <label className="text-zinc-550">Keterangan (Notes)</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="grid gap-1 border border-dashed border-zinc-250 dark:border-zinc-800 p-4 rounded-xl text-center bg-zinc-50/50 dark:bg-zinc-950/20">
                <label className="text-[10px] font-bold text-zinc-500 mb-1 block">Update Bukti Pengiriman (Photo)</label>
                <div className="flex flex-col items-center justify-center gap-2">
                  <UploadCloud className="h-6 w-6 text-zinc-400" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="hidden"
                    id="pod-out-edit-file-input"
                  />
                  <label
                    htmlFor="pod-out-edit-file-input"
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-[10px] font-bold cursor-pointer text-zinc-700"
                  >
                    {isUploading ? "Uploading..." : "Pilih File Foto Baru"}
                  </label>
                  {editProof && (
                    <div className="mt-2 flex flex-col items-center gap-1.5">
                      <img
                        src={`${apiOrigin}${editProof}`}
                        alt="Preview"
                        onClick={() => setSelectedPreviewImage(`${apiOrigin}${editProof}`)}
                        className="h-14 w-14 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-zoom-in hover:opacity-80 transition-all shadow-sm"
                      />
                      <span className="text-[9px] text-emerald-600 font-bold block truncate max-w-full">✓ {editProof.split("/").pop()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 border rounded-lg text-zinc-650 hover:bg-zinc-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
                >
                  Save Corrections
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Photo Preview Modal */}
      {selectedPreviewImage && (
        <div 
          onClick={() => setSelectedPreviewImage(null)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[99999] animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center animate-in zoom-in-95 duration-150"
          >
            <button 
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/85 text-white rounded-full p-1.5 transition-colors focus:outline-none z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={selectedPreviewImage} 
              alt="Bukti Pengeluaran Full" 
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg" 
            />
          </div>
        </div>
      )}
      {/* Complete Draft Modal */}
      {completingTx && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-md font-bold text-zinc-900 dark:text-white font-bold flex items-center gap-1.5">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Finalisasi / Selesaikan Draft
              </h3>
              <button onClick={() => setCompletingTx(null)} className="text-zinc-400 hover:text-zinc-650 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4 text-xs font-semibold text-zinc-650">
              <p className="text-xs text-zinc-450 leading-relaxed">
                Anda akan menandai pengeluaran barang <strong className="text-zinc-800">{completingTx.reference_no}</strong> sebagai <strong>Completed</strong>. Silakan upload bukti serah terima/jalan sebelum memproses.
              </p>

              <div className="grid gap-1 border border-dashed border-zinc-250 dark:border-zinc-850 p-4 rounded-xl text-center bg-zinc-50/50 dark:bg-zinc-950/20">
                <label className="text-[10px] font-bold text-zinc-500 mb-1 block">Upload Bukti Pengiriman / Serah Terima</label>
                <div className="flex flex-col items-center justify-center gap-2">
                  <UploadCloud className="h-6 w-6 text-zinc-400" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, false, true)}
                    className="hidden"
                    id="pod-out-complete-file-input"
                  />
                  <label
                    htmlFor="pod-out-complete-file-input"
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-[10px] font-bold cursor-pointer text-zinc-700"
                  >
                    {isUploading ? "Uploading..." : "Pilih File Bukti"}
                  </label>
                  {editProof && (
                    <div className="mt-2 flex flex-col items-center gap-1.5">
                      <img
                        src={`${apiOrigin}${editProof}`}
                        alt="Preview"
                        onClick={() => setSelectedPreviewImage(`${apiOrigin}${editProof}`)}
                        className="h-14 w-14 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-zoom-in hover:opacity-80 transition-all shadow-sm"
                      />
                      <span className="text-[9px] text-emerald-600 font-bold block truncate max-w-full">✓ {editProof.split("/").pop()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setCompletingTx(null)}
                  className="px-4 py-2 border rounded-lg text-zinc-650 hover:bg-zinc-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={completeMutation.isPending || isUploading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
                >
                  Mark Completed & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
