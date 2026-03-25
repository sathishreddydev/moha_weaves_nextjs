import { ProductWithDetails } from "@/shared";

interface StructuredDataProps {
  products: ProductWithDetails[];
  filters?: {
    categories?: string[];
    colors?: string[];
    fabrics?: string[];
    search?: string;
  };
  currentUrl?: string;
}

export default function StructuredData({ products, filters, currentUrl }: StructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: filters ? generateCollectionTitle(filters) : "Collections",
        description: filters ? generateCollectionDescription(filters) : "Discover exquisite Indian ethnic wear",
        url: currentUrl || "http://localhost:3000/collections",
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: products.length,
          itemListElement: products.map((product, index) => ({
            "@type": "Product",
            position: index + 1,
            name: product.name,
            description: product.description || `Beautiful ${product.name} from Mohawea`,
            image: product.images?.[0] || "",
            offers: {
              "@type": "Offer",
              price: product.price,
              priceCurrency: "INR",
              availability: product.totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            },
            brand: {
              "@type": "Brand",
              name: "Mohawea"
            },
            category: product.category?.name || "Indian Ethnic Wear",
            color: product.color?.name,
            material: product.fabric?.name,
          })),
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

function generateCollectionTitle(filters: any): string {
  const parts = [];
  if (filters.categories?.length) parts.push(filters.categories.join(", "));
  if (filters.colors?.length) parts.push(filters.colors.join(" & "));
  if (filters.fabrics?.length) parts.push(filters.fabrics.join(" & "));
  return parts.length > 0 ? parts.join(" | ") : "Collections";
}

function generateCollectionDescription(filters: any): string {
  const parts = [];
  if (filters.categories?.length) parts.push(`beautiful ${filters.categories.join(", ")}`);
  if (filters.colors?.length) parts.push(`in ${filters.colors.join(" and ")} colors`);
  if (filters.fabrics?.length) parts.push(`made from ${filters.fabrics.join(" and ")} fabric`);
  return parts.length > 0 ? parts.join(" ") : "exquisite Indian ethnic wear";
}