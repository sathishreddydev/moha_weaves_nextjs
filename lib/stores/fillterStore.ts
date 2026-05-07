import { CategoryWithSubcategories, Color, Fabric } from "@/shared";
import { produce } from "immer";
import { create } from "zustand";

type FilterState = {
  categories: CategoryWithSubcategories[];
  colors: Color[];
  fabrics: Fabric[];
  loading: boolean;
  error: string | null;

  fetchFilters: () => Promise<void>;
  cancelFetch: () => void;
};

// Store abort controller reference outside the store
let abortController: AbortController | null = null;

export const useFilterStore = create<FilterState>((set) => ({
  categories: [],
  colors: [],
  fabrics: [],
  loading: false,
  error: null,

  fetchFilters: async () => {
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
        })
      );
    } catch (error) {
      // Don't treat abort as an error
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      console.error('Filter fetch error:', error);
      set(
        produce((state: FilterState) => {
          state.error = error instanceof Error ? error.message : "Failed to load filters";
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
