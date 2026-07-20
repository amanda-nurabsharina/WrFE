import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { imsService, TSalesOrder } from "../../api/ims.service";
import { useToast } from "../../components/ui";
import { showClearErrorToast } from "../../utils";
import { ShoppingCart, Plus, Check, ChevronDown, ChevronUp, AlertTriangle, Layers, Printer } from "lucide-react";
import { usePermission } from "../../hooks/usePermission";

export const SalesOrders = () => {
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [customerId, setCustomerId] = React.useState("");
  const [orderDate, setOrderDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = React.useState<{ product_id: string; qty: number; price: number }[]>([
    { product_id: "", qty: 1, price: 0 }
  ]);
  const [expandedSoId, setExpandedSoId] = React.useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const isApprover = hasPermission("sales-orders", "approve");

  // Queries
  const { data: sosResp, isLoading } = useQuery({
    queryKey: ["sales-orders", search],
    queryFn: () => imsService.getSalesOrders(search),
  });
  const { data: custsResp } = useQuery({ queryKey: ["customers"], queryFn: () => imsService.getCustomers() });
  const { data: prodsResp } = useQuery({ queryKey: ["products"], queryFn: () => imsService.getProducts() });

  const salesOrders = sosResp?.data?.data || [];
  const customers = custsResp?.data?.data || [];
  const products = prodsResp?.data?.data || [];

  const selectedCustomer = customers.find((c: any) => c.id === customerId);

  const createMutation = useMutation({
    mutationFn: (payload: any) => imsService.createSalesOrder(payload),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(res.error, toast, "Failed to create SO");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast({ title: "Sales Order created successfully", variant: "default" });
      setIsOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to create SO");
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => imsService.approveSalesOrder(id),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(res.error, toast, "Failed to approve SO");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast({ title: "Sales Order approved successfully", variant: "default" });
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to approve SO");
    }
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => imsService.updateSalesOrderPaymentStatus(id, status),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(res.error, toast, "Failed to update payment status");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast({ title: "Payment status updated successfully", variant: "default" });
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to update payment status");
    }
  });

  const handleUpdatePaymentStatus = (id: string, status: string) => {
    updatePaymentMutation.mutate({ id, status });
  };

  const handlePrintSO = (so: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsRows = so.items?.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product?.code} - ${item.product?.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item.qty} ${item.product?.unit || ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">Rp ${item.price?.toLocaleString("id-ID")}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">Rp ${(item.qty * item.price)?.toLocaleString("id-ID")}</td>
      </tr>
    `).join("") || "";

    const total = so.items?.reduce((sum: number, item: any) => sum + (item.qty * item.price), 0) || 0;

    printWindow.document.write(`
      <html>
        <head>
          <title>Sales Order - ${so.so_number}</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; }
            .info-section { display: flex; justify-content: space-between; margin-top: 30px; }
            .info-block { width: 45%; }
            .info-block h3 { margin-bottom: 5px; font-size: 14px; text-transform: uppercase; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 40px; }
            th { background: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-size: 12px; text-transform: uppercase; }
            .totals { margin-top: 30px; text-align: right; font-size: 16px; font-weight: bold; }
            .signature { margin-top: 60px; display: flex; justify-content: space-between; }
            .sig-line { border-top: 1px solid #333; width: 200px; text-align: center; margin-top: 60px; padding-top: 5px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">SALES ORDER</div>
              <div style="font-size: 14px; margin-top: 5px; font-weight: bold;">No: ${so.so_number}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold; font-size: 18px;">WAREHOUSE IMS</div>
              <div style="font-size: 12px; color: #666;">Kawasan Industri Jababeka, Bekasi</div>
            </div>
          </div>
          
          <div class="info-section">
            <div class="info-block">
              <h3>Customer Info</h3>
              <strong>${so.customer?.name || "-"}</strong><br/>
              Phone: ${so.customer?.phone || "-"}<br/>
              Email: ${so.customer?.email || "-"}<br/>
              Address: ${so.customer?.address || "-"}
            </div>
            <div class="info-block" style="text-align: right;">
              <h3>Order Info</h3>
              Order Date: ${new Date(so.order_date).toLocaleDateString("id-ID")}<br/>
              Status: <span style="text-transform: uppercase; font-weight: bold;">${so.status}</span><br/>
              Payment Status: <span style="text-transform: uppercase; font-weight: bold;">${so.payment_status || "unpaid"}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product Description</th>
                <th style="text-align: right;">Quantity</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals">
            Total Amount: Rp ${total.toLocaleString("id-ID")}
          </div>

          <div class="signature">
            <div>
              Authorized Signature
              <div class="sig-line">Sales Coordinator</div>
            </div>
            <div style="text-align: right;">
              Customer Acceptance
              <div class="sig-line">Customer Rep</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const resetForm = () => {
    setCustomerId("");
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
    
    // Auto-fill price based on Product and Customer Price Tier
    if (field === "product_id" || (field === "" && itemHasProductChanged(index, value))) {
      const prodId = field === "product_id" ? value : updated[index].product_id;
      const prod = products.find((p: any) => p.id === prodId);
      if (prod) {
        const tier = selectedCustomer?.price_tier || "distributor";
        updated[index].price = (tier === "retail" ? prod.price_retail : prod.price_distributor) ?? 0;
      }
    }
    setItems(updated);
  };

  const itemHasProductChanged = (index: number, newProdId: string) => {
    return items[index].product_id !== newProdId;
  };

  // Trigger price refills when customer changes (price tier can change)
  React.useEffect(() => {
    if (!selectedCustomer) return;
    const updated = items.map((it) => {
      if (!it.product_id) return it;
      const prod = products.find((p: any) => p.id === it.product_id);
      if (prod) {
        const tier = selectedCustomer.price_tier || "distributor";
        return { ...it, price: (tier === "retail" ? prod.price_retail : prod.price_distributor) ?? 0 };
      }
      return it;
    });
    setItems(updated);
  }, [customerId]);

  const hasB3InSelected = items.some((it) => {
    const prod = products.find((p: any) => p.id === it.product_id);
    return prod?.reg_category === "B3";
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast({ title: "Validation Error", description: "Please select a customer", variant: "destructive" });
      return;
    }

    const filteredItems = items.filter(it => it.product_id !== "");
    if (filteredItems.length === 0) {
      toast({ title: "Validation Error", description: "Please add at least one product", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      customer_id: customerId,
      so_number: `SO-${Date.now()}`,
      order_date: orderDate,
      items: filteredItems,
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
      case "pending_b3_approval":
        return "bg-rose-100 text-rose-700 dark:bg-rose-955 dark:text-rose-300 border-rose-200 dark:border-rose-900";
      case "approved":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400";
      case "partially_shipped":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400";
      case "shipped":
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
            Sales Orders (SO)
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage customer sales, trigger FEFO stock allocations, and check B3 safety holds.
          </p>
        </div>
        {hasPermission("sales-orders", "create") && (
          <button
            onClick={() => {
              resetForm();
              setIsOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-sm self-start sm:self-center"
          >
            <Plus className="h-4 w-4" />
            Create SO
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex gap-4 items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by SO number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full text-sm bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* SO List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading orders...</div>
        ) : salesOrders.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center gap-3 shadow-sm">
            <ShoppingCart className="h-10 w-10 text-zinc-300" />
            <p className="text-sm font-semibold text-zinc-500">No Sales Orders Found</p>
          </div>
        ) : (
          salesOrders.map((so: TSalesOrder) => {
            const isExpanded = expandedSoId === so.id;
            return (
              <div
                key={so.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:border-zinc-300 dark:hover:border-zinc-755 transition-all"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => setExpandedSoId(isExpanded ? null : so.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-zinc-900 dark:text-white text-sm">{so.so_number}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(so.status)}`}>
                        {so.status === "pending_b3_approval" ? "B3 Approval Required" : so.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        so.payment_status === "paid"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : so.payment_status === "partially_paid"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-955 dark:text-rose-300"
                      }`}>
                        {so.payment_status || "unpaid"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Customer: <strong className="text-zinc-700 dark:text-zinc-200">{so.customer?.name}</strong> • Price Tier: <span className="font-bold text-indigo-500 uppercase text-[10px]">{so.customer?.price_tier || "distributor"}</span> • Date: {new Date(so.order_date).toLocaleDateString("id-ID")}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintSO(so);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-150 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 rounded-lg text-[10px] font-bold transition-all"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print SO
                    </button>
                    <select
                      value={so.payment_status || "unpaid"}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        handleUpdatePaymentStatus(so.id, e.target.value);
                      }}
                      className="px-2 py-1 text-[10px] font-bold border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none"
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="partially_paid">Partially Paid</option>
                      <option value="paid">Paid</option>
                    </select>
                    {(so.status === "draft" || so.status === "pending_b3_approval") && isApprover && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Approve Sales Order ${so.so_number}?`)) {
                            approveMutation.mutate(so.id);
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
                  <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-850 pt-4 bg-zinc-50/50 dark:bg-zinc-955/30">
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
                            <th className="py-2.5 px-4 text-right">Shipped Qty</th>
                            <th className="py-2.5 px-4 text-right">Selling Price</th>
                            <th className="py-2.5 px-4 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-855 text-zinc-650 dark:text-zinc-300 font-medium">
                          {so.items?.map((item: any) => (
                            <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                              <td className="py-3 px-4">
                                <div className="font-bold text-zinc-900 dark:text-white">
                                  {item.product?.name}
                                  {item.product?.reg_category === "B3" && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] bg-red-100 text-red-700 font-bold uppercase">B3</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-zinc-450 font-normal">{item.product?.code} ({item.product?.unit})</div>
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-zinc-850 dark:text-white">{item.qty}</td>
                              <td className="py-3 px-4 text-right font-bold">
                                <span className={item.shipped_qty === item.qty ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}>
                                  {item.shipped_qty}
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
              <h3 className="text-md font-bold text-zinc-900 dark:text-white">Create Sales Order</h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Customer *</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.price_tier || "distributor"})</option>
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

              {selectedCustomer && (
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 rounded-xl text-[10px] font-semibold flex items-center justify-between">
                  <span>Price Tier Applied: <strong className="uppercase">{selectedCustomer.price_tier || "distributor"}</strong></span>
                  <span>Payment Term: <strong>{selectedCustomer.payment_term || 0} Days</strong></span>
                </div>
              )}

              {/* B3 Warning Banner */}
              {hasB3InSelected && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900 rounded-xl text-[10px] font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span>Warning: Contains B3 chemicals. Order status will be set to pending safety approval.</span>
                </div>
              )}

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
                  <div key={idx} className="flex gap-2 items-end bg-zinc-50 dark:bg-zinc-955 p-3 rounded-lg border border-zinc-150 dark:border-zinc-855">
                    <div className="flex-1 grid gap-1">
                      <label className="text-[9px] text-zinc-400">Product</label>
                      <select
                        value={item.product_id}
                        onChange={(e) => handleItemChange(idx, "product_id", e.target.value)}
                        className="px-2 py-1.5 text-xs border border-zinc-250 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-800 dark:text-black focus:outline-none"
                      >
                        <option value="">Select Product</option>
                        {products.map((prod: any) => (
                          <option key={prod.id} value={prod.id}>{prod.code} - {prod.name} {prod.reg_category === "B3" ? "[B3]" : ""}</option>
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
                      <label className="text-[9px] text-zinc-400">Selling Price</label>
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

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100 dark:border-zinc-855">
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
                  Create SO
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
