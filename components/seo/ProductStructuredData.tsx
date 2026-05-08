import { Product } from "@/shared";

interface ProductStructuredDataProps {
  product: any; // ProductWithDetails type
  currentUrl: string;
  relatedProducts?: any[];
}

export default function ProductStructuredData({ 
  product, 
  currentUrl, 
  relatedProducts = [] 
}: ProductStructuredDataProps) {
  // Get base URL from environment
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name, 
        description: product.description || `Beautiful ${product.name} from Mohaweaves`,
        url: currentUrl,
        image: product.images?.length > 0 ? product.images : [],
        sku: product.sku || product.id,
        brand: {
          "@type": "Brand",
          name: "Mohaweaves",
          url: baseUrl,
          logo: `${baseUrl}/logo.png`
        },
        category: product.category?.name || "Indian Ethnic Wear",
        offers: {
          "@type": "Offer",
          price: product.discountedPrice || product.price,
          priceCurrency: "INR",
          availability: product.totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          seller: {
            "@type": "Organization",
            name: "Mohaweaves",
            url: baseUrl
          },
          priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        },
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Color",
            value: product.color?.name || "N/A"
          },
          {
            "@type": "PropertyValue", 
            name: "Fabric",
            value: product.fabric?.name || "N/A"
          },
          {
            "@type": "PropertyValue",
            name: "Category",
            value: product.category?.name || "Indian Ethnic Wear"
          }
        ],
        review: product.reviews?.length > 0 ? {
          "@type": "Review",
          reviewRating: {
            "@type": "Rating",
            ratingValue: product.averageRating || 4.5,
            bestRating: 5
          },
          author: {
            "@type": "Person",
            name: product.reviews[0]?.user?.name || "Customer"
          },
          reviewBody: product.reviews[0]?.comment || "Great product!"
        } : undefined,
        aggregateRating: product.reviewCount > 0 ? {
          "@type": "AggregateRating",
          ratingValue: product.averageRating || 4.5,
          reviewCount: product.reviewCount,
          bestRating: 5,
          worstRating: 1
        } : undefined
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: baseUrl
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Collections",
            item: `${baseUrl}/collections`
          },
          {
            "@type": "ListItem",
            position: 3,
            name: product.category?.name || "Indian Ethnic Wear",
            item: `${baseUrl}/collections/${product.category?.name?.toLowerCase() || 'ethnic-wear'}`
          },
          {
            "@type": "ListItem",
            position: 4,
            name: product.name,
            item: currentUrl
          }
        ]
      }
    ]
  };

  // Add related products if available
  if (relatedProducts.length > 0) {
    (structuredData["@graph"] as any[]).push({
      "@type": "ItemList",
      name: "Related Products",
      description: `Products similar to ${product.name}`,
      itemListElement: relatedProducts.map((relatedProduct, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: relatedProduct.name,
        item: `${baseUrl}/collections/${relatedProduct.category?.name?.toLowerCase() || 'ethnic-wear'}/${relatedProduct.urlSlug || relatedProduct.id}`,
        url: `${baseUrl}/collections/${relatedProduct.category?.name?.toLowerCase() || 'ethnic-wear'}/${relatedProduct.urlSlug || relatedProduct.id}`,
        image: relatedProduct.images?.[0] || "",
        offers: {
          "@type": "Offer",
          price: relatedProduct.discountedPrice || relatedProduct.price,
          priceCurrency: "INR"
        }
      }))
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
