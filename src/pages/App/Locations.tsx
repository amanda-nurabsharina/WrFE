import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { imsService, TLocation } from "../../api/ims.service";
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Printer,
  Building2,
  Box,
  Weight
} from "lucide-react";
import { useToast } from "../../components/ui";
import BarcodePrintDialog from "../../components/barcode/BarcodePrintDialog";

export const Locations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedLocation, setSelectedLocation] = React.useState<TLocation | null>(null);

  // Print Dialog State
  const [printDialog, setPrintDialog] = React.useState<{
    isOpen: boolean;
    barcode: string;
    rackName: string;
    aisleCode: string;
  }>({
    isOpen: false,
    barcode: "",
    rackName: "",
    aisleCode: "",
  });

  // Form State
  const [formData, setFormData] = React.useState({
    warehouse_id: "",
    aisle: "A01",
    rack: "R01",
    shelf: "S01",
    bin: "B01",
    max_weight: 500,
    max_volume: 2,
  });

  // Fetch Locations
  const { data: locationsResp, isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: () => imsService.getLocations(),
  });
  const locations = locationsResp?.data?.data || [];

  // Fetch Warehouses
  const { data: warehousesResp } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => imsService.getWarehouses(),
  });
  const warehouses = warehousesResp?.data?.data || [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => imsService.createLocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast({
        title: "Berhasil",
        description: "Lokasi rak baru berhasil ditambahkan",
        variant: "default",
      });
      closeModal();
    },
    onError: (err: any) => {
      toast({
        title: "Gagal",
        description: err?.message || "Gagal membuat lokasi rak",
        variant: "destructive",
      });
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      imsService.updateLocation(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast({
        title: "Berhasil",
        description: "Data rak berhasil diperbarui",
        variant: "default",
      });
      closeModal();
    },
    onError: (err: any) => {
      toast({
        title: "Gagal",
        description: err?.message || "Gagal memperbarui data rak",
        variant: "destructive",
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => imsService.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast({
        title: "Berhasil",
        description: "Lokasi rak berhasil dihapus",
        variant: "default",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Gagal",
        description: err?.message || "Gagal menghapus lokasi rak",
        variant: "destructive",
      });
    },
  });

  const openAddModal = () => {
    setSelectedLocation(null);
    setFormData({
      warehouse_id: warehouses[0]?.id || "",
      aisle: "A01",
      rack: "R01",
      shelf: "S01",
      bin: "B01",
      max_weight: 500,
      max_volume: 2,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (loc: TLocation) => {
    setSelectedLocation(loc);
    setFormData({
      warehouse_id: loc.warehouse_id || warehouses[0]?.id || "",
      aisle: loc.aisle || "",
      rack: loc.rack || "",
      shelf: loc.shelf || "",
      bin: loc.bin || "",
      max_weight: loc.max_weight || 500,
      max_volume: loc.max_volume || 2,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLocation(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLocation) {
      updateMutation.mutate({ id: selectedLocation.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus lokasi rak ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const query = searchQuery.toLowerCase();
    return (
      loc.rack?.toLowerCase().includes(query) ||
      loc.aisle?.toLowerCase().includes(query) ||
      loc.barcode?.toLowerCase().includes(query) ||
      loc.shelf?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            <Layers className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Master Data Rak & Lokasi Gudang
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manajemen Lorong (Aisle), Nama Rak, Shelf, Bin, Kapasitas, dan Cetak Barcode Stiker Rak.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Rak Baru
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Total Lokasi Rak</span>
            <span className="text-xl font-extrabold text-zinc-800 dark:text-white mt-0.5 block">{locations.length} Rak</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Total Gudang</span>
            <span className="text-xl font-extrabold text-zinc-800 dark:text-white mt-0.5 block">{warehouses.length} Gudang</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Kapasitas Rata-Rata</span>
            <span className="text-xl font-extrabold text-zinc-800 dark:text-white mt-0.5 block">500 Kg / Rak</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Lorong, Rak, atau Barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          Menampilkan {filteredLocations.length} dari {locations.length} lokasi rak
        </span>
      </div>

      {/* Locations Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-zinc-500">Memuat data rak lokasi...</div>
        ) : filteredLocations.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">Belum ada lokasi rak yang sesuai.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-955 text-zinc-400 dark:text-zinc-500 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5">Lorong / Aisle</th>
                  <th className="px-5 py-3.5">Nama Rak</th>
                  <th className="px-5 py-3.5">Shelf & Bin</th>
                  <th className="px-5 py-3.5">Barcode Lokasi</th>
                  <th className="px-5 py-3.5">Kapasitas Beban</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 font-medium">
                {filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition">
                    <td className="px-5 py-4 font-bold text-zinc-900 dark:text-white">
                      <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs">
                        {loc.aisle || "A01"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-extrabold text-zinc-900 dark:text-white">
                      {loc.rack}
                    </td>
                    <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">
                      Shelf: <span className="font-bold text-zinc-800 dark:text-zinc-200">{loc.shelf || "S01"}</span> | Bin: <span className="font-bold text-zinc-800 dark:text-zinc-200">{loc.bin || "B01"}</span>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {loc.barcode}
                    </td>
                    <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Weight className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{loc.max_weight || 500} Kg / {loc.max_volume || 2} m³</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() =>
                          setPrintDialog({
                            isOpen: true,
                            barcode: loc.barcode,
                            rackName: `Rak: ${loc.rack}`,
                            aisleCode: `Aisle: ${loc.aisle || "A01"} | Shelf: ${loc.shelf || "S01"}`,
                          })
                        }
                        className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                        title="Cetak Barcode Rak"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Cetak Stiker
                      </button>

                      <button
                        onClick={() => openEditModal(loc)}
                        className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition inline-block"
                        title="Edit Rak"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(loc.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition inline-block"
                        title="Hapus Rak"
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

      {/* Modal Add / Edit Location */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                {selectedLocation ? "Edit Lokasi Rak" : "Tambah Lokasi Rak Baru"}
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
                  Pilih Gudang
                </label>
                <select
                  value={formData.warehouse_id}
                  onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Lorong (Aisle)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="mis. A01"
                    value={formData.aisle}
                    onChange={(e) => setFormData({ ...formData, aisle: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Nama Rak
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="mis. Rack-A1"
                    value={formData.rack}
                    onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Shelf (Tingkat)
                  </label>
                  <input
                    type="text"
                    placeholder="mis. S01"
                    value={formData.shelf}
                    onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Bin (Kompartemen)
                  </label>
                  <input
                    type="text"
                    placeholder="mis. B01"
                    value={formData.bin}
                    onChange={(e) => setFormData({ ...formData, bin: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Max Weight (Kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_weight}
                    onChange={(e) => setFormData({ ...formData, max_weight: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Max Volume (m³)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.max_volume}
                    onChange={(e) => setFormData({ ...formData, max_volume: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
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
                  {createMutation.isPending || updateMutation.isPending ? "Simpan..." : "Simpan Data Rak"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Sticker Print Modal */}
      {printDialog.isOpen && (
        <BarcodePrintDialog
          isOpen={printDialog.isOpen}
          onClose={() => setPrintDialog({ ...printDialog, isOpen: false })}
          barcodeValue={printDialog.barcode}
          labelType="PRODUCT"
          productName={printDialog.rackName}
          productCode={printDialog.aisleCode}
        />
      )}
    </div>
  );
};

export default Locations;
