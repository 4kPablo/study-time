import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/auth/require-auth";

export const Route = createFileRoute("/_authenticated")({
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return <RequireAuth />;
}
