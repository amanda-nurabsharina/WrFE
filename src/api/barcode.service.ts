import { ApiService } from "./apiService";
import { handleAsync } from "../utils";
import { withAuthHooks } from "./auth/auth.ky.hooks";

const apiService = new ApiService();
apiService.extend({
  hooks: {
    ...withAuthHooks,
  },
});

export type TBarcodeRegistry = {
  id: string;
  barcode: string;
  type: "PRODUCT" | "BATCH" | "LOCATION";
  reference_id: string;
  created_at?: string;
};

export class BarcodeService {
  async lookupBarcode(barcode: string) {
    return handleAsync<{ registry: TBarcodeRegistry; entity: any }, { data: { registry: TBarcodeRegistry; entity: any } }>(() =>
      apiService.get(`barcode/lookup?barcode=${encodeURIComponent(barcode)}`)
    );
  }

  async validateBarcode(payload: {
    barcode: string;
    expected_warehouse_id?: string;
    expected_location_id?: string;
  }) {
    return handleAsync<{ registry: TBarcodeRegistry; entity: any }, { data: { registry: TBarcodeRegistry; entity: any } }>(() =>
      apiService.post("barcode/validate", payload)
    );
  }

  async validatePickBarcode(payload: {
    barcode: string;
    expected_warehouse_id?: string;
    expected_location_id?: string;
  }) {
    return handleAsync<{ registry: TBarcodeRegistry; entity: any }, { data: { registry: TBarcodeRegistry; entity: any } }>(() =>
      apiService.post("barcode/validate-pick", payload)
    );
  }

  async recordScan(payload: {
    barcode: string;
    action: string;
    status: "SUCCESS" | "FAILED";
    message?: string;
    session_id?: string;
  }) {
    return handleAsync<any, { data: any }>(() =>
      apiService.post("barcode/scan", payload)
    );
  }

  async recordPrint(payload: {
    barcode: string;
    label_type: "PRODUCT" | "BATCH";
    qty: number;
    reason: string;
  }) {
    return handleAsync<any, { data: any }>(() =>
      apiService.post("barcode/print", payload)
    );
  }

  async startScanSession(sessionType: string) {
    return handleAsync<{ session_id: string }, { data: { session_id: string } }>(() =>
      apiService.post("barcode/session", { session_type: sessionType })
    );
  }

  async putAway(payload: { batch_barcode: string; location_barcode: string }) {
    return handleAsync<any, { data: any }>(() =>
      apiService.post("barcode/put-away", payload)
    );
  }

  async confirmPick(txId: string, payload: { batch_barcode: string; location_barcode: string }) {
    return handleAsync<any, { data: any }>(() =>
      apiService.post(`inventory/transactions/${txId}/confirm-pick`, payload)
    );
  }
}

export const barcodeService = new BarcodeService();
