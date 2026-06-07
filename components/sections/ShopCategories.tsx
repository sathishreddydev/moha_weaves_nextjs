"use client";

import { Card } from "@/components/ui/card";
import { useFilterStore } from "@/lib/stores/fillterStore";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ShopCategories() {
  const { categories, loading: loadingCategories } = useFilterStore();

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="font-serif tracking-wide transition-colors text-xl"
            data-testid="text-categories-title"
          >
            Shop by Category
          </h2>
          <p className="text-muted-foreground text-xs">
            Explore our curated collections
          </p>
        </div>
        <Link
          href="/categories"
          className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.2em] border-b border-black pb-2 transition-all touch-manipulation active:scale-95"
        >
          <span>View All</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories?.slice(0, 8).map((category) => {
          const categoryUrl = `/collections/${encodeURIComponent(category.name)}`;
          return (
            <Link key={category.id} href={categoryUrl}>
              <Card
                className="group relative aspect-square overflow-hidden hover-elevate cursor-pointer"
                data-testid={`card-category-${category.id}`}
              >
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm font-medium">
                      {category.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
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
    </section>
  );
}
