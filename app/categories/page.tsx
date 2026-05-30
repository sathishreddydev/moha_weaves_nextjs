"use client";

import Link from "next/link";
import { useFilterStore } from "@/lib/stores/fillterStore";
import { useEffect } from "react";
import { AlertCircle, Archive, ChevronRight } from "lucide-react";

export default function CategoriesPage() {
  const { categories, loading, error, invalidate } = useFilterStore();

  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading categories</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={invalidate}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Browse Categories
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our extensive collection of premium Indian ethnic wear.
            From traditional sarees to modern fusion wear, find your perfect
            style.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/collections/${encodeURIComponent(category.name)}`}
              className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                    <span className="text-purple-600 text-lg font-medium">
                      {category.name.slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {category.description}
                  </p>
                )}

                {category.subcategories &&
                  category.subcategories.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 font-medium mb-2">
                        Subcategories ({category.subcategories.length}):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {category.subcategories
                          .slice(0, 3)
                          .map((subcategory) => (
                            <span
                              key={subcategory.id}
                              className="inline-block px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full"
                            >
                              {subcategory.name}
                            </span>
                          ))}
                        {category.subcategories.length > 3 && (
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                            +{category.subcategories.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-600 font-medium">
                    View Collection
                  </span>
                 <ChevronRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Archive className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No categories found
            </h3>
            <p className="text-gray-500">
              Check back soon for new categories and collections.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
