import { createFileRoute } from "@tanstack/react-router";
import { Warehouses } from "../../pages/App/Warehouses";

export const Route = createFileRoute("/app/warehouses")({
  component: Warehouses,
});
