import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { imsService } from "../../api/ims.service";
import { Plus, Trash2, Search, Key, Pencil } from "lucide-react";
import { useToast } from "../../components/ui";
import { showClearErrorToast } from "../../utils";

const MENU_OPTIONS = [
  { value: "dashboard", label: "Overview Dashboard" },
  { value: "products", label: "Master Barang" },
  { value: "suppliers", label: "Master Supplier" },
  { value: "inward", label: "Barang Masuk" },
  { value: "outward", label: "Barang Keluar" },
  { value: "expired", label: "Monitoring Expired" },
  { value: "opname", label: "Stock Opname" },
];

export const Roles = () => {
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedMenus, setSelectedMenus] = React.useState<string[]>([]);
  const [editingRole, setEditingRole] = React.useState<any | null>(null);

  const { toast } = useToast();
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => imsService.getRoles(),
  });

  const roles = response?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => imsService.createRole(payload),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(toast, res.error, "Failed to create role");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Role created successfully", variant: "default" });
      setIsOpen(false);
      // Reset form
      setName("");
      setDisplayName("");
      setDescription("");
      setSelectedMenus([]);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => imsService.updateRole(id, payload),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(toast, res.error, "Failed to update role");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Role updated successfully", variant: "default" });
      setIsOpen(false);
      setEditingRole(null);
      // Reset form
      setName("");
      setDisplayName("");
      setDescription("");
      setSelectedMenus([]);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => imsService.deleteRole(id),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(toast, res.error, "Failed to delete role");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Role deleted successfully" });
    }
  });

  const handleCheckboxChange = (value: string) => {
    setSelectedMenus((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleEditClick = (item: any) => {
    setEditingRole(item);
    setName(item.name);
    setDisplayName(item.display_name);
    setDescription(item.description || "");
    setSelectedMenus(item.accessible_menus || []);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      display_name: displayName,
      description,
      accessible_menus: selectedMenus,
    };
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredRoles = roles.filter(
    (r: any) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.display_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {t("roles.title")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t("roles.subtitle")}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingRole(null);
            setName("");
            setDisplayName("");
            setDescription("");
            setSelectedMenus([]);
            setIsOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-sm self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          {t("roles.addBtn")}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex gap-4 items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder={t("roles.placeholderSearch")}
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
        ) : filteredRoles.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <Key className="h-10 w-10 text-zinc-300" />
            <p className="text-sm font-semibold text-zinc-500">{t("empty")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-955 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">{t("roles.code")}</th>
                  <th className="py-4 px-6">{t("roles.displayName")}</th>
                  <th className="py-4 px-6">{t("roles.description")}</th>
                  <th className="py-4 px-6">{t("roles.menuAccess")}</th>
                  <th className="py-4 px-6 text-center">{t("action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-855 font-medium text-zinc-700 dark:text-zinc-300">
                {filteredRoles.map((item: any) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                    <td className="py-4 px-6 font-bold text-zinc-900 dark:text-white">{item.name}</td>
                    <td className="py-4 px-6 font-semibold text-indigo-600 dark:text-indigo-400">{item.display_name}</td>
                    <td className="py-4 px-6 text-zinc-500">{item.description || "-"}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {item.accessible_menus && item.accessible_menus.length > 0 ? (
                          item.accessible_menus.map((menu: string, idx: number) => (
                            <span key={idx} className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-650 dark:text-zinc-300 capitalize">
                              {menu}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-zinc-400 italic">No access</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="text-indigo-500 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-955/20 rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {item.name !== "super_admin" && item.name !== "admin" ? (
                          <button
                            onClick={() => {
                              if (confirm(t("roles.confirmDelete", { name: item.display_name }))) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-400 italic">Locked</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Role Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-md font-bold text-zinc-900 dark:text-white">
                {editingRole ? t("roles.editTitle") : t("roles.addTitle")}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-650 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("roles.code")}</label>
                <input
                  type="text"
                  required
                  disabled={!!editingRole}
                  placeholder="e.g. operator"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("roles.displayName")}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Warehouse Operator"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("roles.description")}</label>
                <input
                  type="text"
                  placeholder="e.g. Handles goods in and outward stock"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Checkbox menu access list */}
              <div className="grid gap-2">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("roles.menuAccess")}</label>
                <div className="grid gap-2.5 grid-cols-2 p-3 bg-zinc-50 dark:bg-zinc-955 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  {MENU_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-[11px] font-medium text-zinc-700 dark:text-zinc-350 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMenus.includes(opt.value)}
                        onChange={() => handleCheckboxChange(opt.value)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-zinc-300"
                      />
                      {opt.label}
                    </label>
                  ))}
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
                  {editingRole ? t("save") : t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
