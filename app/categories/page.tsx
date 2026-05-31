"use client";

import Link from "next/link";
import Image from "next/image";
import { useFilterStore } from "@/lib/stores/fillterStore";
import { AlertCircle, Archive, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CategoriesPage() {
  const { categories, loading, error, invalidate } = useFilterStore();

  if (loading) {
    return (
      <div className="min-h-screen">
        {/* Header skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse aspect-[3/4] bg-gray-200 rounded-xl"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-serif font-medium text-gray-900 mb-2">
            Unable to load categories
          </h3>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <button
            onClick={invalidate}
            className="inline-flex items-center px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-full hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header - matching collections page style */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <h1 className="text-xl font-light text-gray-900 uppercase tracking-[0.1em]">
          Categories
        </h1>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 mt-4">
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {categories.map((category, index) => {
              const isLarge = index === 0 || index === 3;
              return (
                <Link
                  key={category.id}
                  href={`/collections/${encodeURIComponent(category.name)}`}
                  className={`group relative overflow-hidden rounded-xl ${
                    isLarge
                      ? "col-span-2 row-span-2 aspect-[4/5]"
                      : "aspect-[3/4]"
                  }`}
                >
                  {/* Image */}
                  <div className="absolute inset-0">
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes={
                          isLarge
                            ? "(max-width: 768px) 100vw, 50vw"
                            : "(max-width: 768px) 50vw, 25vw"
                        }
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone-200 to-stone-300" />
                    )}
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity group-hover:from-black/80" />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
                    <h3
                      className={`font-serif text-white mb-1 ${
                        isLarge
                          ? "text-xl md:text-3xl"
                          : "text-base md:text-xl"
                      }`}
                    >
                      {category.name}
                    </h3>

                    {category.description && isLarge && (
                      <p className="text-white/80 text-xs md:text-sm line-clamp-2 mb-3 hidden md:block">
                        {category.description}
                      </p>
                    )}

                    {category.subcategories &&
                      category.subcategories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3 hidden md:flex">
                          {category.subcategories
                            .slice(0, isLarge ? 4 : 2)
                            .map((sub) => (
                              <Badge
                                key={sub.id}
                                variant="secondary"
                                className="bg-white/20 text-white border-white/30 text-[10px] backdrop-blur-sm"
                              >
                                {sub.name}
                              </Badge>
                            ))}
                          {category.subcategories.length >
                            (isLarge ? 4 : 2) && (
                            <Badge
                              variant="secondary"
                              className="bg-white/20 text-white border-white/30 text-[10px] backdrop-blur-sm"
                            >
                              +
                              {category.subcategories.length -
                                (isLarge ? 4 : 2)}{" "}
                              more
                            </Badge>
                          )}
                        </div>
                      )}

                    <div className="flex items-center gap-1 text-white/90 text-xs font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <span>Shop Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Archive className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-serif font-medium text-gray-900 mb-2">
              No categories yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Check back soon for new collections.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
