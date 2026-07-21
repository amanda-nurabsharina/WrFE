import { createFileRoute } from "@tanstack/react-router";
import { PutAway } from "../../pages/App/PutAway";

export const Route = createFileRoute("/app/put-away")({
  component: PutAway,
});
