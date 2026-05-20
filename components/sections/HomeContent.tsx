import React from "react";
import HeroSection from "./HeroSection";
import ShopCategories from "./ShopCategories";
import ProductSection from "./ProductSection";

export default function HomeContent() {
  return (
    <div id="main-content">
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
        />
        <ProductSection
          title="New Arrivals"
          subtitle="Discover the latest additions to our collection"
          endpoint="/api/products/new"
          viewAllLink="/collections?new=true"
        />
      </div>
    </div>
  );
}
