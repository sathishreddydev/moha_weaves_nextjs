"use client";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Clock, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { getProductUrl } from "@/lib/utils/productUrl";

interface BadgeProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

// Simple Badge component with shadcn/ui Button
function Badge({ children, onClose, className = "" }: BadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full ${className}`}
    >
      {children}
      {onClose && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0.5 hover:bg-gray-200 rounded-full transition-colors duration-200"
          onClick={onClose}
          aria-label="Remove"
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

interface SearchComponentProps {
  placeholder?: string;
  autoFocus?: boolean;
  activeMegaMenu?: any;
  setActiveMegaMenu?: (menu: any) => void;
}

export default function SearchComponent({
  placeholder = "Search products...",
  autoFocus = false,
  activeMegaMenu,
  setActiveMegaMenu,
}: SearchComponentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams?.get("search") || "",
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Utility functions to reduce duplication
  const updateSearchHistory = useCallback((newHistory: string[]) => {
    try {
      setSearchHistory(newHistory);
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
    } catch (error) {
      console.warn("Failed to save search history:", error);
    }
  }, []);

  const getSearchHistorySlice = useCallback((count: number) => {
    return searchHistory.slice(0, count);
  }, [searchHistory]);

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("searchHistory");
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        setSearchHistory(history);
        // Show recent searches on initial load if no search query
        if (history.length > 0 && !searchParams?.get("search")) {
          setSuggestions(getSearchHistorySlice(5));
          setShowSuggestions(true);
        }
      }
    } catch (error) {
      console.warn("Failed to load search history:", error);
      setSearchHistory([]);
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    async (value: string) => {
      setShowNoResults(false);

      if (value.length > 0) {
        setIsSearching(true);

        try {
          // Search for products via existing API using POST method
          const response = await fetch("/api/products", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              search: value,
              limit: 5,
            }),
          });
          const data = await response.json();

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          if (data.success && data.data && data.data.length > 0) {
            setSearchResults(data.data);
            setShowSuggestions(true);
            setShowNoResults(false);
          } else {
            setSearchResults([]);
            setShowSuggestions(true);
            setShowNoResults(true);
          }
        } catch (error) {
          console.error("Error searching products:", error);
          // Fallback to search history if API fails
          const historyMatches = searchHistory
            .filter((item) => item.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 5);
          setSuggestions(historyMatches);
          setShowSuggestions(historyMatches.length > 0);
          setShowNoResults(historyMatches.length === 0);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setSearchResults([]);
        setShowSuggestions(false);
        setShowNoResults(false);
      }
    },
    [searchHistory, router, searchParams],
  );

  // Update search query state when URL changes
  useEffect(() => {
    const currentSearch = searchParams?.get("search") || "";
    setSearchQuery(currentSearch);
    if (currentSearch && currentSearch.trim()) {
      debouncedSearch(currentSearch);
    }
  }, [searchParams, debouncedSearch]);

  // Handle search input change with debouncing
  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      debouncedSearch(value);
    }, 300); // 300ms debounce
  };

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Handle clearing input
  const handleClearInput = () => {
    setSearchQuery("");
    setShowSuggestions(false);
  };

  // Handle deleting search history item
  const handleHistoryDelete = (suggestion: string) => {
    const updatedHistory = searchHistory.filter((item) => item !== suggestion);
    updateSearchHistory(updatedHistory);

    // If no more history, hide suggestions
    if (updatedHistory.length === 0) {
      setShowSuggestions(false);
    } else {
      // Update suggestions with remaining history
      setSuggestions(updatedHistory.slice(0, 5));
    }
  };

  // Handle product click in search results
  const handleProductClick = (product: any) => {
    const productUrl = getProductUrl(product);
    router.push(productUrl);
  };
  // Handle history selection
  const handleHistorySelection = (query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    setActiveMegaMenu?.(null);
    
    if (searchQuery.trim()) {
      try {
        // Save to search history
        const updatedHistory = [
          searchQuery.trim(),
          ...searchHistory.filter((item) => item !== searchQuery.trim()),
        ].slice(0, 10);
        updateSearchHistory(updatedHistory);
      } catch (error) {
        console.warn("Failed to save search history:", error);
      }

      // Create new URLSearchParams
      const params = new URLSearchParams(searchParams?.toString());
      params.set("search", searchQuery.trim());

      // Navigate to collections page with search query
      router.push(`/collections?${params.toString()}`);
    } else {
      // Navigate to collections page without search
      router.push("/collections");
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(e as any);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <InputGroup>
        <InputGroupInput
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleSearchInputChange(e.target.value)}
          onFocus={() => {
            if (searchQuery.length === 0 && searchHistory.length > 0) {
              setSuggestions(getSearchHistorySlice(5));
              setShowSuggestions(true);
            }
          }}
          onKeyDown={handleKeyDown}
          data-slot="input-group-control"
          autoFocus={autoFocus}
        />

        <InputGroupAddon align="inline-end">
          {searchQuery && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-gray-600 mr-1"
              onClick={handleClearInput}
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </InputGroupAddon>
      </InputGroup>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <div className="mt-1">
          {isSearching ? (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          ) : showNoResults ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No products found
            </div>
          ) : searchResults.length > 0 ? (
            searchResults
              .map((product: any) => {
                // Validate product data before rendering
                if (!product || !product.id || !product.name) {
                  console.warn("Invalid product data:", product);
                  return null;
                }

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductClick(product)}
                    className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 first:rounded-t-md last:rounded-b-md text-left"
                    aria-label={`View product: ${product.name}`}
                  >
                    <div className="flex items-center space-x-3">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded flex items-center justify-center">
                          <span className="text-purple-600 text-xs">P</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        {product.price && (
                          <div className="text-xs text-gray-500">
                            ₹{product.price}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
              .filter(Boolean)
          ) : suggestions.length > 0 ? (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Recent Searches
              </div>
              <div className="flex flex-wrap gap-2 px-4 pb-2">
                {suggestions.map((suggestion, index) => (
                  <Badge
                    key={index}
                    onClose={() => handleHistoryDelete(suggestion)}
                    className="cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1 py-0 text-xs hover:bg-transparent"
                      onClick={() => handleHistorySelection(suggestion)}
                    >
                      <Clock className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      <span className="ml-1">{suggestion}</span>
                    </Button>
                  </Badge>
                ))}
              </div>
            </>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">
              Type to search products
            </div>
          )}
        </div>
      )}
    </form>
  );
}
