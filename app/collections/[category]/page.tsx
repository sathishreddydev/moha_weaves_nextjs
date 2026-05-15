import {
  ProductFilters,
  productService,
} from "@/app/api/products/productService";
import StructuredData from "@/components/seo/StructuredData";
import { Metadata } from "next";
import CategoryClient from "./CategoryClient";

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

  const title = `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Collection - Premium Indian Ethnic Wear | Mohaweaves`;

  const description = `Discover premium ${categoryName} at Mohaweaves. Beautiful Indian ethnic wear crafted with traditional artistry.`;

  const queryString = new URLSearchParams(resolvedSearchParams).toString();

  // Get base URL from environment
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const canonical = queryString
    ? `${baseUrl}/collections/${categoryName}?${queryString}`
    : `${baseUrl}/collections/${categoryName}`;

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: [
        {
          url: `${baseUrl}/og-collections.jpg`,
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

  const subcategories = resolvedSearchParams.subcategories
    ?.split(",")
    .filter(Boolean)
    .map((sub) => decodeURIComponent(sub)); // Decode URL-encoded subcategories

  const filters: ProductFilters = {
    categories: [categoryName],
    subcategories: subcategories,
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

  const products = await getProducts(filters);

  const queryString = new URLSearchParams(resolvedSearchParams).toString();

  const currentUrl = queryString
    ? `/collections/${categoryName}?${queryString}`
    : `/collections/${categoryName}`;

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
      />
    </>
  );
}
