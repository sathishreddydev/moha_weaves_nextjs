"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const profileKeys = {
  all: ["profile"] as const,
  detail: () => [...profileKeys.all, "detail"] as const,
};

// ─── Fetcher ──────────────────────────────────────────────────────────────────
async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch("/api/profile");
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to fetch profile");
  }
  return data.user;
}

// ─── Query Hook ───────────────────────────────────────────────────────────────

/**
 * Fetches user profile with caching.
 * - Cached for 10 minutes (profile rarely changes)
 * - Only fetches when `enabled` is true (user is authenticated)
 */
export function useProfile(enabled = true) {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: fetchProfile,
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // keep in cache for 30 minutes
    retry: 1, // only retry once — fallback to session data on failure
  });
}

// ─── Mutation Hook ────────────────────────────────────────────────────────────

/** Update user profile. Server returns the updated user. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: Record<string, string>) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update profile");
      }
      return data.user as UserProfile;
    },
    onSuccess: (updatedUser) => {
      // Update the cache immediately with the new profile
      queryClient.setQueryData(profileKeys.detail(), updatedUser);
    },
  });
}
