import { createFileRoute } from "@tanstack/react-router";
import { Locations } from "../../pages/App/Locations";

export const Route = createFileRoute("/app/locations")({
  component: Locations,
});
