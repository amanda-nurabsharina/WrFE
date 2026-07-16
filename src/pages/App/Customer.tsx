import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { imsService, TCustomer } from "../../api/ims.service";
import { Plus, Trash2, Search, Contact, Pencil } from "lucide-react";
import { useToast } from "../../components/ui";
import { showClearErrorToast } from "../../utils";
import { usePermission } from "../../hooks/usePermission";

export const Customer = () => {
  const { hasPermission } = usePermission();
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [pic, setPic] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [npwp, setNpwp] = React.useState("");
  const [paymentTerm, setPaymentTerm] = React.useState(0);
  const [priceTier, setPriceTier] = React.useState("distributor");
  const [editingCustomer, setEditingCustomer] = React.useState<TCustomer | null>(null);

  const { toast } = useToast();
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () => imsService.getCustomers(search),
  });

  const customers = response?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => imsService.createCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: t("success"),
        description: "Customer created successfully",
        variant: "default",
      });
      setIsOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to create customer");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      imsService.updateCustomer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: t("success"),
        description: "Customer updated successfully",
        variant: "default",
      });
      setIsOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to update customer");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => imsService.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: t("success"),
        description: "Customer deleted successfully",
        variant: "default",
      });
    },
    onError: (err: any) => {
      showClearErrorToast(err, toast, "Failed to delete customer");
    },
  });

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setPic("");
    setAddress("");
    setNpwp("");
    setPaymentTerm(0);
    setPriceTier("distributor");
    setEditingCustomer(null);
  };

  const handleEditClick = (cust: TCustomer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone || "");
    setEmail(cust.email || "");
    setPic(cust.pic || "");
    setAddress(cust.address || "");
    setNpwp(cust.npwp || "");
    setPaymentTerm(cust.payment_term || 0);
    setPriceTier(cust.price_tier || "distributor");
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      phone,
      email,
      pic,
      address,
      npwp,
      payment_term: Number(paymentTerm),
      price_tier: priceTier,
    };

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {t("customers.title")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t("customers.subtitle")}
          </p>
        </div>
        {hasPermission("customers", "create") && (
          <button
            onClick={() => {
              resetForm();
              setIsOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-sm self-start sm:self-center"
          >
            <Plus className="h-4 w-4" />
            {t("customers.addBtn")}
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex gap-4 items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder={t("customers.placeholderSearch")}
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
        ) : customers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <Contact className="h-10 w-10 text-zinc-300" />
            <p className="text-sm font-semibold text-zinc-500">{t("empty")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-955 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">{t("customers.name")}</th>
                  <th className="py-4 px-6">{t("customers.pic")}</th>
                  <th className="py-4 px-6">{t("customers.priceTier")}</th>
                  <th className="py-4 px-6">{t("customers.paymentTerm")}</th>
                  <th className="py-4 px-6">{t("customers.npwp")}</th>
                  <th className="py-4 px-6">{t("customers.address")}</th>
                  <th className="py-4 px-6 text-center">{t("action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-855 font-medium text-zinc-700 dark:text-zinc-300">
                {customers.map((cust: TCustomer) => (
                  <tr key={cust.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                    <td className="py-4 px-6">
                      <div className="font-bold text-zinc-900 dark:text-white">{cust.name}</div>
                      <div className="text-[10px] text-zinc-400 font-normal">{cust.phone || "-"}</div>
                      <div className="text-[10px] text-zinc-450 font-normal">{cust.email || ""}</div>
                    </td>
                    <td className="py-4 px-6 text-zinc-900 dark:text-white font-semibold">{cust.pic || "-"}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        cust.price_tier === "distributor" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400" :
                        "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
                      }`}>
                        {cust.price_tier || "distributor"}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-zinc-900 dark:text-white">
                      {cust.payment_term ? `${cust.payment_term} Hari` : "COD"}
                    </td>
                    <td className="py-4 px-6 text-zinc-500 font-mono">{cust.npwp || "-"}</td>
                    <td className="py-4 px-6 text-zinc-500 max-w-[200px] truncate">{cust.address || "-"}</td>
                    <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                      {hasPermission("customers", "edit") && (
                        <button
                          onClick={() => handleEditClick(cust)}
                          className="text-indigo-500 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-955/20 rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {hasPermission("customers", "delete") && (
                        <button
                          onClick={() => {
                            if (confirm(t("customers.confirmDelete", { name: cust.name }))) {
                              deleteMutation.mutate(cust.id);
                            }
                          }}
                          className="text-rose-500 hover:text-rose-600 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {!hasPermission("customers", "edit") && !hasPermission("customers", "delete") && (
                        <span className="text-[10px] text-zinc-400 italic">No Actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog Form */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-md font-bold text-zinc-900 dark:text-white">
                {editingCustomer ? t("customers.editTitle") : t("customers.addTitle")}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-650 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("customers.name")} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Toko Tani Makmur"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("customers.pic")} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Haji Makmur"
                    value={pic}
                    onChange={(e) => setPic(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("customers.phone")}</label>
                  <input
                    type="text"
                    placeholder="e.g. 0812345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("customers.email")}</label>
                  <input
                    type="email"
                    placeholder="e.g. contact@store.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 grid-cols-3">
                <div className="grid gap-1 col-span-2">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("customers.npwp")}</label>
                  <input
                    type="text"
                    placeholder="e.g. 01.234.567.8-901.000"
                    value={npwp}
                    onChange={(e) => setNpwp(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("customers.paymentTerm")} *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={paymentTerm}
                    onChange={(e) => setPaymentTerm(Number(e.target.value))}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("customers.priceTier")} *</label>
                <select
                  value={priceTier}
                  onChange={(e) => setPriceTier(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="distributor">Distributor Price (Harga Distributor)</option>
                  <option value="retail">Retail Price (Harga Retail)</option>
                </select>
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("customers.address")}</label>
                <textarea
                  placeholder="Street details..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
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
