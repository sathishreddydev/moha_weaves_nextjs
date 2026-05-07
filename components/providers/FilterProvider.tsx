"use client";

import { useEffect } from "react";
import { useFilterStore } from "@/lib/stores/fillterStore";
import { useSocket } from "@/providers/socket-provider";

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const { categories, fetchFilters } = useFilterStore();
  const { socket } = useSocket();

  useEffect(() => {
    // Fetch filters once when the app loads
    if (categories.length === 0) {
      fetchFilters();
    }
  }, [categories.length, fetchFilters]);

  useEffect(() => {
    if (!socket) return;

    const handleCategoryCreated = (data: any) => {
      console.log("🔥 New category created, refetching filters:", data);
      fetchFilters();
    };

    socket.on("category.created", handleCategoryCreated);

    return () => {
      socket.off("category.created", handleCategoryCreated);
    };
  }, [socket, fetchFilters]);

  return <>{children}</>;
}
