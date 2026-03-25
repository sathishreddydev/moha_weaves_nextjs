"use client";

import { Button } from "../ui/button";
import SearchComponent from "../layout/SearchComponent";
import { cn } from "@/lib/utils";
import { SearchIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFilterStore } from "@/lib/stores/fillterStore";

interface MegaMenuProps {
  className?: string;
  activeMegaMenu?: string | null;
  setActiveMegaMenu?: any;
}

export default function Search({
  className = "",
  activeMegaMenu,
  setActiveMegaMenu,
}: MegaMenuProps) {
  const [isMounted, setIsMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { categories, loading, error } = useFilterStore();
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle click outside to close mega menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeMegaMenu === "search" &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setActiveMegaMenu?.(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMegaMenu, setActiveMegaMenu]);

  // Show loading state
  if (loading && categories.length === 0) {
    return (
      <nav className={cn("hidden lg:flex items-center space-x-6", className)}>
        <div className="flex items-center space-x-6">
          <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
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
    <div ref={searchContainerRef}>
      <nav className="">
        <div
          className="h-20 flex items-center"
          onMouseEnter={() => setActiveMegaMenu("search")}
        >
          <Button
            variant="link"
            size="sm"
            aria-label="Search"
            className={cn(
              "text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200",
              activeMegaMenu === "search" && "text-purple-600",
            )}
            onClick={()=>setActiveMegaMenu('search')}
          >
            <SearchIcon className="w-6 h-6" />
          </Button>
        </div>
      </nav>

      {/* Extended Header - Only render on client */}
      {isMounted && activeMegaMenu && (
        <div
          className={`!m-0 absolute top-full left-0 w-full bg-white border-b border-slate-100 overflow-hidden transition-all duration-500 ease-in-out z-40 ${
            activeMegaMenu === "search"
              ? "max-h-[600px] opacity-100 translate-y-0 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]"
              : "max-h-0 opacity-0 -translate-y-4 pointer-events-none"
          }`}
          onMouseEnter={() => setActiveMegaMenu("search")}
          onMouseLeave={() => setActiveMegaMenu(null)}
        >
          <div>
            {activeMegaMenu === "search" && (
              <div className="max-w-7xl mx-auto px-8 py-6">
                <SearchComponent
                  activeMegaMenu={activeMegaMenu}
                  setActiveMegaMenu={setActiveMegaMenu}
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
