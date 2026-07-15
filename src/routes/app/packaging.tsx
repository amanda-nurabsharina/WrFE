import { createFileRoute } from "@tanstack/react-router";
import { Packaging } from "../../pages/App/Packaging";

export const Route = createFileRoute("/app/packaging")({
  component: Packaging,
});
