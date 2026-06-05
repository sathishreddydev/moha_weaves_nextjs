
import React from "react";
import HeroSection from "./HeroSection";
import ShopCategories from "./ShopCategories";
import ProductSection from "./ProductSection";
import OrganizationSchema from "@/components/seo/OrganizationSchema";
import {
  getFeaturedProducts,
  getNewProducts,
} from "@/lib/services/productSectionService";

export default async function HomeContent() {
  const [featuredProducts, newProducts] = await Promise.all([
    getFeaturedProducts().catch(() => []),
    getNewProducts().catch(() => []),
  ]);

  return (
    <div id="main-content">
      <OrganizationSchema />
      {/* Visually hidden h1 for SEO — the hero section provides the visual heading */}
      <h1 className="sr-only">
        Urumi - Premium Designer Fashion for Men &amp; Women
      </h1>

      {/* Hero is full-bleed — no max-width constraint */}
      <HeroSection />

      {/* Remaining sections are constrained */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 mt-8">
        <ShopCategories />
        <ProductSection
          title="Featured Products"
          subtitle="Handpicked selections from our finest collection"
          endpoint="/api/products/featured"
          viewAllLink="/collections?featured=true"
          initialProducts={featuredProducts}
        />
        <ProductSection
          title="New Arrivals"
          subtitle="Discover the latest additions to our collection"
          endpoint="/api/products/new"
          viewAllLink="/collections?new=true"
          initialProducts={newProducts}
        />
      </div>
    </div>
  );
}
