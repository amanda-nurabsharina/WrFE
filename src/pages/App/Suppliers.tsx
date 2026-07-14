import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { imsService } from "../../api/ims.service";
import { Plus, Trash2, Search, Building2, Pencil } from "lucide-react";
import { useToast } from "../../components/ui";
import { showClearErrorToast } from "../../utils";

export const Suppliers = () => {
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [editingSupplier, setEditingSupplier] = React.useState<any | null>(null);

  const { toast } = useToast();
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["suppliers", search],
    queryFn: () => imsService.getSuppliers(search),
  });

  const suppliers = response?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => imsService.createSupplier(payload),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(toast, res.error, "Failed to create supplier");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Supplier created successfully", variant: "default" });
      setIsOpen(false);
      // Reset form
      setName("");
      setPhone("");
      setEmail("");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => imsService.updateSupplier(id, payload),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(toast, res.error, "Failed to update supplier");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Supplier updated successfully", variant: "default" });
      setIsOpen(false);
      setEditingSupplier(null);
      // Reset form
      setName("");
      setPhone("");
      setEmail("");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => imsService.deleteSupplier(id),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(toast, res.error, "Failed to delete supplier");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Supplier deleted successfully" });
    }
  });

  const handleEditClick = (sup: any) => {
    setEditingSupplier(sup);
    setName(sup.name);
    setPhone(sup.phone || "");
    setEmail(sup.email || "");
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      phone,
      email,
    };
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, payload });
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
            {t("suppliers.title")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t("suppliers.subtitle")}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSupplier(null);
            setName("");
            setPhone("");
            setEmail("");
            setIsOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-sm self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          {t("suppliers.addBtn")}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex gap-4 items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder={t("suppliers.placeholderSearch")}
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
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <Building2 className="h-10 w-10 text-zinc-300" />
            <p className="text-sm font-semibold text-zinc-500">{t("empty")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-955 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">{t("suppliers.name")}</th>
                  <th className="py-4 px-6">{t("suppliers.phone")}</th>
                  <th className="py-4 px-6">{t("suppliers.email")}</th>
                  <th className="py-4 px-6 text-center">{t("action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-855 font-medium text-zinc-700 dark:text-zinc-300">
                {suppliers.map((sup: any) => (
                  <tr key={sup.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                    <td className="py-4 px-6 font-bold text-zinc-900 dark:text-white">{sup.name}</td>
                    <td className="py-4 px-6 text-zinc-650 dark:text-zinc-400">{sup.phone || "-"}</td>
                    <td className="py-4 px-6 text-zinc-500">{sup.email || "-"}</td>
                    <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditClick(sup)}
                        className="text-indigo-500 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-955/20 rounded-lg transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t("suppliers.confirmDelete", { name: sup.name }))) {
                            deleteMutation.mutate(sup.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Supplier Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-md font-bold text-zinc-900 dark:text-white">
                {editingSupplier ? t("suppliers.editTitle") : t("suppliers.addTitle")}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("suppliers.name")}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PT. Kimia Farma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("suppliers.phone")}</label>
                <input
                  type="text"
                  placeholder="e.g. 021-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("suppliers.email")}</label>
                <input
                  type="email"
                  placeholder="e.g. contact@supplier.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  {editingSupplier ? t("save") : t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
