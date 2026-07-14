import { createFileRoute } from "@tanstack/react-router";
import { Users } from "../../pages/App/Users";

export const Route = createFileRoute("/app/users")({
  component: Users,
});
