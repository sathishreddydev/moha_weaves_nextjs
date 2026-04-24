import { Metadata } from "next";
import Link from "next/link";
import { getFilters } from "@/lib/sideBarFilters";
import { unstable_cache } from "next/cache";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Categories - Premium Indian Ethnic Wear | Moha Weaves",
    description:
      "Browse our wide range of ethnic wear categories including sarees, salwar kameez, lehengas, kurtis and more.",
  };
}

const getCachedFilters = unstable_cache(
  async () => {
    return await getFilters();
  },
  ["categories"],
  {
    revalidate: 3600, // 1 hour
    tags: ["categories"],
  },
);

export default async function CategoriesPage() {
  const filters = await getCachedFilters();
  const categories = filters.categories || [];

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
                  <svg
                    className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
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
