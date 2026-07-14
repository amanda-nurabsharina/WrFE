import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "../../pages/App/Dashboard";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});
