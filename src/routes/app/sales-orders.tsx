import { createFileRoute } from "@tanstack/react-router";
import { SalesOrders } from "../../pages/App/SalesOrders";

export const Route = createFileRoute("/app/sales-orders")({
  component: SalesOrders,
});
