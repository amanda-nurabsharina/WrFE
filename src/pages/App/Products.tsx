import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { imsService, TProduct } from "../../api/ims.service";
import { Plus, Trash2, Search, Package2, Pencil } from "lucide-react";
import { useToast } from "../../components/ui";
import { showClearErrorToast } from "../../utils";

export const Products = () => {
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [barcode, setBarcode] = React.useState("");
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [unit, setUnit] = React.useState("Box");
  const [minStock, setMinStock] = React.useState(0);
  const [editingProduct, setEditingProduct] = React.useState<TProduct | null>(null);

  const { toast } = useToast();
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: () => imsService.getProducts(search),
  });

  const products = response?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => imsService.createProduct(payload),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(toast, res.error, "Failed to create product");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product created successfully", variant: "default" });
      setIsOpen(false);
      // Reset form
      setCode("");
      setBarcode("");
      setName("");
      setCategory("");
      setUnit("Box");
      setMinStock(0);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => imsService.updateProduct(id, payload),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(toast, res.error, "Failed to update product");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product updated successfully", variant: "default" });
      setIsOpen(false);
      setEditingProduct(null);
      // Reset form
      setCode("");
      setBarcode("");
      setName("");
      setCategory("");
      setUnit("Box");
      setMinStock(0);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => imsService.deleteProduct(id),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(toast, res.error, "Failed to delete product");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product deleted successfully" });
    }
  });

  const handleEditClick = (prod: TProduct) => {
    setEditingProduct(prod);
    setCode(prod.code);
    setBarcode(prod.barcode || "");
    setName(prod.name);
    setCategory(prod.category_id || "");
    setUnit(prod.unit);
    setMinStock(prod.minimum_stock);
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
    };
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, payload });
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
            {t("products.title")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t("products.subtitle")}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setCode("");
            setBarcode("");
            setName("");
            setCategory("");
            setUnit("Box");
            setMinStock(0);
            setIsOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-sm self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          {t("products.addBtn")}
        </button>
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
            className="pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full text-sm bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <th className="py-4 px-6">{t("products.barcode")}</th>
                  <th className="py-4 px-6">{t("products.category")}</th>
                  <th className="py-4 px-6">{t("products.unit")}</th>
                  <th className="py-4 px-6">{t("products.minStock")}</th>
                  <th className="py-4 px-6 text-center">{t("action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-855 font-medium text-zinc-700 dark:text-zinc-300">
                {products.map((prod: TProduct) => (
                  <tr key={prod.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                    <td className="py-4 px-6 font-bold text-indigo-600 dark:text-indigo-400">{prod.code}</td>
                    <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-white">{prod.name}</td>
                    <td className="py-4 px-6 text-zinc-500">{prod.barcode || "-"}</td>
                    <td className="py-4 px-6">
                      <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">
                        {prod.category_id || "General"}
                      </span>
                    </td>
                    <td className="py-4 px-6">{prod.unit}</td>
                    <td className="py-4 px-6">{prod.minimum_stock}</td>
                    <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditClick(prod)}
                        className="text-indigo-500 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-955/20 rounded-lg transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-md font-bold text-zinc-900 dark:text-white">
                {editingProduct ? t("products.editTitle") : t("products.addTitle")}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-650 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("products.code")}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PRD-PCT"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("products.name")}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 500mg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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

              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("products.category")}</label>
                  <input
                    type="text"
                    placeholder="e.g. Medicine"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("products.unit")}</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Box">Box</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Carton">Carton</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("products.minStock")}</label>
                <input
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(Number(e.target.value))}
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
                  {editingProduct ? t("save") : t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
