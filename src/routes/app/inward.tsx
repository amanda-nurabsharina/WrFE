import { createFileRoute } from "@tanstack/react-router";
import { GoodsIn } from "../../pages/App/GoodsIn";

export const Route = createFileRoute("/app/inward")({
  component: GoodsIn,
});
