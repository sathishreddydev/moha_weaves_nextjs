import { CategoryWithSubcategories, Color, Fabric } from "@/shared";

export async function getFilters(): Promise<{
  categories: CategoryWithSubcategories[];
  colors: Color[];
  fabrics: Fabric[];
}> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/filters`, {
      next: {
        revalidate: 36000, 
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch filters: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching filters:", error);
    
    // Return empty data as fallback
    return {
      categories: [],
      colors: [],
      fabrics: [],
    };
  }
}