import { createFileRoute } from "@tanstack/react-router";
import { Products } from "../../pages/App/Products";

export const Route = createFileRoute("/app/products")({
  component: Products,
});
