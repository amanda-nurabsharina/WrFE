import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { imsService } from "../../api/ims.service";
import { Plus, Trash2, Search, Key, Pencil, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "../../components/ui";
import { showClearErrorToast } from "../../utils";

const MENU_OPTIONS = [
  { value: "dashboard", label: "Overview Dashboard" },
  { value: "products", label: "Master Barang" },
  { value: "suppliers", label: "Master Supplier" },
  { value: "customers", label: "Master Customer" },
  { value: "packaging", label: "Packaging Units" },
  { value: "inward", label: "Barang Masuk" },
  { value: "outward", label: "Barang Keluar" },
  { value: "expired", label: "Monitoring Expired" },
  { value: "opname", label: "Stock Opname" },
  { value: "purchase-orders", label: "Purchase Orders (PO)" },
  { value: "sales-orders", label: "Sales Orders (SO)" },
  { value: "approver", label: "Approver (PO/SO/B3)" },
  { value: "activity-log", label: "Log Activity (Audit)" },
];

const ACTION_OPTIONS = [
  { value: "view", label: "View", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  { value: "create", label: "Create", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  { value: "edit", label: "Edit", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
  { value: "delete", label: "Delete", color: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400" },
  { value: "approve", label: "Approve", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400" },
];

type PermissionMap = Record<string, string[]>;

export const Roles = () => {
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedMenus, setSelectedMenus] = React.useState<string[]>([]);
  const [permissions, setPermissions] = React.useState<PermissionMap>({});
  const [expandedMenus, setExpandedMenus] = React.useState<string[]>([]);
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
      resetForm();
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
      resetForm();
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

  const resetForm = () => {
    setName("");
    setDisplayName("");
    setDescription("");
    setSelectedMenus([]);
    setPermissions({});
    setExpandedMenus([]);
    setEditingRole(null);
  };

  const handleMenuToggle = (menuValue: string) => {
    setSelectedMenus((prev) => {
      if (prev.includes(menuValue)) {
        // Also remove from permissions
        setPermissions((p) => {
          const next = { ...p };
          delete next[menuValue];
          return next;
        });
        return prev.filter((m) => m !== menuValue);
      } else {
        // Auto-grant "view" when enabling a menu
        setPermissions((p) => ({
          ...p,
          [menuValue]: p[menuValue]?.length ? p[menuValue] : ["view"],
        }));
        return [...prev, menuValue];
      }
    });
  };

  const handleActionToggle = (menuValue: string, action: string) => {
    setPermissions((prev) => {
      const current = prev[menuValue] || [];
      let next: string[];
      if (current.includes(action)) {
        next = current.filter((a) => a !== action);
        // If no actions left, keep at least "view"
        if (next.length === 0) next = ["view"];
      } else {
        next = [...current, action];
      }
      return { ...prev, [menuValue]: next };
    });
  };

  const toggleExpand = (menuValue: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuValue) ? prev.filter((m) => m !== menuValue) : [...prev, menuValue]
    );
  };

  const handleEditClick = (item: any) => {
    setEditingRole(item);
    setName(item.name);
    setDisplayName(item.display_name);
    setDescription(item.description || "");
    setSelectedMenus(item.accessible_menus || []);
    setPermissions(item.permissions || {});
    setExpandedMenus([]);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      display_name: displayName,
      description,
      accessible_menus: selectedMenus,
      permissions,
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
            resetForm();
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

      {/* Add/Edit Role Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <h3 className="text-md font-bold text-zinc-900 dark:text-white">
                {editingRole ? t("roles.editTitle") : t("roles.addTitle")}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-650 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
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

              {/* Granular Permissions — expandable per menu */}
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Menu Access & Permissions
                </label>
                <div className="bg-zinc-50 dark:bg-zinc-955 rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
                  {MENU_OPTIONS.map((opt) => {
                    const isEnabled = selectedMenus.includes(opt.value);
                    const isExpanded = expandedMenus.includes(opt.value);
                    const menuPerms = permissions[opt.value] || [];

                    return (
                      <div key={opt.value}>
                        {/* Menu row */}
                        <div className="flex items-center gap-2 px-3 py-2">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => handleMenuToggle(opt.value)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-zinc-300"
                          />
                          <button
                            type="button"
                            onClick={() => isEnabled && toggleExpand(opt.value)}
                            className={`flex-1 flex items-center justify-between text-[11px] font-medium ${
                              isEnabled ? "text-zinc-800 dark:text-zinc-200 cursor-pointer" : "text-zinc-400 cursor-default"
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isEnabled && (
                              <div className="flex items-center gap-1.5">
                                <div className="flex gap-0.5">
                                  {menuPerms.map((a) => {
                                    const actionDef = ACTION_OPTIONS.find((ao) => ao.value === a);
                                    return actionDef ? (
                                      <span key={a} className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${actionDef.color}`}>
                                        {actionDef.label}
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                                {isExpanded ? <ChevronDown className="h-3 w-3 text-zinc-400" /> : <ChevronRight className="h-3 w-3 text-zinc-400" />}
                              </div>
                            )}
                          </button>
                        </div>

                        {/* Expanded action checkboxes */}
                        {isEnabled && isExpanded && (
                          <div className="px-8 pb-2.5 flex flex-wrap gap-3 animate-in fade-in duration-150">
                            {ACTION_OPTIONS.map((action) => (
                              <label key={action.value} className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={menuPerms.includes(action.value)}
                                  onChange={() => handleActionToggle(opt.value, action.value)}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3 w-3 border-zinc-300"
                                />
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${action.color}`}>{action.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
