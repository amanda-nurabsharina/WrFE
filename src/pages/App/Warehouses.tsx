import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { imsService, TWarehouse } from "../../api/ims.service";
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Warehouse
} from "lucide-react";
import { useToast } from "../../components/ui";

export const Warehouses = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = React.useState<TWarehouse | null>(null);

  // Form State
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");

  // Fetch Warehouses
  const { data: warehousesResp, isLoading } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => imsService.getWarehouses(),
  });
  const warehouses = warehousesResp?.data?.data || [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => imsService.createWarehouse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({
        title: "Berhasil",
        description: "Gudang baru berhasil ditambahkan",
        variant: "default",
      });
      closeModal();
    },
    onError: (err: any) => {
      toast({
        title: "Gagal",
        description: err?.message || "Gagal menambah data gudang",
        variant: "destructive",
      });
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      imsService.updateWarehouse(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({
        title: "Berhasil",
        description: "Data gudang berhasil diperbarui",
        variant: "default",
      });
      closeModal();
    },
    onError: (err: any) => {
      toast({
        title: "Gagal",
        description: err?.message || "Gagal memperbarui data gudang",
        variant: "destructive",
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => imsService.deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({
        title: "Berhasil",
        description: "Data gudang berhasil dihapus",
        variant: "default",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Gagal",
        description: err?.message || "Gagal menghapus data gudang",
        variant: "destructive",
      });
    },
  });

  const openAddModal = () => {
    setSelectedWarehouse(null);
    setCode("");
    setName("");
    setIsModalOpen(true);
  };

  const openEditModal = (wh: TWarehouse) => {
    setSelectedWarehouse(wh);
    setCode(wh.code);
    setName(wh.name);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedWarehouse(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { code, name };
    if (selectedWarehouse) {
      updateMutation.mutate({ id: selectedWarehouse.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus gudang ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredWarehouses = warehouses.filter((wh) => {
    const query = searchQuery.toLowerCase();
    return (
      wh.code.toLowerCase().includes(query) ||
      wh.name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200 select-none">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Master Data Gudang & Fasilitas
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Pengelolaan Fleksibel Kode Gudang, Lokasi Penyimpanan, dan Distribusi Stok Inventaris.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Gudang Baru
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Total Gudang Terdaftar</span>
            <span className="text-xl font-extrabold text-zinc-800 dark:text-white mt-0.5 block">{warehouses.length} Gudang</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Status Fasilitas</span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">Aktif & Operasional</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Integrasi Transaksi</span>
            <span className="text-xl font-extrabold text-sky-600 dark:text-sky-400 mt-0.5 block">Real-Time Sync</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Kode atau Nama Gudang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          Menampilkan {filteredWarehouses.length} dari {warehouses.length} gudang
        </span>
      </div>

      {/* Warehouses Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-zinc-500">Memuat data gudang...</div>
        ) : filteredWarehouses.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">Belum ada gudang yang sesuai.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-955 text-zinc-400 dark:text-zinc-500 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Kode Gudang</th>
                  <th className="px-6 py-4">Nama Gudang</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 font-medium">
                {filteredWarehouses.map((wh) => (
                  <tr key={wh.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs">
                        {wh.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-zinc-900 dark:text-white text-sm">
                      {wh.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold">
                        Aktif
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(wh)}
                        className="p-2 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition"
                        title="Edit Gudang"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(wh.id)}
                        className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                        title="Hapus Gudang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Warehouse */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                {selectedWarehouse ? "Edit Data Gudang" : "Tambah Gudang Baru"}
              </h3>
              <button
                onClick={closeModal}
                className="text-zinc-400 hover:text-zinc-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Kode Gudang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="mis. GDG-01 / WH-MAIN"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Nama Gudang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="mis. Gudang Utama Santani Agro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-150 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Simpan..." : "Simpan Data Gudang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouses;
