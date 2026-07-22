import * as React from "react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { imsService } from "../../api/ims.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  LangToggler,
  ThemeToggler,
  RouteLink
} from "../../components/ui";
import {
  LayoutDashboard,
  LogOut,
  User,
  Menu,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Building2,
  Bell,
  Users,
  Key,
  Box,
  Contact,
  FileSpreadsheet,
  ShoppingCart,
  History,
  Database,
  ChevronDown,
  Settings,
  Warehouse,
  CheckSquare,
  Layers
} from "lucide-react";
import { useAppLayout } from "./useAppLayout";
import { useStore } from "../../store/store";
import { useUIStore } from "../../store/uiStore";

export const AppLayout = () => {
  const { handleLogout } = useAppLayout();
  const user = useStore((state) => state.user);
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [isAllAlertsModalOpen, setIsAllAlertsModalOpen] = React.useState(false);
  const [alertFilterTab, setAlertFilterTab] = React.useState<"all" | "critical" | "warning">("all");
  const [alertSearchQuery, setAlertSearchQuery] = React.useState("");
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  const { data: alertsResp } = useQuery({
    queryKey: ["expiryAlerts"],
    queryFn: () => imsService.getExpiryAlerts(),
    refetchInterval: 15000,
  });

  const alerts = alertsResp?.data?.data || [];

  const { data: productsResp } = useQuery({
    queryKey: ["products", ""],
    queryFn: () => imsService.getProducts(""),
    refetchInterval: 15000,
  });

  const productsList = productsResp?.data?.data || [];

  const notificationsList = React.useMemo(() => {
    const list: any[] = [];
    
    // 1. Add Expiry alerts
    alerts.forEach((a: any) => {
      const expDate = new Date(a.expired_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = diffDays <= 0;
      
      list.push({
        id: `expiry-${a.id}`,
        type: "expiry",
        title: a.product?.name || "Product",
        subtitle: `Batch: ${a.batch_number}`,
        message: isExpired 
          ? t("navigation.msgExpired", { batch: a.batch_number })
          : t("navigation.msgNearExpiry", { batch: a.batch_number, days: diffDays }),
        link: "/app/expired",
        severity: isExpired ? "critical" : "warning",
        priorityScore: isExpired ? 1000 + Math.abs(diffDays) : 500 - diffDays,
      });
    });

    // 2. Add Low Stock & Out of Stock alerts
    productsList.forEach((p: any) => {
      const stock = p.stock ?? 0;
      if (stock === 0) {
        list.push({
          id: `out-of-stock-${p.id}`,
          type: "out_of_stock",
          title: p.name,
          subtitle: p.code,
          message: t("navigation.msgOutOfStock", { min: p.minimum_stock, unit: p.unit }),
          link: "/app/products",
          severity: "critical",
          priorityScore: 900,
        });
      } else if (stock <= p.minimum_stock) {
        list.push({
          id: `low-stock-${p.id}`,
          type: "low_stock",
          title: p.name,
          subtitle: p.code,
          message: t("navigation.msgLowStock", { stock, unit: p.unit, min: p.minimum_stock }),
          link: "/app/products",
          severity: "warning",
          priorityScore: 400,
        });
      }
    });

    // Sort by priorityScore descending (Critical/Urgent at top)
    return list.sort((a, b) => b.priorityScore - a.priorityScore);
  }, [productsList, alerts, t]);

  const isAdmin = user?.role === "admin" || user?.role?.includes("admin") || user?.role?.includes("super");

  const { data: rolesResp } = useQuery({
    queryKey: ["roles"],
    queryFn: () => imsService.getRoles(),
    enabled: !!user,
  });

  const roles = rolesResp?.data?.data || [];
  const roleName = user?.rawRole || (user?.role as unknown as string) || "";
  const userRoleObj = roles.find((r: any) => r.name === roleName);
  const userMenus = userRoleObj?.accessible_menus || [];

  const hasMenuAccess = (menuKey: string) => {
    return userMenus.includes(menuKey);
  };

  // --- Menu Group Definitions ---
  const menuGroups = React.useMemo(() => {
    return [
      {
        key: "masterData",
        label: t("navigation.masterData"),
        icon: Database,
        children: [
          { to: "/app/products" as any, label: t("navigation.products"), icon: Package, key: "products" },
          { to: "/app/warehouses" as any, label: t("navigation.warehouses"), icon: Warehouse, key: "products" },
          { to: "/app/locations" as any, label: t("navigation.locations"), icon: Layers, key: "products" },
          { to: "/app/suppliers" as any, label: t("navigation.suppliers"), icon: Building2, key: "suppliers" },
          { to: "/app/customer" as any, label: t("navigation.customers"), icon: Contact, key: "customers" },
          { to: "/app/packaging" as any, label: t("navigation.packaging"), icon: Box, key: "packaging" },
        ].filter(item => hasMenuAccess(item.key)),
      },
      {
        key: "orderManagement",
        label: t("navigation.orderManagement"),
        icon: ShoppingCart,
        children: [
          { to: "/app/purchase-orders" as any, label: t("navigation.purchaseOrders"), icon: FileSpreadsheet, key: "purchase-orders" },
          { to: "/app/sales-orders" as any, label: t("navigation.salesOrders"), icon: ShoppingCart, key: "sales-orders" },
        ].filter(item => hasMenuAccess(item.key)),
      },
      {
        key: "warehouseInventory",
        label: t("navigation.warehouseInventory"),
        icon: Warehouse,
        children: [
          { to: "/app/inward" as any, label: t("navigation.inward"), icon: ArrowDownLeft, key: "inward" },
          { to: "/app/put-away" as any, label: "Put Away", icon: CheckSquare, key: "inward" },
          { to: "/app/outward" as any, label: t("navigation.outward"), icon: ArrowUpRight, key: "outward" },
          { to: "/app/expired" as any, label: t("navigation.expired"), icon: Clock, key: "expired" },
          { to: "/app/opname" as any, label: t("navigation.opname"), icon: ShieldCheck, key: "opname" },
          { to: "/app/reporting" as any, label: t("navigation.reporting"), icon: FileSpreadsheet, key: "reporting" },
        ].filter(item => hasMenuAccess(item.key)),
      },
      {
        key: "systemSettings",
        label: t("navigation.systemSettings"),
        icon: Settings,
        children: [
          ...(isAdmin ? [
            { to: "/app/users" as any, label: t("navigation.users"), icon: Users, key: "users" },
            { to: "/app/roles" as any, label: t("navigation.roles"), icon: Key, key: "roles" },
          ] : []),
          { to: "/app/activity-log" as any, label: t("navigation.activityLog"), icon: History, key: "activity-log" },
        ].filter(item => {
          if (item.key === "users" || item.key === "roles") return true;
          return hasMenuAccess(item.key);
        }),
      },
    ];
  }, [t, isAdmin, hasMenuAccess]);

  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>(() => {
    const pathname = window.location.pathname;
    const initial: Record<string, boolean> = {};
    menuGroups.forEach(g => {
      initial[g.key] = g.children.some(c => pathname.includes(c.to));
    });
    return initial;
  });

  const handleGroupClick = (groupKey: string) => {
    if (isSidebarCollapsed) {
      toggleSidebar();
      setExpandedGroups(prev => ({ ...prev, [groupKey]: true }));
    } else {
      setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className={`bg-zinc-900 text-zinc-400 transition-all duration-300 min-h-screen flex flex-col border-r border-zinc-800 shrink-0 ${
        isSidebarCollapsed ? "w-16" : "w-64"
      }`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
          {!isSidebarCollapsed && (
            <span className="font-extrabold text-sm tracking-wider text-indigo-400">
              WAREHOUSE IMS
            </span>
          )}
          <button onClick={toggleSidebar} className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {/* Overview Link */}
          <RouteLink
            to="/app"
            activeOptions={{ exact: true }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-450 hover:text-white hover:bg-zinc-800/50 transition-all text-xs font-bold [&.active]:bg-indigo-600 [&.active]:text-white shadow-none border-none"
          >
            <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />
            {!isSidebarCollapsed && <span>{t("navigation.overview")}</span>}
          </RouteLink>

          {/* Menu Groups */}
          {menuGroups.filter(g => g.children.length > 0).map((group) => (
            <div key={group.key} className="space-y-1">
              <button
                onClick={() => handleGroupClick(group.key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-zinc-450 hover:text-white hover:bg-zinc-800/50 transition-all text-xs font-bold ${
                  group.children.some(child => window.location.pathname.includes(child.to))
                    ? "bg-zinc-800/40 text-white"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <group.icon className="h-4.5 w-4.5 shrink-0" />
                  {!isSidebarCollapsed && <span>{group.label}</span>}
                </div>
                {!isSidebarCollapsed && (
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expandedGroups[group.key] ? "rotate-180" : ""}`} />
                )}
              </button>

              {expandedGroups[group.key] && !isSidebarCollapsed && (
                <div className="pl-4 space-y-1 mt-1 border-l border-zinc-800 ml-5">
                  {group.children.map((item) => (
                    <RouteLink
                      key={item.to}
                      to={item.to}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/30 transition-all text-[11px] font-semibold [&.active]:bg-indigo-600 [&.active]:text-white shadow-none border-none"
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                      <span>{item.label}</span>
                    </RouteLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-450 hover:text-rose-400 hover:bg-rose-950/20 transition-all text-xs font-bold"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {!isSidebarCollapsed && <span>{t("logout")}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isSidebarCollapsed && (
              <span className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest hidden md:inline">
                {t("navigation.portal")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Alerts Notification Bell (Low Stock & Expiry) */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
              >
                <Bell className="h-4.5 w-4.5" />
                {notificationsList.length > 0 && (
                  <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-rose-500 text-white rounded-full text-[8px] font-black flex items-center justify-center border border-white dark:border-zinc-900 animate-pulse">
                    {notificationsList.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-[90] overflow-hidden max-h-96 flex flex-col">
                  <div className="p-3 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-955 text-xs">
                    <span className="font-bold text-zinc-850 dark:text-white">{t("navigation.alertsTitle")}</span>
                    <span className="bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-350 px-2 py-0.5 rounded-full text-[9px] font-extrabold">{notificationsList.length}</span>
                  </div>
                  <div className="overflow-y-auto flex-1 divide-y divide-zinc-150 dark:divide-zinc-850">
                    {notificationsList.length === 0 ? (
                      <div className="p-6 text-center text-xs text-zinc-400 font-medium">{t("navigation.emptyAlertsCombined")}</div>
                    ) : (
                      notificationsList.map((notif: any) => (
                        <div 
                          key={notif.id} 
                          onClick={() => {
                            setShowNotifications(false);
                            navigate({ to: notif.link });
                          }}
                          className="p-3 text-[11px] hover:bg-zinc-50 dark:hover:bg-zinc-950 flex flex-col gap-1 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between font-bold">
                            <span className="text-zinc-800 dark:text-zinc-200 truncate pr-2 max-w-[180px]">{notif.title}</span>
                            <span className="text-indigo-500 font-extrabold text-[9px] uppercase tracking-wider shrink-0">{notif.subtitle}</span>
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-zinc-500 dark:text-zinc-400 leading-snug">{notif.message}</span>
                            <span className={`font-black text-[8px] px-1.5 py-0.5 rounded uppercase shrink-0 ${
                              notif.severity === "critical" 
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-455" 
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-455"
                            }`}>
                              {notif.type === "expiry" ? t("navigation.badgeExpiry") : notif.type === "out_of_stock" ? t("navigation.badgeOutOfStock") : t("navigation.badgeLowStock")}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2.5 border-t border-zinc-150 dark:border-zinc-800 text-center bg-zinc-50 dark:bg-zinc-955">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        setIsAllAlertsModalOpen(true);
                      }}
                      className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition w-full text-center py-1 flex items-center justify-center gap-1"
                    >
                      {t("navigation.viewAllAlerts")} &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            <LangToggler />
            <ThemeToggler />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-200">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  {user && (
                    <div className="hidden sm:block text-left text-[11px] leading-tight pr-1">
                      <p className="font-extrabold text-zinc-700 dark:text-zinc-200">{user.name}</p>
                      <p className="text-zinc-400 font-semibold uppercase text-[9px] tracking-wider mt-0.5">{user.role}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-zinc-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs leading-none text-zinc-400">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-150 dark:bg-zinc-800" />
                <DropdownMenuItem onClick={handleLogout} className="text-rose-600 focus:text-rose-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dynamic page contents */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </div>

      {/* Modal Popup: All Alerts Center */}
      {isAllAlertsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-955">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                    Daftar Lengkap Peringatan & Notifikasi Gudang
                    <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-black">
                      {notificationsList.length}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Monitoring stok habis, menipis, dan batch mendekati/sudah kadaluwarsa secara terurut.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAllAlertsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Controls: Search & Tabs */}
            <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-full sm:w-auto text-xs font-bold">
                  <button
                    onClick={() => setAlertFilterTab("all")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      alertFilterTab === "all"
                        ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    Semua ({notificationsList.length})
                  </button>
                  <button
                    onClick={() => setAlertFilterTab("critical")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      alertFilterTab === "critical"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    Mendesak ({notificationsList.filter((n) => n.severity === "critical").length})
                  </button>
                  <button
                    onClick={() => setAlertFilterTab("warning")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      alertFilterTab === "warning"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    Peringatan ({notificationsList.filter((n) => n.severity === "warning").length})
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Cari nama barang, SKU, atau batch..."
                  value={alertSearchQuery}
                  onChange={(e) => setAlertSearchQuery(e.target.value)}
                  className="w-full sm:w-64 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Modal Body: Notifications List */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-150 dark:divide-zinc-800 p-2">
              {(() => {
                const filtered = notificationsList.filter((n) => {
                  const matchTab =
                    alertFilterTab === "all" || n.severity === alertFilterTab;
                  const query = alertSearchQuery.toLowerCase();
                  const matchQuery =
                    n.title.toLowerCase().includes(query) ||
                    n.subtitle.toLowerCase().includes(query) ||
                    n.message.toLowerCase().includes(query);
                  return matchTab && matchQuery;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center text-xs text-zinc-400 font-medium">
                      Tidak ada notifikasi yang sesuai kriteria pencarian.
                    </div>
                  );
                }

                return filtered.map((notif: any) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      setIsAllAlertsModalOpen(false);
                      navigate({ to: notif.link });
                    }}
                    className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-2xl cursor-pointer transition flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                          notif.severity === "critical"
                            ? "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                            : "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                        }`}
                      >
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                            {notif.title}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {notif.subtitle}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                          {notif.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          notif.severity === "critical"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                        }`}
                      >
                        {notif.type === "expiry"
                          ? t("navigation.badgeExpiry")
                          : notif.type === "out_of_stock"
                          ? t("navigation.badgeOutOfStock")
                          : t("navigation.badgeLowStock")}
                      </span>
                      <button className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white rounded-xl text-xs font-bold transition">
                        Buka &rarr;
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 flex justify-between items-center text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                Sistem Notifikasi Real-Time Gudang IMS
              </span>
              <button
                onClick={() => setIsAllAlertsModalOpen(false)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl font-bold transition"
              >
                Tutup Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

