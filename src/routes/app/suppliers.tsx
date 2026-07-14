import { createFileRoute } from "@tanstack/react-router";
import { Suppliers } from "../../pages/App/Suppliers";

export const Route = createFileRoute("/app/suppliers")({
  component: Suppliers,
});
