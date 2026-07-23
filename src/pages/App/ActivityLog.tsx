import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { imsService } from "../../api/ims.service";
import { History, Search, Filter } from "lucide-react";
import { ExportButton } from "../../components/ui";


type TActivityLog = {
  id: string;
  user_id: string;
  user?: { name: string; email: string };
  action: string;
  module: string;
  target_id: string;
  description: string;
  ip_address: string;
  created_at: string;
};

const ACTION_BADGES: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  DELETE: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  APPROVE: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  LOGIN: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  OPNAME: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400",
};

const MODULE_OPTIONS = [
  "", "products", "suppliers", "customers", "purchase-orders", "sales-orders",
  "inward", "outward", "opname", "expired", "packaging", "auth",
];

const ACTION_OPTIONS = ["", "CREATE", "UPDATE", "DELETE", "APPROVE", "LOGIN", "OPNAME"];

export const ActivityLog = () => {
  const [search, setSearch] = React.useState("");
  const [module, setModule] = React.useState("");
  const [action, setAction] = React.useState("");
  const [page, setPage] = React.useState(1);
  const limit = 30;

  const { data: response, isLoading } = useQuery({
    queryKey: ["activity-logs", search, module, action, page],
    queryFn: () => imsService.getActivityLogs({ search, module, action, page, limit }),
  });

  const logs: TActivityLog[] = response?.data?.data?.logs || [];
  const total: number = response?.data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const logExportHeaders = ["Waktu", "Pengguna", "Modul", "Aksi", "Deskripsi Activity", "IP Address"];
  const logExportRows = React.useMemo(() => {
    return logs.map((log: TActivityLog) => [
      log.created_at ? new Date(log.created_at).toLocaleString("id-ID") : "-",
      log.user?.name || log.user_id || "System",
      log.module || "-",
      log.action || "-",
      log.description || "-",
      log.ip_address || "-"
    ]);
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            <History className="h-8 w-8 text-indigo-500" />
            Log Activity (Audit Trail)
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track all user actions across the system for compliance and accountability.
          </p>
        </div>
        <div className="self-start sm:self-center">
          <ExportButton
            filename="Audit_Trail_Log_Activity"
            title="Laporan Log Aktivitas & Audit Trail System"
            subtitle={`Total Record: ${total} Aktivitas`}
            headers={logExportHeaders}
            rows={logExportRows}
            size="md"
          />
        </div>
      </div>


      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search description, target ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full text-sm bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400" />
          <select
            value={module}
            onChange={(e) => { setModule(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold bg-zinc-50 dark:bg-zinc-955 text-zinc-700 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Modules</option>
            {MODULE_OPTIONS.filter(Boolean).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold bg-zinc-50 dark:bg-zinc-955 text-zinc-700 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Actions</option>
            {ACTION_OPTIONS.filter(Boolean).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <span className="text-[10px] font-semibold text-zinc-400 ml-auto">
          {total} records
        </span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <History className="h-10 w-10 text-zinc-300" />
            <p className="text-sm font-semibold text-zinc-500">No activity logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-955 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-5">Timestamp</th>
                  <th className="py-3 px-5">User</th>
                  <th className="py-3 px-5">Action</th>
                  <th className="py-3 px-5">Module</th>
                  <th className="py-3 px-5">Target ID</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-5">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-medium text-zinc-700 dark:text-zinc-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                    <td className="py-3 px-5 text-zinc-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString("id-ID", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-5 font-bold text-zinc-900 dark:text-white whitespace-nowrap">
                      {log.user?.name || "System"}
                    </td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ACTION_BADGES[log.action] || "bg-zinc-100 text-zinc-600"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-300 capitalize">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-mono text-[10px] text-zinc-500 max-w-[100px] truncate">
                      {log.target_id || "—"}
                    </td>
                    <td className="py-3 px-5 text-zinc-600 dark:text-zinc-400 max-w-[250px] truncate">
                      {log.description || "—"}
                    </td>
                    <td className="py-3 px-5 text-zinc-400 text-[10px] font-mono">
                      {log.ip_address || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955">
            <span className="text-[10px] font-semibold text-zinc-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded-lg text-[10px] font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg text-[10px] font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
