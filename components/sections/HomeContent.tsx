import React from "react";
import HeroSection from "./HeroSection";
import ShopCategories from "./ShopCategories";
import ProductSection from "./ProductSection";

export default function HomeContent() {
  return (
    <div className="min-h-screen pb-12 space-y-8">
      <HeroSection />
      <ShopCategories />
      <ProductSection
        title="Featured Products"
        subtitle="Handpicked selections from our finest collection"
        endpoint="/api/products/featured"
        viewAllLink="/collections?featured=true"
      />
      <ProductSection
        title="New Arrivals"
        subtitle="Discover the latest additions to our collection"
        endpoint="/api/products/new"
        viewAllLink="/collections?new=true"
      />
    </div>
  );
}
