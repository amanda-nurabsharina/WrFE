import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { imsService, TProduct } from "../../api/ims.service";
import { Plus, Trash2, Search, Package2, Pencil, ChevronDown, ChevronUp, AlertTriangle, RefreshCw, Info } from "lucide-react";
import { useToast } from "../../components/ui";
import { showClearErrorToast } from "../../utils";
import { usePermission } from "../../hooks/usePermission";
// Subcomponent to fetch and render batches for FIFO/FEFO
const ProductBatchesView = ({ productId, unit }: { productId: string; unit: string }) => {
  const { t } = useTranslation("common");
  const { data: batchesResp, isLoading } = useQuery({
    queryKey: ["product-batches", productId],
    queryFn: () => imsService.getBatches({ product_id: productId })
  });
  
  const batches = React.useMemo(() => {
    const list = batchesResp?.data?.data || [];
    return [...list].sort((a, b) => new Date(a.expired_date).getTime() - new Date(b.expired_date).getTime());
  }, [batchesResp]);
  
  if (isLoading) {
    return <div className="text-xs text-zinc-400 p-2 flex items-center gap-2"><RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-500" /> {t("products.loadBatchesText")}</div>;
  }
  
  if (batches.length === 0) {
    return <div className="text-xs text-zinc-400 p-2 italic border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/10">{t("products.noBatchesText")}</div>;
  }
  
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-black uppercase text-indigo-650 dark:text-indigo-400 tracking-wider">
        {t("products.activeBatchesTitle")}
      </div>
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
        {batches.map((b: any) => {
          const activeBatches = batches.filter((x: any) => x.status === "active");
          const isFirstActive = activeBatches.length > 0 && activeBatches[0].id === b.id;
          const isLastActive = activeBatches.length > 1 && activeBatches[activeBatches.length - 1].id === b.id;
          const isExpired = b.status === "expired" || new Date(b.expired_date) <= new Date();
          const isQuarantine = b.status === "quarantine";
          
          return (
            <div 
              key={b.id} 
              className={`p-3 rounded-xl border flex flex-col justify-between gap-1 transition-all ${
                isExpired 
                  ? "bg-rose-50/40 border-rose-250 dark:bg-rose-950/10 dark:border-rose-900/30" 
                  : isQuarantine
                  ? "bg-amber-50/40 border-amber-250 dark:bg-amber-950/10 dark:border-amber-900/30"
                  : isFirstActive 
                  ? "bg-emerald-50/40 border-emerald-250 dark:bg-emerald-950/10 dark:border-emerald-900/30 shadow-sm" 
                  : "bg-zinc-50 dark:bg-zinc-950/20 border-zinc-150 dark:border-zinc-800"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-zinc-850 dark:text-zinc-200 text-xs">
                    Batch: {b.batch_number}
                  </div>
                  <div className="text-[10px] text-zinc-450 dark:text-zinc-500 font-mono mt-0.5">
                    Expired: {new Date(b.expired_date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </div>
                </div>
                
                {isExpired && (
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-450 uppercase">
                    Expired
                  </span>
                )}
                {isQuarantine && (
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-450 uppercase">
                    Karantina
                  </span>
                )}
                {!isExpired && !isQuarantine && isFirstActive && (
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-450 uppercase animate-pulse">
                    {t("products.fefoBadge")}
                  </span>
                )}
                {!isExpired && !isQuarantine && isLastActive && (
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-blue-105 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 uppercase">
                    {t("products.newestBadge")}
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center text-xs mt-1 border-t border-zinc-200/40 dark:border-zinc-850/40 pt-1">
                <span className="text-zinc-450 dark:text-zinc-500 font-medium">Stok Batch:</span>
                <span className="font-black text-zinc-850 dark:text-zinc-100">{b.qty} {unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export const Products = () => {
  const { hasPermission } = usePermission();
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [barcode, setBarcode] = React.useState("");
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("Pupuk");
  const [unit, setUnit] = React.useState("Liter");
  const [minStock, setMinStock] = React.useState(0);

  // New Santani Agriculture fields state
  const [regCategory, setRegCategory] = React.useState("non-B3");
  const [kementanRegNo, setKementanRegNo] = React.useState("");
  const [msdsReference, setMsdsReference] = React.useState("");
  const [subCategory, setSubCategory] = React.useState("Pupuk");
  const [packagingUnitID, setPackagingUnitID] = React.useState("");
  const [conversionRatio, setConversionRatio] = React.useState(1);
  const [purchasePrice, setPurchasePrice] = React.useState(0);
  const [priceDistributor, setPriceDistributor] = React.useState(0);
  const [priceRetail, setPriceRetail] = React.useState(0);

  const [editingProduct, setEditingProduct] = React.useState<TProduct | null>(null);

  // Storage specs and Initial Batch states
  const [storageTemp, setStorageTemp] = React.useState("");
  const [storageHumidity, setStorageHumidity] = React.useState("");
  const [storageRestrictions, setStorageRestrictions] = React.useState("");
  const [initialBatchNo, setInitialBatchNo] = React.useState("");
  const [initialQty, setInitialQty] = React.useState(0);
  const [initialExpiryDate, setInitialExpiryDate] = React.useState("");
  const [initialWarehouseID, setInitialWarehouseID] = React.useState("");

  const [expandedProductIds, setExpandedProductIds] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedProductIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const { toast } = useToast();
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();

  // Query products
  const { data: response, isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: () => imsService.getProducts(search),
  });
  const products = response?.data?.data || [];

  // Query packaging units (for selection dropdown)
  const { data: packagingResponse } = useQuery({
    queryKey: ["packaging-units", ""],
    queryFn: () => imsService.getPackagingUnits(""),
  });
  const packagingUnits = packagingResponse?.data?.data || [];

  // Query warehouses (for initial batch warehouse select)
  const { data: warehousesResp } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => imsService.getWarehouses()
  });
  const warehouses = warehousesResp?.data?.data || [];

  // Set default packaging unit and warehouse when loaded and not editing
  React.useEffect(() => {
    if (packagingUnits.length > 0 && !packagingUnitID && !editingProduct) {
      setPackagingUnitID(packagingUnits[0].id);
    }
  }, [packagingUnits, packagingUnitID, editingProduct]);

  React.useEffect(() => {
    if (warehouses.length > 0 && !initialWarehouseID && !editingProduct) {
      setInitialWarehouseID(warehouses[0].id);
    }
  }, [warehouses, initialWarehouseID, editingProduct]);

  const createMutation = useMutation({
    mutationFn: (payload: any) => imsService.createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product created successfully", variant: "default" });
      setIsOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to create product");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => imsService.updateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product updated successfully", variant: "default" });
      setIsOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to update product");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => imsService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product deleted successfully", variant: "default" });
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to delete product");
    }
  });

  const resetForm = () => {
    setCode("");
    setBarcode("");
    setName("");
    setCategory("Pupuk");
    setUnit("Liter");
    setMinStock(0);
    setRegCategory("non-B3");
    setKementanRegNo("");
    setMsdsReference("");
    setSubCategory("Pupuk");
    setPackagingUnitID(packagingUnits[0]?.id || "");
    setConversionRatio(1);
    setPurchasePrice(0);
    setPriceDistributor(0);
    setPriceRetail(0);
    setEditingProduct(null);
    setStorageTemp("");
    setStorageHumidity("");
    setStorageRestrictions("");
    setInitialBatchNo("");
    setInitialQty(0);
    setInitialExpiryDate("");
    setInitialWarehouseID(warehouses[0]?.id || "");
  };

  const handleEditClick = (prod: TProduct) => {
    setEditingProduct(prod);
    setCode(prod.code);
    setBarcode(prod.barcode || "");
    setName(prod.name);
    setCategory(prod.category_id || "Pupuk");
    setUnit(prod.unit || "Liter");
    setMinStock(prod.minimum_stock || 0);
    setRegCategory(prod.reg_category || "non-B3");
    setKementanRegNo(prod.kementan_reg_no || "");
    setMsdsReference(prod.msds_reference || "");
    setSubCategory(prod.sub_category || "Pupuk");
    setPackagingUnitID(prod.packaging_unit_id || "");
    setConversionRatio(prod.conversion_ratio || 1);
    setPurchasePrice(prod.purchase_price || 0);
    setPriceDistributor(prod.price_distributor || 0);
    setPriceRetail(prod.price_retail || 0);
    setStorageTemp(prod.storage_temp || "");
    setStorageHumidity(prod.storage_humidity || "");
    setStorageRestrictions(prod.storage_restrictions || "");
    setInitialBatchNo("");
    setInitialQty(0);
    setInitialExpiryDate("");
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code,
      barcode,
      name,
      category_id: category,
      unit,
      minimum_stock: Number(minStock),
      reg_category: regCategory,
      kementan_reg_no: kementanRegNo,
      msds_reference: msdsReference,
      sub_category: subCategory,
      packaging_unit_id: packagingUnitID,
      conversion_ratio: Number(conversionRatio),
      purchase_price: Number(purchasePrice),
      price_distributor: Number(priceDistributor),
      price_retail: Number(priceRetail),
      storage_temp: storageTemp,
      storage_humidity: storageHumidity,
      storage_restrictions: storageRestrictions,
      ...(!editingProduct && initialBatchNo ? {
        initial_batch_no: initialBatchNo,
        initial_qty: Number(initialQty),
        initial_expiry_date: initialExpiryDate,
        initial_warehouse_id: initialWarehouseID
      } : {})
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {t("products.title")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t("products.subtitle")}
          </p>
        </div>
        {hasPermission("products", "create") && (
          <button
            onClick={() => {
              resetForm();
              setIsOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-sm self-start sm:self-center"
          >
            <Plus className="h-4 w-4" />
            {t("products.addBtn")}
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex gap-4 items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder={t("products.placeholderSearch")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full text-sm bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">{t("loading")}...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <Package2 className="h-10 w-10 text-zinc-300" />
            <p className="text-sm font-semibold text-zinc-500">{t("empty")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-955 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">{t("products.code")}</th>
                  <th className="py-4 px-6">{t("products.name")}</th>
                  <th className="py-4 px-6">{t("products.regCategory")}</th>
                  <th className="py-4 px-6">{t("products.subCategory")}</th>
                  <th className="py-4 px-6">{t("products.stock")}</th>
                  <th className="py-4 px-6">{t("products.conversionRatio")}</th>
                  <th className="py-4 px-6">{t("products.purchasePrice")}</th>
                  <th className="py-4 px-6">{t("products.priceDistributor")}</th>
                  <th className="py-4 px-6 text-center">{t("action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-855 font-medium text-zinc-700 dark:text-zinc-300">
                {products.map((prod: TProduct) => (
                  <React.Fragment key={prod.id}>
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                      <td className="py-4 px-6 font-bold text-indigo-650 dark:text-indigo-400">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleExpand(prod.id)}
                            className="text-zinc-400 hover:text-zinc-600 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            {expandedProductIds[prod.id] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                          <div>
                            <div>{prod.code}</div>
                            <div className="text-[10px] text-zinc-400 font-normal">{prod.barcode || "-"}</div>
                          </div>
                        </div>
                      </td>
                    <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-white">
                      <div>{prod.name}</div>
                      {prod.kementan_reg_no && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                          Reg: {prod.kementan_reg_no}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        prod.reg_category === "B3" ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" :
                        prod.reg_category === "B3 Terbatas" ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400" :
                        "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                      }`}>
                        {prod.reg_category || "non-B3"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-zinc-500">{prod.sub_category || "-"}</td>
                    <td className="py-4 px-6">
                      {(prod.stock ?? 0) > 0 ? (
                        <span className="font-bold text-zinc-900 dark:text-white">
                          {prod.stock} {prod.unit}
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className="font-bold text-zinc-450 dark:text-zinc-500 line-through">0 {prod.unit}</span>
                          <span className="block px-2 py-0.5 w-max rounded-full text-[9px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 uppercase">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-zinc-500">
                      1 {prod.packaging_unit?.name || "Kemasan"} = {prod.conversion_ratio || 1} {prod.unit}
                    </td>
                    <td className="py-4 px-6">{formatCurrency(prod.purchase_price || 0)}</td>
                    <td className="py-4 px-6 font-bold text-zinc-800 dark:text-zinc-200">
                      {formatCurrency(prod.price_distributor || 0)}
                    </td>
                    <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                      {hasPermission("products", "edit") && (
                        <button
                          onClick={() => handleEditClick(prod)}
                          className="text-indigo-500 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-955/20 rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {hasPermission("products", "delete") && (
                        <button
                          onClick={() => {
                            if (confirm(t("products.confirmDelete", { name: prod.name }))) {
                              deleteMutation.mutate(prod.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      )}
                      {!hasPermission("products", "edit") && !hasPermission("products", "delete") && (
                        <span className="text-[10px] text-zinc-400 italic">No Actions</span>
                      )}
                    </td>
                  </tr>
                  {expandedProductIds[prod.id] && (
                    <tr className="bg-zinc-50/40 dark:bg-zinc-950/10">
                      <td colSpan={9} className="py-4 px-6 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Storage Specs */}
                          <div className="md:col-span-1 p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl space-y-3 shadow-sm">
                            <div className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-indigo-650 dark:text-indigo-400" />
                              {t("products.storageSpecs")}
                            </div>
                            <div className="space-y-2.5 text-xs">
                              <div>
                                <span className="font-bold text-zinc-400 block text-[9px] uppercase tracking-wider">{t("products.storageTemp")}:</span>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                  {prod.storage_temp || "Normal (Suhu Ruang 25°C - 30°C)"}
                                </span>
                              </div>
                              <div>
                                <span className="font-bold text-zinc-400 block text-[9px] uppercase tracking-wider">{t("products.storageHumidity")}:</span>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                  {prod.storage_humidity || "Normal (Max 70%)"}
                                </span>
                              </div>
                              <div>
                                <span className="font-bold text-zinc-400 block text-[9px] uppercase tracking-wider">{t("products.storageRestrictions")}:</span>
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
                                  {prod.storage_restrictions || "-"}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Active Batches */}
                          <div className="md:col-span-2">
                            <ProductBatchesView productId={prod.id} unit={prod.unit || "Liter"} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-md font-bold text-zinc-900 dark:text-white">
                {editingProduct ? t("products.editTitle") : t("products.addTitle")}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-650 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Row 1: Code & Barcode */}
              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("products.code")} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NPK-15"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("products.barcode")}</label>
                  <input
                    type="text"
                    placeholder="e.g. 8991234567890"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Row 2: Name */}
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("products.name")} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Santani NPK 15-15-15"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Row 3: Main Category & Sub Category */}
              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("products.category")} *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Pupuk">Pupuk</option>
                    <option value="Pestisida">Pestisida</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("products.subCategory")} *</label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Pupuk">Pupuk</option>
                    <option value="Fungisida">Fungisida</option>
                    <option value="Herbisida">Herbisida</option>
                    <option value="Insektisida">Insektisida</option>
                    <option value="ZPT">ZPT (Zat Pengatur Tumbuh)</option>
                    <option value="Moluskisida">Moluskisida</option>
                    <option value="Akarisida">Akarisida</option>
                    <option value="Rodentisida">Rodentisida</option>
                    <option value="Surfaktan">Surfaktan</option>
                    <option value="Adjuvan">Adjuvan</option>
                    <option value="Fumigan">Fumigan</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Regulation Category & Kementan Reg No */}
              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("products.regCategory")} *</label>
                  <select
                    value={regCategory}
                    onChange={(e) => setRegCategory(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="non-B3">non-B3</option>
                    <option value="B3">B3</option>
                    <option value="B3 Terbatas">B3 Terbatas</option>
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("products.kementanRegNo")}</label>
                  <input
                    type="text"
                    placeholder="e.g. RI. 01010120155222"
                    value={kementanRegNo}
                    onChange={(e) => setKementanRegNo(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Row 5: MSDS Reference */}
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("products.msdsReference")}</label>
                <input
                  type="text"
                  placeholder="e.g. MSDS-GLY-480.pdf or URL link"
                  value={msdsReference}
                  onChange={(e) => setMsdsReference(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Row 6: Packaging Unit, Base Unit & Ratio */}
              <div className="grid gap-4 grid-cols-3">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("products.packagingUnit")} *</label>
                  <select
                    value={packagingUnitID}
                    onChange={(e) => setPackagingUnitID(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {packagingUnits.map((pu: any) => (
                      <option key={pu.id} value={pu.id}>
                        {pu.name} ({pu.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("products.unit")} *</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Liter">Liter</option>
                    <option value="Kg">Kg</option>
                    <option value="Pcs">Pcs</option>
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("products.conversionRatio")} *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 20 (meaning 1 pack = 20 units)"
                    value={conversionRatio === 0 ? "" : conversionRatio}
                    onChange={(e) => setConversionRatio(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Row 7: Min Stock */}
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                  {t("products.minStock")} *
                  <div className="group relative inline-block cursor-help">
                    <Info className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-500 transition-colors" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-zinc-900 text-white text-[10px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[200] font-normal leading-normal text-center normal-case">
                      {t("products.minStockTooltip")}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900"></div>
                    </div>
                  </div>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={minStock === 0 ? "" : minStock}
                  onChange={(e) => setMinStock(e.target.value === "" ? 0 : Number(e.target.value))}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Row 8: Storage Specifications */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
                <div className="text-xs font-extrabold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                  {t("products.storageSpecs")}
                </div>
                <div className="grid gap-4 grid-cols-2">
                  <div className="grid gap-1">
                    <label className="text-[10px] font-semibold text-zinc-650 dark:text-zinc-350">{t("products.storageTemp")}</label>
                    <input
                      type="text"
                      placeholder="e.g. 20°C - 25°C"
                      value={storageTemp}
                      onChange={(e) => setStorageTemp(e.target.value)}
                      className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-white dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-[10px] font-semibold text-zinc-650 dark:text-zinc-350">{t("products.storageHumidity")}</label>
                    <input
                      type="text"
                      placeholder="e.g. Max 60%"
                      value={storageHumidity}
                      onChange={(e) => setStorageHumidity(e.target.value)}
                      className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-white dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid gap-1">
                  <label className="text-[10px] font-semibold text-zinc-650 dark:text-zinc-350">{t("products.storageRestrictions")}</label>
                  <textarea
                    placeholder="e.g. Jauhkan dari bahan asam, jangan ditumpuk lebih dari 5 karton."
                    value={storageRestrictions}
                    onChange={(e) => setStorageRestrictions(e.target.value)}
                    rows={2}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-white dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                  />
                </div>
              </div>

              {/* Row 9: Optional Initial Batch Section (Only during creation) */}
              {!editingProduct && (
                <div className="p-4 bg-indigo-50/20 dark:bg-indigo-950/5 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl space-y-3">
                  <div className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider border-b border-indigo-100 dark:border-indigo-900/10 pb-1.5">
                    {t("products.initialBatchHeader")}
                  </div>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 leading-normal font-normal">
                    {t("products.initialBatchDesc")}
                  </p>
                  <div className="grid gap-4 grid-cols-2">
                    <div className="grid gap-1">
                      <label className="text-[10px] font-semibold text-zinc-650 dark:text-zinc-350">{t("products.initialBatchNo")}</label>
                      <input
                        type="text"
                        placeholder="e.g. BATCH-A1"
                        value={initialBatchNo}
                        onChange={(e) => setInitialBatchNo(e.target.value)}
                        className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-white dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-[10px] font-semibold text-zinc-650 dark:text-zinc-350">{t("products.initialQty")} ({unit})</label>
                      <input
                        type="number"
                        min="0"
                        value={initialQty === 0 ? "" : initialQty}
                        onChange={(e) => setInitialQty(e.target.value === "" ? 0 : Number(e.target.value))}
                        className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-white dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 grid-cols-2">
                    <div className="grid gap-1">
                      <label className="text-[10px] font-semibold text-zinc-650 dark:text-zinc-350">{t("products.initialExpiry")}</label>
                      <input
                        type="date"
                        value={initialExpiryDate}
                        onChange={(e) => setInitialExpiryDate(e.target.value)}
                        className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-white dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-[10px] font-semibold text-zinc-650 dark:text-zinc-350">{t("products.initialWarehouse")}</label>
                      <select
                        value={initialWarehouseID}
                        onChange={(e) => setInitialWarehouseID(e.target.value)}
                        className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-white dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Pilih Gudang</option>
                        {warehouses.map((wh: any) => (
                          <option key={wh.id} value={wh.id}>
                            {wh.name} ({wh.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Row 10: Prices (Purchase Price, Distributor Price, Retail Price) */}
              <div className="grid gap-4 grid-cols-3 bg-zinc-50 dark:bg-zinc-955 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="grid gap-1">
                  <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">{t("products.purchasePrice")} *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={purchasePrice === 0 ? "" : purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-white dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">{t("products.priceDistributor")} *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={priceDistributor === 0 ? "" : priceDistributor}
                    onChange={(e) => setPriceDistributor(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-white dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">{t("products.priceRetail")} *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={priceRetail === 0 ? "" : priceRetail}
                    onChange={(e) => setPriceRetail(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-white dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
                >
                  {t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
