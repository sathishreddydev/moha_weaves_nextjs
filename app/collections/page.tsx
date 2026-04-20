import { Metadata } from "next";
import CollectionsClient from "./CollectionsClient";
import StructuredData from "@/components/seo/StructuredData";
import {
  ProductFilters,
  productService,
} from "@/app/api/products/productService";
import { getFilters } from "@/lib/sideBarFilters";
import { unstable_cache } from "next/cache";

interface CollectionsPageProps {
  searchParams: Promise<{
    categories?: string;
    colors?: string;
    fabrics?: string;
    search?: string;
    price?: string;
    sort?: string;
    featured?: string;
    onSale?: string;
    page?: string;
  }>;
}

const getCachedProducts = unstable_cache(
  async (filters: ProductFilters) => {
    return await productService.getProductsByRole(filters, "user");
  },
  ["products"],
  {
    revalidate: 600,
    tags: ["products"],
  },
);

async function getProducts(filters: ProductFilters) {
  return await productService.getProductsByRole(filters, "user");
}

export async function generateMetadata({
  searchParams,
}: CollectionsPageProps): Promise<Metadata> {
  const params = await searchParams;

  const filters = {
    categories: params.categories?.split(",").filter(Boolean),
    colors: params.colors?.split(",").filter(Boolean),
    fabrics: params.fabrics?.split(",").filter(Boolean),
    search: params.search || undefined,
  };

  const titleParts: string[] = [];

  if (filters.categories?.length)
    titleParts.push(filters.categories.join(", "));
  if (filters.colors?.length) titleParts.push(filters.colors.join(" & "));
  if (filters.fabrics?.length) titleParts.push(filters.fabrics.join(" & "));
  if (filters.search) titleParts.push(`"${filters.search}"`);

  const title =
    titleParts.length > 0
      ? `${titleParts.join(" | ")} - Premium Indian Ethnic Wear | Mohawea`
      : "Collections - Premium Indian Ethnic Wear | Mohawea";

  return {
    title,
    description:
      "Discover exquisite Indian ethnic wear including sarees, salwar kameez, lehengas and more.",
  };
}

export default async function CollectionsPage({
  searchParams,
}: CollectionsPageProps) {
  const params = await searchParams;

  const filters: ProductFilters = {
    categories: params.categories?.split(",").filter(Boolean).map(cat => decodeURIComponent(cat)),
    colors: params.colors?.split(",").filter(Boolean).map(color => decodeURIComponent(color)),
    fabrics: params.fabrics?.split(",").filter(Boolean).map(fabric => decodeURIComponent(fabric)),
    search: params.search || undefined,
    minPrice: params.price?.split("-")[0]
      ? Number(params.price?.split("-")[0])
      : undefined,
    maxPrice: params.price?.split("-")[1]
      ? Number(params.price?.split("-")[1])
      : undefined,
    sort: params.sort || undefined,
    featured: params.featured === "true",
    onSale: params.onSale === "true",
    limit: 20,
    offset: params.page ? (parseInt(params.page) - 1) * 20 : 0,
    distributionChannel: "online",
  };

  const isFiltered =
    params.page ||
    params.search ||
    params.categories ||
    params.colors ||
    params.fabrics;

  const [sideBarFilters, products] = await Promise.all([
    getFilters(),
    isFiltered
      ? getProducts(filters) // fresh query
      : getCachedProducts(filters), // cached homepage load
  ]);

  const queryString = new URLSearchParams(params).toString();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const currentUrl = queryString
    ? `${baseUrl}/collections?${queryString}`
    : `${baseUrl}/collections`;

  return (
    <>
      <StructuredData
        products={products}
        filters={{
          categories: filters.categories,
          colors: filters.colors,
          fabrics: filters.fabrics,
          search: filters.search,
        }}
        currentUrl={currentUrl}
      />

      <CollectionsClient
        initialProducts={products || []}
        initialCount={products?.length || 0}
        initialFilters={filters}
        initialSidebarFilters={sideBarFilters}
      />
    </>
  );
}
