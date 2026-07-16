import { createFileRoute } from "@tanstack/react-router";
import { ActivityLog } from "../../pages/App/ActivityLog";

export const Route = createFileRoute("/app/activity-log")({
  component: ActivityLog,
});
