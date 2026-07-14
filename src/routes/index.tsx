import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context.auth?.user) {
      redirect({
        to: "/app",
        throw: true,
      });
    } else {
      redirect({
        to: "/auth/login",
        throw: true,
      });
    }
  },
  component: () => null,
});
