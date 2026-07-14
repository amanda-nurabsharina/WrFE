import { ApiService } from "./apiService";
import { handleAsync } from "../utils";
import { withAuthHooks } from "./auth/auth.ky.hooks";

const apiService = new ApiService();
apiService.extend({
  hooks: {
    ...withAuthHooks,
  },
});

export type TProduct = {
  id: string;
  code: string;
  barcode: string;
  name: string;
  category_id: string;
  unit: string;
  minimum_stock: number;
};

export type TInventoryBatch = {
  id: string;
  product_id: string;
  product: TProduct;
  batch_number: string;
  expired_date: string;
  qty: number;
  warehouse_id: string;
  warehouse: { name: string; code: string };
  location_id: string;
  location: { rack: string };
  purchase_price: number;
  status: string;
  created_at: string;
};

export type TStockTransaction = {
  id: string;
  batch_id: string;
  batch: TInventoryBatch;
  transaction_type: string;
  qty: number;
  reference_no: string;
  user?: { name: string; email: string };
  created_at: string;
};

class IMSService {
  // Products CRUD
  async getProducts(search = "") {
    return handleAsync<any, { data: TProduct[] }>(() =>
      apiService.get(`products?search=${encodeURIComponent(search)}`)
    );
  }

  async createProduct(payload: any) {
    return handleAsync<any, { data: TProduct }>(() =>
      apiService.post("products", payload)
    );
  }

  async updateProduct(id: string, payload: any) {
    return handleAsync<any, { data: TProduct }>(() =>
      apiService.put(`products/${id}`, payload)
    );
  }

  async deleteProduct(id: string) {
    return handleAsync<any, any>(() =>
      apiService.delete(`products/${id}`)
    );
  }

  // Batches
  async getBatches(filters: { search?: string; product_id?: string; status?: string; expiry_days?: string } = {}) {
    const query = new URLSearchParams();
    if (filters.search) query.append("search", filters.search);
    if (filters.product_id) query.append("product_id", filters.product_id);
    if (filters.status) query.append("status", filters.status);
    if (filters.expiry_days) query.append("expiry_days", filters.expiry_days);

    return handleAsync<any, { data: TInventoryBatch[] }>(() =>
      apiService.get(`inventory/batches?${query.toString()}`)
    );
  }

  // Transactions
  async getTransactions(type = "", search = "") {
    return handleAsync<any, { data: TStockTransaction[] }>(() =>
      apiService.get(`inventory/${type}?search=${encodeURIComponent(search)}`)
    );
  }

  async createInward(payload: any) {
    return handleAsync<any, { data: TStockTransaction }>(() =>
      apiService.post("inventory/in", payload)
    );
  }

  async createOutward(payload: any) {
    return handleAsync<any, { data: TStockTransaction[] }>(() =>
      apiService.post("inventory/out", payload)
    );
  }

  async createStockOpname(payload: any) {
    return handleAsync<any, { data: TStockTransaction }>(() =>
      apiService.post("stock-opname", payload)
    );
  }

  // Dashboard Summary
  async getDashboard() {
    return handleAsync<any, { data: any }>(() =>
      apiService.get("dashboard")
    );
  }

  // Metadata Dropdowns
  async getWarehouses() {
    return handleAsync<any, { data: any[] }>(() =>
      apiService.get("warehouses")
    );
  }

  async getLocations() {
    return handleAsync<any, { data: any[] }>(() =>
      apiService.get("locations")
    );
  }

  async getSuppliers(search = "") {
    return handleAsync<any, { data: any[] }>(() =>
      apiService.get(`suppliers?search=${encodeURIComponent(search)}`)
    );
  }

  async createSupplier(payload: any) {
    return handleAsync<any, { data: any }>(() =>
      apiService.post("suppliers", payload)
    );
  }

  async updateSupplier(id: string, payload: any) {
    return handleAsync<any, { data: any }>(() =>
      apiService.put(`suppliers/${id}`, payload)
    );
  }

  async deleteSupplier(id: string) {
    return handleAsync<any, any>(() =>
      apiService.delete(`suppliers/${id}`)
    );
  }

  async getExpiryAlerts() {
    return handleAsync<any, { data: TInventoryBatch[] }>(() =>
      apiService.get("inventory/expiry-alerts")
    );
  }

  // Users CRUD
  async getUsers(page = 1, limit = 10, search = "") {
    return handleAsync<any, any>(() =>
      apiService.get(`users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`)
    );
  }

  async createUser(payload: any) {
    return handleAsync<any, any>(() =>
      apiService.post("users", payload)
    );
  }

  async updateUser(id: string, payload: any) {
    return handleAsync<any, any>(() =>
      apiService.patch(`users/${id}`, payload)
    );
  }

  async deleteUser(id: string) {
    return handleAsync<any, any>(() =>
      apiService.delete(`users/${id}`)
    );
  }

  // Roles CRUD
  async getRoles() {
    return handleAsync<any, { data: any[] }>(() =>
      apiService.get("admin/roles")
    );
  }

  async createRole(payload: any) {
    return handleAsync<any, any>(() =>
      apiService.post("admin/roles", payload)
    );
  }

  async updateRole(id: string, payload: any) {
    return handleAsync<any, any>(() =>
      apiService.put(`admin/roles/${id}`, payload)
    );
  }

  async deleteRole(id: string) {
    return handleAsync<any, any>(() =>
      apiService.delete(`admin/roles/${id}`)
    );
  }
}

export const imsService = new IMSService();
