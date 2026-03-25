import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { ProductWithDetails } from "@/shared";

interface ProductSectionProps {
  title: string;
  subtitle: string;
  endpoint: string;
  viewAllLink: string;
}

async function getProducts(endpoint: string): Promise<ProductWithDetails[]> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}${endpoint}`, {
      cache: "no-store",
    });
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export default async function ProductSection({
  title,
  subtitle,
  endpoint,
  viewAllLink,
}: ProductSectionProps) {
  const products = await getProducts(endpoint);
  if (products.length === 0) {
    return null;
  }
  return (
    <section>
      <div className="max-w-7xl mx-auto px-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="font-serif tracking-tighter transition-colors
               text-2xl"
              data-testid="text-featured-title"
            >
              {title}
            </h1>
            <p
              className="text-muted-foreground
               text-xs"
            >
              {subtitle}
            </p>
          </div>

          <Link
            href={viewAllLink}
            className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.2em] border-b border-black pb-2 transition-all"
          >
            <span>View All</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showNewBadge={true}
              showFeaturedBadge={true}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
