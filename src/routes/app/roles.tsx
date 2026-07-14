import { createFileRoute } from "@tanstack/react-router";
import { Roles } from "../../pages/App/Roles";

export const Route = createFileRoute("/app/roles")({
  component: Roles,
});
