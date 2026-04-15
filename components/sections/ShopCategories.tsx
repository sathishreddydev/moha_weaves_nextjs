"use client";

import { Card } from "@/components/ui/card";
import { useFilterStore } from "@/lib/stores";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function ShopCategories() {
  const {
    categories,
    loading: loadingCategories,
    error,
    fetchFilters,
  } = useFilterStore();

  useEffect(() => {
    if (!categories || categories.length === 0) {
      fetchFilters();
    }
  }, [categories, fetchFilters]);

  return (
    <section>
      <div className="max-w-7xl mx-auto lg:px-10 px-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="font-serif tracking-wide transition-colors
               text-2xl"
              data-testid="text-categories-title"
            >
              Shop by Category
            </h1>

            <p
              className="text-muted-foreground
               text-xs"
            >
              Explore our curated collections
            </p>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.2em] border-b border-black pb-2 transition-all"
          >
            <span>View All</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories?.slice(0, 8).map((category) => {
            const categoryUrl = `/collections/${category.name.toLowerCase().replace(/\s+/g, "-")}`;

            return (
              <Link key={category.id} href={categoryUrl}>
                <Card
                  className="group relative aspect-square overflow-hidden hover-elevate cursor-pointer"
                  data-testid={`card-category-${category.id}`}
                >
                  <img
                    src={
                      category?.imageUrl ||
                      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop"
                    }
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-serif text-lg font-medium text-white">
                      {category.name}
                    </h3>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
