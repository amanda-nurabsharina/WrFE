import { createFileRoute } from "@tanstack/react-router";
import { PurchaseOrders } from "../../pages/App/PurchaseOrders";

export const Route = createFileRoute("/app/purchase-orders")({
  component: PurchaseOrders,
});
