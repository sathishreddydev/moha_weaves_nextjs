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
  // Get base URL from environment
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  // Ensure URL is absolute
  const absoluteUrl = currentUrl?.startsWith('http') ? currentUrl : `${baseUrl}${currentUrl || '/collections'}`
  
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: filters ? generateCollectionTitle(filters) : "Collections",
        description: filters ? generateCollectionDescription(filters) : "Discover designer ethnic wear for men & women",
        url: absoluteUrl,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: products.length,
          itemListElement: products.map((product, index) => ({
            "@type": "Product",
            position: index + 1,
            name: product.name,
            description: product.description || `Beautiful ${product.name} from Urumi`,
            image: product.images?.[0] || "",
            offers: {
              "@type": "Offer",
              price: product.price,
              priceCurrency: "INR",
              availability: product.totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            },
            brand: {
              "@type": "Brand",
              name: "Urumi by Mounika"
            },
            category: product.category?.name || "Designer Ethnic Wear",
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
  return parts.length > 0 ? parts.join(" ") : "designer ethnic wear for men & women";
}
