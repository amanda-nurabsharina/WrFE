import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { imsService } from "../../api/ims.service";
import { Plus, Trash2, Search, Users2, Shield, Pencil } from "lucide-react";
import { useToast } from "../../components/ui";
import { showClearErrorToast } from "../../utils";

export const Users = () => {
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState("employee");
  const [editingUser, setEditingUser] = React.useState<any | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["users", search],
    queryFn: () => imsService.getUsers(1, 50, search),
  });

  const users = response?.data?.results || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => imsService.createUser(payload),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(toast, res.error, "Failed to create user");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User created successfully", variant: "default" });
      setIsOpen(false);
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setRole("employee");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => imsService.updateUser(id, payload),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(toast, res.error, "Failed to update user");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User updated successfully", variant: "default" });
      setIsOpen(false);
      setEditingUser(null);
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setRole("employee");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => imsService.deleteUser(id),
    onSuccess: (res: any) => {
      if (res?.error) {
        showClearErrorToast(toast, res.error, "Failed to delete user");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User deleted successfully" });
    }
  });

  const handleEditClick = (item: any) => {
    setEditingUser(item);
    setName(item.name);
    setEmail(item.email);
    setPassword("");
    setRole(item.role || "employee");
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const payload: any = {
        name,
        email,
      };
      if (password) {
        payload.password = password;
      }
      updateMutation.mutate({ id: editingUser.id, payload });
    } else {
      createMutation.mutate({
        name,
        email,
        password,
        role,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            User Management
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage administrative personnel, auditors, and warehouse operator roles.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setName("");
            setEmail("");
            setPassword("");
            setRole("employee");
            setIsOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-sm self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          Tambah User
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex gap-4 items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full text-sm bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <Users2 className="h-10 w-10 text-zinc-300" />
            <p className="text-sm font-semibold text-zinc-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-955 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">Nama</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-855 font-medium text-zinc-700 dark:text-zinc-300">
                {users.map((item: any) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                    <td className="py-4 px-6 font-bold text-zinc-900 dark:text-white">{item.name}</td>
                    <td className="py-4 px-6 text-zinc-500">{item.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full border text-[9px] uppercase font-extrabold inline-flex items-center gap-1 ${
                        item.role.includes("admin")
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-300"
                          : "bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
                      }`}>
                        <Shield className="h-3 w-3 shrink-0" />
                        {item.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="text-indigo-500 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-955/20 rounded-lg transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete user ${item.name}?`)) {
                            deleteMutation.mutate(item.id);
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

      {/* Add User Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-md font-bold text-zinc-900 dark:text-white">
                {editingUser ? "Edit User" : "Tambah User Baru"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@warehouse.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Password</label>
                <input
                  type="password"
                  required={!editingUser}
                  minLength={8}
                  placeholder={editingUser ? "Leave blank to keep unchanged" : "Minimum 8 characters"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={!!editingUser}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-855 rounded-lg bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                </select>
                {editingUser && (
                  <span className="text-[10px] text-zinc-400 italic">User role cannot be changed during edit</span>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-855 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
                >
                  {editingUser ? "Simpan Perubahan" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
