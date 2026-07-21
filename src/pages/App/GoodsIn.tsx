import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { imsService } from "../../api/ims.service";
import { barcodeService } from "../../api/barcode.service";
import BarcodeScanner from "../../components/barcode/BarcodeScanner";
import { useToast } from "../../components/ui";
import { showClearErrorToast, downloadExcelCSV } from "../../utils";
import { ArrowDownLeft, Plus, History, Info, Download, Edit, CheckCircle, UploadCloud, Barcode } from "lucide-react";
import BarcodePrintDialog from "../../components/barcode/BarcodePrintDialog";

export const GoodsIn = () => {
  const apiOrigin = new URL(import.meta.env.VITE_API_URL || "http://127.0.0.1:3000").origin;
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
  const [proofDocument, setProofDocument] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"completed" | "draft">("completed");
  const [selectedPreviewImage, setSelectedPreviewImage] = React.useState<string | null>(null);

  // Modals state
  const [editingTx, setEditingTx] = React.useState<any | null>(null);
  const [completingTx, setCompletingTx] = React.useState<any | null>(null);
  const [printTx, setPrintTx] = React.useState<any | null>(null);

  // Edit fields
  const [editQty, setEditQty] = React.useState(1);
  const [editPrice, setEditPrice] = React.useState(0);
  const [editInvoiceNo, setEditInvoiceNo] = React.useState("");
  const [editBatchNo, setEditBatchNo] = React.useState("");
  const [editExpiryDate, setEditExpiryDate] = React.useState("");
  const [editWarehouseId, setEditWarehouseId] = React.useState("");
  const [editLocationId, setEditLocationId] = React.useState("");
  const [editSupplierId, setEditSupplierId] = React.useState("");
  const [editProof, setEditProof] = React.useState("");

  const batchNoInputRef = React.useRef<HTMLInputElement>(null);

  const handleBarcodeScan = async (barcode: string) => {
    try {
      const res = await barcodeService.lookupBarcode(barcode);
      if (res.error) {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(new SpeechSynthesisUtterance("Barcode not found"));
        }
        toast({ title: "Barcode Tidak Dikenal", description: (res.error as any)?.message, variant: "destructive" });
        return;
      }

      const { registry, entity } = (res.data as any);
      if (registry.type !== "PRODUCT") {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(new SpeechSynthesisUtterance("Scan product barcode"));
        }
        toast({ title: "Harap Scan Barcode Produk", description: "Di halaman ini Anda harus memindai barcode Master Produk untuk dimasukkan.", variant: "default" });
        return;
      }

      setProductId(entity.id);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance("Product loaded"));
      }

      toast({ title: "Produk Ditemukan", description: `Produk: ${entity.name}`, variant: "default" });

      // Focus on Batch Number field
      setTimeout(() => {
        if (batchNoInputRef.current) {
          batchNoInputRef.current.focus();
        }
      }, 150);
    } catch (err: any) {
      console.error(err);
    }
  };

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
  }, [poId, productId, selectedPO?.id, selectedProduct?.id]);

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
      toast({ title: "Bukti penerimaan berhasil diupload" });
    }
  };

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
      setProofDocument("");
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to record inward transaction");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => imsService.updateTransaction(id, payload),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(res.error, toast, "Failed to update transaction");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["transactions", "in"] });
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
      queryClient.invalidateQueries({ queryKey: ["transactions", "in"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
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
      proof_document: proofDocument,
      status,
    });
  };

  const handleEditClick = (tx: any) => {
    setEditingTx(tx);
    setEditQty(tx.qty);
    setEditPrice(tx.batch?.purchase_price || 0);
    setEditInvoiceNo(tx.reference_no);
    setEditBatchNo(tx.batch?.batch_number || "");
    setEditExpiryDate(tx.batch?.expired_date ? tx.batch.expired_date.slice(0, 10) : "");
    setEditWarehouseId(tx.batch?.warehouse_id || "");
    setEditLocationId(tx.batch?.location_id || "");
    setEditSupplierId(tx.supplier_id || "");
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
        batch_number: editBatchNo,
        expired_date: editExpiryDate,
        warehouse_id: editWarehouseId,
        location_id: editLocationId,
        supplier_id: editSupplierId,
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

    const headers = ["Tanggal", "Invoice", "Supplier", "Nama Barang", "Kode Barang", "Batch #", "Gudang", "Rak", "Qty", "Harga Beli", "Status"];
    const rows = recentTransactions
      .filter((tx: any) => (tx.status || "completed") === activeTab)
      .map((tx: any) => [
        new Date(tx.created_at).toLocaleString("id-ID"),
        tx.reference_no,
        tx.supplier?.name || "-",
        tx.batch?.product?.name || "",
        tx.batch?.product?.code || "",
        tx.batch?.batch_number || "",
        tx.batch?.warehouse?.name || "",
        tx.batch?.location?.rack || "",
        tx.qty,
        tx.batch?.purchase_price || 0,
        tx.status || "completed"
      ]);

    downloadExcelCSV(`Laporan_Barang_Masuk_${activeTab === "completed" ? "Completed" : "Draft"}.csv`, headers, rows);
  };

  const filteredTransactions = recentTransactions.filter((tx: any) => (tx.status || "completed") === activeTab);

  return (
    <div className="space-y-6">
      <BarcodeScanner mode="receiving" onScan={handleBarcodeScan} />
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

          <form onSubmit={(e) => handleSubmit(e, "completed")} className="space-y-4 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            
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

            {/* PO Progress Helper */}
            {poId && productId && (() => {
              const poItem = selectedPO?.items?.find((item: any) => item.product_id === productId);
              if (poItem) {
                return (
                  <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 rounded-xl text-[10px] flex items-center gap-1.5 font-bold">
                    <Info className="h-4 w-4 text-indigo-500" />
                    <span>Ordered: {poItem.qty} {poItem.unit || poItem.product?.unit} • Already Received: {poItem.received_qty} {poItem.unit || poItem.product?.unit}</span>
                  </div>
                );
              }
            })()}

            {/* B3 Alert */}
            {selectedProduct?.reg_category === "B3" && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-955 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900 rounded-xl text-[10px] flex items-center gap-1.5 font-bold">
                <Info className="h-4 w-4 text-rose-500" />
                <span>Notice: Hazardous B3 material. Stock will be quarantined until approved.</span>
              </div>
            )}

            {/* Batch & Expiry */}
            <div className="grid gap-4 grid-cols-2">
              <div className="grid gap-1">
                <label>Batch / Lot Number</label>
                <input
                  ref={batchNoInputRef}
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

            {/* Proof document upload */}
            <div className="grid gap-1 border border-dashed border-zinc-250 dark:border-zinc-800 p-4 rounded-xl text-center bg-zinc-50/50 dark:bg-zinc-950/20">
              <label className="text-[10px] font-bold text-zinc-500 mb-1 block">Bukti Penerimaan Barang (Upload Photo)</label>
              <div className="flex flex-col items-center justify-center gap-2">
                <UploadCloud className="h-6 w-6 text-zinc-400" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="pod-file-input"
                />
                <label
                  htmlFor="pod-file-input"
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
                      className="h-14 w-14 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-zoom-in hover:opacity-80 transition-all"
                    />
                    <span className="text-[9px] text-emerald-600 font-bold block truncate max-w-full">✓ {proofDocument.split("/").pop()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, "draft")}
                disabled={inwardMutation.isPending}
                className="flex-1 px-4 py-3 border border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-955 text-indigo-600 rounded-xl font-bold transition-all text-xs text-center"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={inwardMutation.isPending}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-xs"
              >
                <Plus className="h-4.5 w-4.5" />
                Simpan Barang Masuk
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: History log list */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col">
          
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-zinc-100 dark:border-zinc-850 pb-3">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-white flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-500" />
              Histori Penerimaan Barang
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
                    <th className="py-3 px-4">Invoice</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Barang</th>
                    <th className="py-3 px-4">Batch #</th>
                    <th className="py-3 px-4">Rak</th>
                    <th className="py-3 px-4">Bukti</th>
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
                        {tx.supplier?.name || "Direct / No Supplier"}
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
                        {tx.status === "draft" && (
                          <span className="ml-1.5 px-1 py-0.2 text-[8px] bg-amber-100 text-amber-700 font-bold uppercase rounded">Draft</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-450">
                        {tx.batch?.warehouse?.name} - {tx.batch?.location?.rack}
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
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        +{tx.qty}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {tx.status === "completed" && tx.batch?.barcode && (
                            <button
                              onClick={() => setPrintTx(tx)}
                              title="Cetak Label Batch"
                              className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded transition-all"
                            >
                              <Barcode className="h-3.5 w-3.5" />
                            </button>
                          )}
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
                            className="p-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-655 rounded transition-all"
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-md font-bold text-zinc-900 dark:text-white">Koreksi Data Penerimaan (Edit Inward)</h3>
              <button onClick={() => setEditingTx(null)} className="text-zinc-400 hover:text-zinc-650 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto text-xs font-semibold">
              <div className="grid gap-1">
                <label className="text-zinc-550">No. Faktur (Invoice / Ref)</label>
                <input
                  type="text"
                  required
                  value={editInvoiceNo}
                  onChange={(e) => setEditInvoiceNo(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-zinc-550">Supplier</label>
                  <select
                    value={editSupplierId}
                    onChange={(e) => setEditSupplierId(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:outline-none"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-zinc-550">Lot / Batch Number</label>
                  <input
                    type="text"
                    required
                    value={editBatchNo}
                    onChange={(e) => setEditBatchNo(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-zinc-550">Quantity Received</label>
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
                  <label className="text-zinc-550">Harga Beli</label>
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

              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-zinc-550">Gudang</label>
                  <select
                    value={editWarehouseId}
                    onChange={(e) => setEditWarehouseId(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:outline-none"
                  >
                    {warehouses.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-zinc-550">Rak</label>
                  <select
                    value={editLocationId}
                    onChange={(e) => setEditLocationId(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:outline-none"
                  >
                    {locations.map((l: any) => (
                      <option key={l.id} value={l.id}>{l.rack}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-1">
                <label className="text-zinc-550">Tanggal Expired</label>
                <input
                  type="date"
                  required
                  value={editExpiryDate}
                  onChange={(e) => setEditExpiryDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-955 focus:outline-none"
                />
              </div>

              <div className="grid gap-1 border border-dashed border-zinc-250 dark:border-zinc-800 p-4 rounded-xl text-center bg-zinc-50/50 dark:bg-zinc-950/20">
                <label className="text-[10px] font-bold text-zinc-500 mb-1 block">Update Bukti Penerimaan (Photo)</label>
                <div className="flex flex-col items-center justify-center gap-2">
                  <UploadCloud className="h-6 w-6 text-zinc-400" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="hidden"
                    id="pod-edit-file-input"
                  />
                  <label
                    htmlFor="pod-edit-file-input"
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
              alt="Bukti Penerimaan Full" 
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
              <button onClick={() => setCompletingTx(null)} className="text-zinc-400 hover:text-zinc-600 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4 text-xs font-semibold text-zinc-650">
              <p className="text-xs text-zinc-450 leading-relaxed">
                Anda akan menandai transaksi penerimaan <strong className="text-zinc-800">{completingTx.reference_no}</strong> sebagai <strong>Completed</strong>. Silakan upload bukti serah terima (POD) sebelum memproses.
              </p>

              <div className="grid gap-1 border border-dashed border-zinc-250 dark:border-zinc-850 p-4 rounded-xl text-center bg-zinc-50/50 dark:bg-zinc-955/20">
                <label className="text-[10px] font-bold text-zinc-500 mb-1 block">Upload Bukti Tanda Terima (POD)</label>
                <div className="flex flex-col items-center justify-center gap-2">
                  <UploadCloud className="h-6 w-6 text-zinc-400" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, false, true)}
                    className="hidden"
                    id="pod-complete-file-input"
                  />
                  <label
                    htmlFor="pod-complete-file-input"
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
                        className="h-14 w-14 object-cover rounded-lg border border-zinc-200 dark:border-zinc-850 cursor-zoom-in hover:opacity-80 transition-all shadow-sm"
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

      {printTx && (
        <BarcodePrintDialog
          isOpen={!!printTx}
          onClose={() => setPrintTx(null)}
          barcodeValue={printTx.batch?.barcode || ""}
          labelType="BATCH"
          productName={printTx.batch?.product?.name || ""}
          productCode={printTx.batch?.product?.code || ""}
          batchNumber={printTx.batch?.batch_number}
          expiryDate={printTx.batch?.expired_date ? new Date(printTx.batch.expired_date).toLocaleDateString("id-ID") : ""}
        />
      )}
    </div>
  );
};
