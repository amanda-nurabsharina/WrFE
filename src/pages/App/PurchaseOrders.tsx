import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { imsService, TPurchaseOrder } from "../../api/ims.service";
import { useToast } from "../../components/ui";
import { showClearErrorToast } from "../../utils";
import { FileSpreadsheet, Plus, Check, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { usePermission } from "../../hooks/usePermission";

export const PurchaseOrders = () => {
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [supplierId, setSupplierId] = React.useState("");
  const [orderDate, setOrderDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = React.useState<{ product_id: string; qty: number; price: number }[]>([
    { product_id: "", qty: 1, price: 0 }
  ]);
  const [expandedPoId, setExpandedPoId] = React.useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const isApprover = hasPermission("purchase-orders", "approve");

  // Queries
  const { data: posResp, isLoading } = useQuery({
    queryKey: ["purchase-orders", search],
    queryFn: () => imsService.getPurchaseOrders(search),
  });
  const { data: supsResp } = useQuery({ queryKey: ["suppliers"], queryFn: () => imsService.getSuppliers() });
  const { data: prodsResp } = useQuery({ queryKey: ["products"], queryFn: () => imsService.getProducts() });

  const purchaseOrders = posResp?.data?.data || [];
  const suppliers = supsResp?.data?.data || [];
  const products = prodsResp?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => imsService.createPurchaseOrder(payload),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(res.error, toast, "Failed to create PO");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({ title: "Purchase Order created successfully", variant: "default" });
      setIsOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to create PO");
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => imsService.approvePurchaseOrder(id),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(res.error, toast, "Failed to approve PO");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({ title: "Purchase Order approved successfully", variant: "default" });
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to approve PO");
    }
  });

  const resetForm = () => {
    setSupplierId("");
    setOrderDate(new Date().toISOString().slice(0, 10));
    setItems([{ product_id: "", qty: 1, price: 0 }]);
  };

  const handleAddItem = () => {
    setItems([...items, { product_id: "", qty: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    // Auto-fill price if product changes
    if (field === "product_id") {
      const prod = products.find((p: any) => p.id === value);
      if (prod) {
        updated[index].price = prod.purchase_price ?? 0;
      }
    }
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      toast({ title: "Validation Error", description: "Please select a supplier", variant: "destructive" });
      return;
    }

    const filteredItems = items.filter(it => it.product_id !== "");
    if (filteredItems.length === 0) {
      toast({ title: "Validation Error", description: "Please add at least one product", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      supplier_id: supplierId,
      po_number: `PO-${Date.now()}`,
      order_date: orderDate,
      items: filteredItems,
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
      case "approved":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400";
      case "partially_received":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400";
      case "completed":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Purchase Orders (PO)
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage purchase agreements, check approvals, and match inbound receipts.
          </p>
        </div>
        {hasPermission("purchase-orders", "create") && (
          <button
            onClick={() => {
              resetForm();
              setIsOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-sm self-start sm:self-center"
          >
            <Plus className="h-4 w-4" />
            Create PO
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex gap-4 items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by PO number or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full text-sm bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* PO List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading orders...</div>
        ) : purchaseOrders.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center gap-3 shadow-sm">
            <FileSpreadsheet className="h-10 w-10 text-zinc-300" />
            <p className="text-sm font-semibold text-zinc-500">No Purchase Orders Found</p>
          </div>
        ) : (
          purchaseOrders.map((po: TPurchaseOrder) => {
            const isExpanded = expandedPoId === po.id;
            return (
              <div
                key={po.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:border-zinc-300 dark:hover:border-zinc-755 transition-all"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => setExpandedPoId(isExpanded ? null : po.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-zinc-900 dark:text-white text-sm">{po.po_number}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(po.status)}`}>
                        {po.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Supplier: <strong className="text-zinc-700 dark:text-zinc-200">{po.supplier?.name}</strong> • Date: {new Date(po.order_date).toLocaleDateString("id-ID")}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    {po.status === "draft" && isApprover && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Approve Purchase Order ${po.po_number}?`)) {
                            approveMutation.mutate(po.id);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all"
                      >
                        <Check className="h-3 w-3" />
                        Approve
                      </button>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                  </div>
                </div>

                {/* Accordion Detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-850 pt-4 bg-zinc-50/50 dark:bg-zinc-950/30">
                    <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-indigo-500" />
                      Order Details
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-955 border-b border-zinc-150 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold text-[10px]">
                            <th className="py-2.5 px-4">Product Code & Name</th>
                            <th className="py-2.5 px-4 text-right">Ordered Qty</th>
                            <th className="py-2.5 px-4 text-right">Received Qty</th>
                            <th className="py-2.5 px-4 text-right">Unit Price</th>
                            <th className="py-2.5 px-4 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-650 dark:text-zinc-300 font-medium">
                          {po.items?.map((item: any) => (
                            <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                              <td className="py-3 px-4">
                                <div className="font-bold text-zinc-900 dark:text-white">{item.product?.name}</div>
                                <div className="text-[10px] text-zinc-450 font-normal">{item.product?.code} ({item.product?.unit})</div>
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-zinc-850 dark:text-white">{item.qty}</td>
                              <td className="py-3 px-4 text-right font-bold">
                                <span className={item.received_qty === item.qty ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                                  {item.received_qty}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono">Rp {item.price?.toLocaleString("id-ID")}</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-white">
                                Rp {(item.qty * item.price)?.toLocaleString("id-ID")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Modal Form */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-md font-bold text-zinc-900 dark:text-white">Create Purchase Order</h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Supplier *</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((sup: any) => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Order Date *</label>
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-850 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Products List</h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
                  >
                    + Add Product Row
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end bg-zinc-50 dark:bg-zinc-955 p-3 rounded-lg border border-zinc-150 dark:border-zinc-850">
                    <div className="flex-1 grid gap-1">
                      <label className="text-[9px] text-zinc-400">Product</label>
                      <select
                        value={item.product_id}
                        onChange={(e) => handleItemChange(idx, "product_id", e.target.value)}
                        className="px-2 py-1.5 text-xs border border-zinc-250 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-800 dark:text-black focus:outline-none"
                      >
                        <option value="">Select Product</option>
                        {products.map((prod: any) => (
                          <option key={prod.id} value={prod.id}>{prod.code} - {prod.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24 grid gap-1">
                      <label className="text-[9px] text-zinc-400">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, "qty", Number(e.target.value))}
                        className="px-2 py-1 text-xs border border-zinc-250 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-800 dark:text-black focus:outline-none"
                      />
                    </div>

                    <div className="w-32 grid gap-1">
                      <label className="text-[9px] text-zinc-400">Purchase Price</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={item.price}
                        onChange={(e) => handleItemChange(idx, "price", Number(e.target.value))}
                        className="px-2 py-1 text-xs border border-zinc-250 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-800 dark:text-black focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length === 1}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded disabled:opacity-50"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
                >
                  Create PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SearchIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
  </svg>
);
