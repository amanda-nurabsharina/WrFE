import { ApiService } from "./apiService";
import { handleAsync } from "../utils";
import { withAuthHooks } from "./auth/auth.ky.hooks";

const apiService = new ApiService();
apiService.extend({
  hooks: {
    ...withAuthHooks,
  },
});

export type TSupplier = {
  id: string;
  name: string;
  phone: string;
  email: string;
  pic?: string;
  address?: string;
  npwp?: string;
  payment_term?: number;
  created_at?: string;
};

export type TCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  pic?: string;
  address?: string;
  npwp?: string;
  payment_term?: number;
  price_tier?: string; // 'distributor' | 'retail'
  created_at?: string;
};

export type TPurchaseOrderItem = {
  id: string;
  po_id: string;
  product_id: string;
  product?: TProduct;
  qty: number;
  received_qty: number;
  price: number;
};

export type TPurchaseOrder = {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier?: TSupplier;
  order_date: string;
  status: string; // draft, approved, partially_received, completed
  items?: TPurchaseOrderItem[];
  created_at?: string;
};

export type TSalesOrderItem = {
  id: string;
  so_id: string;
  product_id: string;
  product?: TProduct;
  qty: number;
  shipped_qty: number;
  price: number;
};

export type TSalesOrder = {
  id: string;
  so_number: string;
  customer_id: string;
  customer?: TCustomer;
  order_date: string;
  status: string; // draft, pending_b3_approval, approved, partially_shipped, shipped
  items?: TSalesOrderItem[];
  created_at?: string;
};

export type TPackagingUnit = {
  id: string;
  code: string;
  name: string;
  description: string;
  created_at?: string;
};

export type TProduct = {
  id: string;
  code: string;
  barcode: string;
  name: string;
  category_id: string;
  sub_category?: string;
  reg_category?: string;
  kementan_reg_no?: string;
  msds_reference?: string;
  unit: string;
  minimum_stock: number;
  packaging_unit_id?: string;
  packaging_unit?: TPackagingUnit;
  conversion_ratio?: number;
  purchase_price?: number;
  price_distributor?: number;
  price_retail?: number;
  stock?: number;
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
  selling_price?: number;
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
    return handleAsync<any, { data: TSupplier[] }>(() =>
      apiService.get(`suppliers?search=${encodeURIComponent(search)}`)
    );
  }

  async createSupplier(payload: any) {
    return handleAsync<any, { data: TSupplier }>(() =>
      apiService.post("suppliers", payload)
    );
  }

  async updateSupplier(id: string, payload: any) {
    return handleAsync<any, { data: TSupplier }>(() =>
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

  // Packaging Units CRUD
  async getPackagingUnits(search = "") {
    return handleAsync<any, { data: TPackagingUnit[] }>(() =>
      apiService.get(`packaging-units?search=${encodeURIComponent(search)}`)
    );
  }

  async createPackagingUnit(payload: any) {
    return handleAsync<any, { data: TPackagingUnit }>(() =>
      apiService.post("packaging-units", payload)
    );
  }

  async updatePackagingUnit(id: string, payload: any) {
    return handleAsync<any, { data: TPackagingUnit }>(() =>
      apiService.put(`packaging-units/${id}`, payload)
    );
  }

  async deletePackagingUnit(id: string) {
    return handleAsync<any, any>(() =>
      apiService.delete(`packaging-units/${id}`)
    );
  }

  // Customers CRUD
  async getCustomers(search = "") {
    return handleAsync<any, { data: TCustomer[] }>(() =>
      apiService.get(`customers?search=${encodeURIComponent(search)}`)
    );
  }

  async createCustomer(payload: any) {
    return handleAsync<any, { data: TCustomer }>(() =>
      apiService.post("customers", payload)
    );
  }

  async updateCustomer(id: string, payload: any) {
    return handleAsync<any, { data: TCustomer }>(() =>
      apiService.put(`customers/${id}`, payload)
    );
  }

  async deleteCustomer(id: string) {
    return handleAsync<any, any>(() =>
      apiService.delete(`customers/${id}`)
    );
  }

  // Purchase Orders CRUD
  async getPurchaseOrders(search = "") {
    return handleAsync<any, { data: TPurchaseOrder[] }>(() =>
      apiService.get(`orders/po?search=${encodeURIComponent(search)}`)
    );
  }

  async createPurchaseOrder(payload: any) {
    return handleAsync<any, { data: TPurchaseOrder }>(() =>
      apiService.post("orders/po", payload)
    );
  }

  async approvePurchaseOrder(id: string) {
    return handleAsync<any, { data: TPurchaseOrder }>(() =>
      apiService.put(`orders/po/${id}/approve`, {})
    );
  }

  // Sales Orders CRUD
  async getSalesOrders(search = "") {
    return handleAsync<any, { data: TSalesOrder[] }>(() =>
      apiService.get(`orders/so?search=${encodeURIComponent(search)}`)
    );
  }

  async createSalesOrder(payload: any) {
    return handleAsync<any, { data: TSalesOrder }>(() =>
      apiService.post("orders/so", payload)
    );
  }

  async approveSalesOrder(id: string) {
    return handleAsync<any, { data: TSalesOrder }>(() =>
      apiService.put(`orders/so/${id}/approve`, {})
    );
  }

  // B3 Inward Batch Approval
  async approveB3Inward(id: string) {
    return handleAsync<any, { data: TInventoryBatch }>(() =>
      apiService.put(`inventory/batches/${id}/approve`, {})
    );
  }

  // Activity Logs (Audit Trail)
  async getActivityLogs(params: { search?: string; module?: string; action?: string; page?: number; limit?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.module) qs.set("module", params.module);
    if (params.action) qs.set("action", params.action);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return handleAsync<any, { data: any }>(() =>
      apiService.get(`activity-logs?${qs.toString()}`)
    );
  }
}

export const imsService = new IMSService();
