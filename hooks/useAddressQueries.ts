"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserAddress, InsertUserAddress } from "@/shared";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const addressKeys = {
  all: ["addresses"] as const,
  list: () => [...addressKeys.all, "list"] as const,
};

// ─── Fetcher ──────────────────────────────────────────────────────────────────
async function fetchAddresses(): Promise<UserAddress[]> {
  const response = await fetch("/api/address");
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to fetch addresses");
  }
  return result.data;
}

// ─── Query Hook ───────────────────────────────────────────────────────────────

/**
 * Fetches user addresses with caching.
 * - Cached for 5 minutes (addresses rarely change)
 * - Shared across Addresses page and Checkout page
 */
export function useAddresses() {
  return useQuery({
    queryKey: addressKeys.list(),
    queryFn: fetchAddresses,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // keep in cache for 15 minutes
  });
}

// ─── Mutation Hooks ───────────────────────────────────────────────────────────

/** Create a new address. Server returns the full updated list. */
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressData: Omit<InsertUserAddress, "userId">) => {
      const response = await fetch("/api/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create address");
      }
      return result.data as UserAddress[];
    },
    onSuccess: (data) => {
      queryClient.setQueryData(addressKeys.list(), data);
    },
  });
}

/** Update an existing address. Server returns the full updated list. */
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<InsertUserAddress>) => {
      const response = await fetch("/api/address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update address");
      }
      return result.data as UserAddress[];
    },
    onSuccess: (data) => {
      queryClient.setQueryData(addressKeys.list(), data);
    },
  });
}

/** Delete an address. Server returns the full updated list. */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/address?id=${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete address");
      }
      return result.data as UserAddress[];
    },
    onSuccess: (data) => {
      queryClient.setQueryData(addressKeys.list(), data);
    },
  });
}

/** Set an address as default. Server returns the full updated list. */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId: string) => {
      const response = await fetch("/api/address/default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to set default address");
      }
      return result.data as UserAddress[];
    },
    onSuccess: (data) => {
      queryClient.setQueryData(addressKeys.list(), data);
    },
  });
}
