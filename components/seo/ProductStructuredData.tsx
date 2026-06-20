import { ProductWithDetails } from "@/shared";

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
  
  // Ensure currentUrl is absolute for structured data
  const absoluteUrl = currentUrl.startsWith('http') ? currentUrl : `${baseUrl}${currentUrl}`
  
  const structuredData: Record<string, any> = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name, 
        description: product.description || `Beautiful ${product.name} from Urumi by Mounika`,
        url: absoluteUrl,
        image: product.images?.length > 0 
          ? product.images.map((img: string) => ({
              "@type": "ImageObject",
              url: img,
              name: product.name,
            }))
          : [],
        sku: product.sku || String(product.id),
        brand: {
          "@type": "Brand",
          name: "Urumi by Mounika",
          url: baseUrl,
          logo: `${baseUrl}/logo.png`
        },
        category: product.category?.name || "Designer Ethnic Wear",
        offers: {
          "@type": "Offer",
          price: product.discountedPrice || product.price,
          priceCurrency: "INR",
          availability: product.totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          seller: {
            "@type": "Organization",
            name: "Urumi by Mounika",
            url: baseUrl
          },
          priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // YYYY-MM-DD format
        },
        additionalProperty: [
          ...(product.color?.name ? [{
            "@type": "PropertyValue",
            name: "Color",
            value: product.color.name
          }] : []),
          ...(product.fabric?.name ? [{
            "@type": "PropertyValue", 
            name: "Fabric",
            value: product.fabric.name
          }] : []),
          ...(product.category?.name ? [{
            "@type": "PropertyValue",
            name: "Category",
            value: product.category.name
          }] : []),
        ],
        ...(product.reviews?.length > 0 ? {
          review: {
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
            reviewBody: product.reviews[0]?.comment || ""
          }
        } : {}),
        ...(product.reviewCount > 0 ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.averageRating || 4.5,
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1
          }
        } : {}),
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
            name: product.category?.name || "Designer Ethnic Wear",
            item: `${baseUrl}/collections/${encodeURIComponent((product.category?.name || 'ethnic-wear').toLowerCase())}`
          },
          {
            "@type": "ListItem",
            position: 4,
            name: product.name,
            item: absoluteUrl
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
        url: `${baseUrl}/collections/${encodeURIComponent((relatedProduct.category?.name || 'ethnic-wear').toLowerCase())}/${relatedProduct.urlSlug || relatedProduct.id}`,
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
