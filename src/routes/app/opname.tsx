import { createFileRoute } from "@tanstack/react-router";
import { StockOpname } from "../../pages/App/StockOpname";

export const Route = createFileRoute("/app/opname")({
  component: StockOpname,
});
