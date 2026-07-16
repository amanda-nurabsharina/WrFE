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
  History
} from "lucide-react";
import { useAppLayout } from "./useAppLayout";
import { useStore } from "../../store/store";
import { useUIStore } from "../../store/uiStore";

export const AppLayout = () => {
  const { handleLogout } = useAppLayout();
  const user = useStore((state) => state.user);
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  const { data: alertsResp } = useQuery({
    queryKey: ["expiryAlerts"],
    queryFn: () => imsService.getExpiryAlerts(),
    refetchInterval: 15000,
  });

  const alerts = alertsResp?.data?.data || [];

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

  const menuItems = [
    { to: "/app" as any, label: t("navigation.overview"), icon: LayoutDashboard, key: "dashboard" },
    { to: "/app/products" as any, label: t("navigation.products"), icon: Package, key: "products" },
    { to: "/app/suppliers" as any, label: t("navigation.suppliers"), icon: Building2, key: "suppliers" },
    { to: "/app/customer" as any, label: t("navigation.customers"), icon: Contact, key: "customers" },
    { to: "/app/purchase-orders" as any, label: t("navigation.purchaseOrders"), icon: FileSpreadsheet, key: "purchase-orders" },
    { to: "/app/sales-orders" as any, label: t("navigation.salesOrders"), icon: ShoppingCart, key: "sales-orders" },
    { to: "/app/packaging" as any, label: t("navigation.packaging"), icon: Box, key: "packaging" },
    ...(isAdmin ? [
      { to: "/app/users" as any, label: t("navigation.users"), icon: Users, key: "users" },
      { to: "/app/roles" as any, label: t("navigation.roles"), icon: Key, key: "roles" }
    ] : []),
    { to: "/app/inward" as any, label: t("navigation.inward"), icon: ArrowDownLeft, key: "inward" },
    { to: "/app/outward" as any, label: t("navigation.outward"), icon: ArrowUpRight, key: "outward" },
    { to: "/app/expired" as any, label: t("navigation.expired"), icon: Clock, key: "expired" },
    { to: "/app/opname" as any, label: t("navigation.opname"), icon: ShieldCheck, key: "opname" },
    { to: "/app/activity-log" as any, label: t("navigation.activityLog"), icon: History, key: "activity-log" },
  ].filter(item => {
    if (item.key === "users" || item.key === "roles") return true;
    return hasMenuAccess(item.key);
  });

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
        <nav className="flex-1 py-4 px-2 space-y-1">
          {menuItems.map((item) => (
            <RouteLink
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-450 hover:text-white hover:bg-zinc-800/50 transition-all text-xs font-bold [&.active]:bg-indigo-600 [&.active]:text-white shadow-none border-none"
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </RouteLink>
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
            {/* Expiry Alerts Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
              >
                <Bell className="h-4.5 w-4.5" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-rose-500 text-white rounded-full text-[8px] font-black flex items-center justify-center border border-white dark:border-zinc-900">
                    {alerts.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-[90] overflow-hidden max-h-96 flex flex-col">
                  <div className="p-3 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-955 text-xs">
                    <span className="font-bold text-zinc-850 dark:text-white">Expiry Alerts</span>
                    <span className="bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-350 px-2 py-0.5 rounded-full text-[9px] font-extrabold">{alerts.length} Batch</span>
                  </div>
                  <div className="overflow-y-auto flex-1 divide-y divide-zinc-150 dark:divide-zinc-850">
                    {alerts.length === 0 ? (
                      <div className="p-6 text-center text-xs text-zinc-400 font-medium">Semua batch dalam keadaan aman.</div>
                    ) : (
                      alerts.map((alert: any) => {
                        const expDate = new Date(alert.expired_date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        expDate.setHours(0, 0, 0, 0);
                        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        const isExpired = diffDays <= 0;

                        return (
                          <div key={alert.id} className="p-3 text-[11px] hover:bg-zinc-50 dark:hover:bg-zinc-950 flex flex-col gap-1">
                            <div className="flex justify-between font-bold">
                              <span className="text-zinc-800 dark:text-zinc-200">{alert.product?.name}</span>
                              <span className="text-indigo-500 font-extrabold">{alert.batch_number}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Stok: {alert.qty} {alert.product?.unit}</span>
                              <span className={`font-semibold ${isExpired ? "text-rose-500" : "text-amber-500"}`}>
                                {isExpired ? "Expired!" : `${diffDays} hari lagi`}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="p-2 border-t border-zinc-150 dark:border-zinc-800 text-center bg-zinc-50 dark:bg-zinc-955">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate({ to: "/app/expired" });
                      }}
                      className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline w-full text-center"
                    >
                      Lihat Semua Batch &rarr;
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
    </main>
  );
};
