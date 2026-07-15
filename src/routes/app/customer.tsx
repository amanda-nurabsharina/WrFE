import { createFileRoute } from "@tanstack/react-router";
import { Customer } from "../../pages/App/Customer";

export const Route = createFileRoute("/app/customer")({
  component: Customer,
});
