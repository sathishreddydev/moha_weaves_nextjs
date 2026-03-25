import {
  ProductFilters,
  productService,
} from "@/app/api/products/productService";
import StructuredData from "@/components/seo/StructuredData";
import { Metadata } from "next";
import { unstable_cache } from "next/cache";
import CategoryClient from "./CategoryClient";
import { getFilters } from "@/lib/sideBarFilters";

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
  searchParams: Promise<{
    colors?: string;
    fabrics?: string;
    subcategories?: string;
    search?: string;
    price?: string;
    sort?: string;
    featured?: string;
    onSale?: string;
    page?: string;
  }>;
}

const getCachedCategoryProducts = unstable_cache(
  async (filters: ProductFilters) => {
    return productService.getProductsByRole(filters, "user");
  },
  ["category-products"],
  {
    revalidate: 600,
    tags: ["products"],
  },
);

async function getProducts(filters: ProductFilters) {
  return productService.getProductsByRole(filters, "user");
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const categoryName = decodeURIComponent(resolvedParams.category);

  const title = `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Collection - Premium Indian Ethnic Wear | Mohawea`;

  const description = `Discover premium ${categoryName} at Mohawea. Beautiful Indian ethnic wear crafted with traditional artistry.`;

  const queryString = new URLSearchParams(resolvedSearchParams).toString();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const canonical = queryString
    ? `${baseUrl}/collections/${categoryName}?${queryString}`
    : `${baseUrl}/collections/${categoryName}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: [
        {
          url: "https://mohawea.com/og-collections.jpg",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const categoryName = decodeURIComponent(resolvedParams.category);

  const filters: ProductFilters = {
    categories: [categoryName],
    subcategories: resolvedSearchParams.subcategories
      ?.split(",")
      .filter(Boolean),
    colors: resolvedSearchParams.colors?.split(",").filter(Boolean),
    fabrics: resolvedSearchParams.fabrics?.split(",").filter(Boolean),
    search: resolvedSearchParams.search || undefined,
    minPrice: resolvedSearchParams.price?.split("-")[0]
      ? Number(resolvedSearchParams.price?.split("-")[0])
      : undefined,
    maxPrice: resolvedSearchParams.price?.split("-")[1]
      ? Number(resolvedSearchParams.price?.split("-")[1])
      : undefined,
    sort: resolvedSearchParams.sort || undefined,
    featured: resolvedSearchParams.featured === "true",
    onSale: resolvedSearchParams.onSale === "true",
    limit: 20,
    offset: resolvedSearchParams.page
      ? (parseInt(resolvedSearchParams.page) - 1) * 20
      : 0,
    distributionChannel: "online",
  };

  const isFiltered =
    resolvedSearchParams.page ||
    resolvedSearchParams.search ||
    resolvedSearchParams.colors ||
    resolvedSearchParams.fabrics ||
    resolvedSearchParams.subcategories;

  const [sideBarFilters, products] = await Promise.all([
    getFilters(),
    isFiltered ? getProducts(filters) : getCachedCategoryProducts(filters),
  ]);

  const queryString = new URLSearchParams(resolvedSearchParams).toString();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const currentUrl = queryString
    ? `${baseUrl}/collections/${categoryName}?${queryString}`
    : `${baseUrl}/collections/${categoryName}`;

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

      <CategoryClient
        initialProducts={products}
        initialCount={products?.length || 0}
        initialFilters={filters}
        categoryName={categoryName}
        initialSidebarFilters={sideBarFilters}
      />
    </>
  );
}
