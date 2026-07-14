import { createFileRoute } from "@tanstack/react-router";
import { ExpiredMonitoring } from "../../pages/App/ExpiredMonitoring";

export const Route = createFileRoute("/app/expired")({
  component: ExpiredMonitoring,
});
