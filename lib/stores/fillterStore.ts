import { CategoryWithSubcategories, Color, Fabric } from "@/shared";
import { produce } from "immer";
import { create } from "zustand";

type FilterState = {
  categories: CategoryWithSubcategories[];
  colors: Color[];
  fabrics: Fabric[];
  loading: boolean;
  error: string | null;
  /** Tracks whether data has been successfully fetched at least once */
  isHydrated: boolean;
  /** Incremented to force a re-fetch (like react-query's invalidateQueries) */
  invalidationKey: number;

  fetchFilters: () => Promise<void>;
  /** Invalidates the cache and triggers a fresh fetch */
  invalidate: () => void;
  cancelFetch: () => void;
};

// Store abort controller reference outside the store
let abortController: AbortController | null = null;

export const useFilterStore = create<FilterState>((set, get) => ({
  categories: [],
  colors: [],
  fabrics: [],
  loading: false,
  error: null,
  isHydrated: false,
  invalidationKey: 0,

  fetchFilters: async () => {
    const state = get();

    // If data is already loaded and not invalidated, skip the fetch (cache hit)
    if (state.isHydrated && !state.error) {
      return;
    }

    // Cancel any existing request
    if (abortController) {
      abortController.abort();
    }

    // Create new abort controller for this request
    abortController = new AbortController();

    try {
      set(
        produce((state: FilterState) => {
          state.loading = true;
          state.error = null;
        })
      );

      const response = await fetch("/api/filters", {
        signal: abortController.signal,
      });

      // Check for HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      set(
        produce((state: FilterState) => {
          state.categories = data.categories;
          state.colors = data.colors;
          state.fabrics = data.fabrics;
          state.isHydrated = true;
        })
      );
    } catch (error) {
      // Don't treat abort as an error
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      set(
        produce((state: FilterState) => {
          state.error =
            error instanceof Error ? error.message : "Failed to load filters";
        })
      );
    } finally {
      set(
        produce((state: FilterState) => {
          state.loading = false;
        })
      );
      abortController = null;
    }
  },

  invalidate: () => {
    set(
      produce((state: FilterState) => {
        state.isHydrated = false;
        state.invalidationKey += 1;
      })
    );
    // Immediately re-fetch after invalidation
    get().fetchFilters();
  },

  cancelFetch: () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
      set(
        produce((state: FilterState) => {
          state.loading = false;
        })
      );
    }
  },
}));
