"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-provider";

export function useAuthQueryInvalidation() {
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      queryClient.invalidateQueries({ queryKey: ["study-data"] });
    }
  }, [user, loading, queryClient]);
}
