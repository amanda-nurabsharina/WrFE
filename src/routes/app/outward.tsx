import { createFileRoute } from "@tanstack/react-router";
import { GoodsOut } from "../../pages/App/GoodsOut";

export const Route = createFileRoute("/app/outward")({
  component: GoodsOut,
});
