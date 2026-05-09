import { CategoryWithSubcategories, Color, Fabric } from "@/shared";

export async function getFilters(): Promise<{
  categories: CategoryWithSubcategories[];
  colors: Color[];
  fabrics: Fabric[];
}> {
  try {
    const response = await fetch("/api/filters");

    if (!response.ok) {
      throw new Error(`Failed to fetch filters: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {

    // Return empty data as fallback
    return {
      categories: [],
      colors: [],
      fabrics: [],
    };
  }
}