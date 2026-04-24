"use client";

import { useFilterStore } from "@/lib/stores/fillterStore";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowRight, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { getProductUrl } from "@/lib/utils/productUrl";

interface MegaMenuProps {
  className?: string;
  activeMegaMenu?: string | null;
  setActiveMegaMenu?: any;
}

export default function MegaMenu({
  className = "",
  activeMegaMenu,
  setActiveMegaMenu,
}: MegaMenuProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { categories, loading, error, fetchFilters } = useFilterStore();
  const router = useRouter();

  // Ensure component is mounted before adding interactivity
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch filters on component mount
  useEffect(() => {
    if (categories.length === 0) {
      fetchFilters();
    }
  }, [categories.length, fetchFilters]);

  // Fetch featured products with better caching
  useEffect(() => {
    if (isMounted) {
      fetchFeaturedProducts();
    }
  }, [isMounted]);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch("/api/products/featured");
      const data = await response.json();
      if (data.products) {
        setFeaturedProducts(data.products.slice(0, 6));
      }
    } catch (error) {
      console.error("Error fetching featured products:", error);
    }
  };

  const handleLinkClick = () => {
    if (!isMounted) return;
    setActiveMegaMenu(null);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Show loading state
  if (loading && categories.length === 0) {
    return (
      <nav className={cn("hidden lg:flex items-center space-x-6", className)}>
        <div className="flex items-center space-x-6">
          <div className="h-4 w-20 bg-slate-200 animate-pulse rounded"></div>
          <div className="h-4 w-24 bg-slate-200 animate-pulse rounded"></div>
        </div>
      </nav>
    );
  }

  // Show error state
  if (error) {
    return (
      <nav className={cn("hidden lg:flex items-center space-x-6", className)}>
        <div className="text-red-500 text-sm">Error loading menu</div>
      </nav>
    );
  }

  return (
    <>
      <nav className="hidden lg:flex items-center pt-[6px] gap-4">
        <div
          className="flex items-center"
          onMouseEnter={() => setActiveMegaMenu("collections")}
        >
          <Link
            href="/collections"
            className={cn(
              "flex items-center gap-1 text-xs text-slate-800 uppercase tracking-wide font-medium transition-colors duration-200",
              activeMegaMenu === "collections" && "text-slate-400",
            )}
          >
            Collections <ChevronDown className="w-4 h-4" />
          </Link>
        </div>
        {/* <div
          className="flex items-center"
          onMouseEnter={() => setActiveMegaMenu("categories")}
        >
          <Link
            href="/categories"
            className={cn(
              "flex items-center gap-1 text-xs text-slate-800 uppercase tracking-wide font-medium transition-colors duration-200",
              activeMegaMenu === "categories" && "text-slate-400",
            )}
          >
            All Categories <ChevronDown className="w-4 h-4" />
          </Link>
        </div> */}
      </nav>

      {/* Extended Header - Only render on client */}
      {isMounted && activeMegaMenu && (
        <div
          className={`!m-0 absolute top-full left-0 w-full bg-white border-b border-slate-100 overflow-hidden transition-all duration-500 ease-in-out z-40 ${
            activeMegaMenu === "categories" || activeMegaMenu === "collections"
              ? "max-h-[600px] opacity-100 translate-y-0 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]"
              : "max-h-0 opacity-0 -translate-y-4 pointer-events-none"
          }`}
          onMouseEnter={() => setActiveMegaMenu(activeMegaMenu)}
          onMouseLeave={() => setActiveMegaMenu(null)}
        >
          <div>
            {activeMegaMenu === "categories" && (
              <div className="max-w-7xl mx-auto px-8 py-6">
                <div className="flex flex-wrap gap-4">
                  {categories.map((cat, idx) => (
                    <Link
                      key={cat.name}
                      className={`flex items-center gap-5 group/item cursor-pointer px-4   ${
                        activeMegaMenu === "categories"
                          ? "animate-in fade-in slide-in-from-top-4"
                          : ""
                      }`}
                      style={{ animationDelay: `${idx * 30}ms` }}
                      href={`/collections/${encodeURIComponent(cat.name)}`}
                      onClick={handleLinkClick}
                    >
                      <div className="w-20 h-20 bg-[#F5F6F8] rounded-3xl flex items-center justify-center p-4 transition-transform group-hover/item:scale-110 shadow-sm border border-slate-50">
                        <Image
                          src={cat.imageUrl || "/placeholder-image.png"}
                          alt={cat.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-contain mix-blend-multiply opacity-90"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder-image.png";
                          }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 group-hover/item:text-[#FF8A3D] transition-colors">
                          {cat.name}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => {
                      handleLinkClick();
                      router.push("/categories");
                    }}
                    variant="ghost"
                    size={"sm"}
                    className="uppercase tracking-wide text-slate-800 hover:text-slate-400 hover:bg-transparent"
                  >
                    View All Categories <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {activeMegaMenu === "collections" && (
              <div className="max-w-7xl mx-auto px-8 py-6">
                <div className="flex flex-wrap gap-4">
                  {categories.map((cat, idx) => (
                    <Link
                      key={cat.name}
                      className={`flex items-center gap-5 group/item cursor-pointer px-4   ${
                        activeMegaMenu === "collections"
                          ? "animate-in fade-in slide-in-from-top-4"
                          : ""
                      }`}
                      style={{ animationDelay: `${idx * 30}ms` }}
                      href={`/collections/${encodeURIComponent(cat.name)}`}
                      onClick={handleLinkClick}
                    >
                      <div className="w-20 h-20 bg-[#F5F6F8] rounded-3xl flex items-center justify-center p-4 transition-transform group-hover/item:scale-110 shadow-sm border border-slate-50">
                        <Image
                          src={cat.imageUrl || "/placeholder-image.png"}
                          alt={cat.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-contain mix-blend-multiply opacity-90"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder-image.png";
                          }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 group-hover/item:text-[#FF8A3D] transition-colors">
                          {cat.name}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => {
                      handleLinkClick();
                      router.push("/collections");
                    }}
                    variant="ghost"
                    size="sm"
                    className="uppercase tracking-wide text-slate-800 hover:text-slate-400 hover:bg-transparent"
                  >
                    View All Collections <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
