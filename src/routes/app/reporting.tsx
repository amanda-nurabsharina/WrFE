import { createFileRoute } from "@tanstack/react-router";
import { Reporting } from "../../pages/App/Reporting";

export const Route = createFileRoute("/app/reporting")({
  component: Reporting,
});
