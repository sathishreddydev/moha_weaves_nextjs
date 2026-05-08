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
  }, [categories.length]);

  useEffect(() => {
    if (!socket) return;

    const handleFilterEvent = (data: any) => {
      console.log("🔥 Filter event received, refetching filters:", data);
      fetchFilters();
    };

    socket.on("filter_event", handleFilterEvent);

    return () => {
      socket.off("filter_event", handleFilterEvent);
    };
  }, [socket, fetchFilters]);

  return <>{children}</>;
}