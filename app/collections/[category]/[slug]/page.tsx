import { Metadata } from "next";
import { notFound } from "next/navigation";
import { productService } from "@/app/api/products/productService";
import ProductStructuredData from "@/components/seo/ProductStructuredData";
import ProductDetailClient from "./ProductDetailClient";
import { getProductReviews } from "./Reviews";

interface ProductPageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

// Generate metadata for product pages
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;

  const categoryName = decodeURIComponent(resolvedParams.category);
  const slug = decodeURIComponent(resolvedParams.slug);

  // Find product by slug using the new slug-based method
  const product = await productService.getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | Mohaweaves",
      description: "The product you're looking for is not available.",
    };
  }

  // Use SEO data from product if available, otherwise generate
  const title =
    product.seoTitle ||
    `${product.name} - ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} | Mohaweaves`;

  const description =
    product.seoDescription ||
    `Shop ${product.name} from Mohaweaves ${categoryName} collection. ${product.description || "Premium quality Indian ethnic wear with traditional craftsmanship."}`;

  const keywords =
    product.seoKeywords ||
    `${product.name}, ${categoryName}, indian ethnic wear, Mohaweaves, ${product.category?.name || "traditional clothing"}, ${product.color?.name || ""}, ${product.fabric?.name || ""}`;

  // Get base URL from environment
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const canonical = `${baseUrl}/collections/${categoryName}/${slug}`;

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      images:
        product.images && product.images.length > 0
          ? [
              {
                url: product.images[0],
                width: 1200,
                height: 1200,
                alt: product.name,
              },
            ]
          : [
              {
                url: `${baseUrl}/og-product.jpg`,
                width: 1200,
                height: 630,
                alt: title,
              },
            ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images:
        product.images && product.images.length > 0
          ? [product.images[0]]
          : [`${baseUrl}/og-product.jpg`],
    },
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;

  const categoryName = decodeURIComponent(resolvedParams.category);
  const slug = decodeURIComponent(resolvedParams.slug);

  // Fetch product and related products in parallel for better performance
  const [product, relatedProducts] = await Promise.all([
    productService.getProductBySlug(slug),
    productService.getProductsByRole({
      categories: [categoryName],
      limit: 8,
      distributionChannel: "online",
    }),
  ]);

  if (!product) {
    notFound();
  }

  // Fetch reviews for the product
  const reviewsData = await getProductReviews(product.id);

  // Filter out current product from related products
  const filteredRelatedProducts = relatedProducts.filter(
    (p) => p.id !== product.id,
  );

  const currentUrl = `/collections/${categoryName}/${slug}`;

  return (
    <>
      <ProductStructuredData
        product={product}
        currentUrl={currentUrl}
        relatedProducts={filteredRelatedProducts.slice(0, 4)}
      />
      <ProductDetailClient
        product={product}
        relatedProducts={filteredRelatedProducts}
        categoryName={categoryName}
        reviewsData={reviewsData}
      />
    </>
  );
}
