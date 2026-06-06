"use client";

import { useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const INITIAL_VISIBLE = 8;

interface FilterSectionProps {
  title: string;
  items: { id: string; label: string; extra?: React.ReactNode }[];
  isChecked: (id: string) => boolean;
  onCheckedChange: (id: string, checked: boolean) => void;
}

export default function FilterSection({
  title,
  items,
  isChecked,
  onCheckedChange,
}: FilterSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const showSearch = items.length > INITIAL_VISIBLE;

  const filtered = query.trim()
    ? items.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  const visible =
    query.trim() || expanded ? filtered : filtered.slice(0, INITIAL_VISIBLE);

  const hiddenCount = items.length - INITIAL_VISIBLE;

  const openSearch = () => {
    setSearching(true);
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const closeSearch = () => {
    setSearching(false);
    setQuery("");
    setExpanded(false);
  };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        {searching ? (
          // Search input replaces title — uses ui/Input size + icon props
          <Input
            ref={inputRef}
            size="xs"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}…`}
            startIcon={<Search className="h-3 w-3" />}
            endIcon={
              <button
                type="button"
                onClick={closeSearch}
                className="pointer-events-auto text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close search"
              >
                <X className="h-3 w-3" />
              </button>
            }
            className="rounded-full border-gray-200 focus:border-gray-400 focus:ring-0"
          />
        ) : (
          // Normal title row
          <>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {title}
            </h4>
            {showSearch && (
              <button
                type="button"
                onClick={openSearch}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={`Search ${title}`}
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Items list */}
      <div className="space-y-1">
        {visible.length === 0 ? (
          <p className="text-xs text-gray-400 py-1">No results</p>
        ) : (
          visible.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={isChecked(item.id)}
                onChange={(e) => onCheckedChange(item.id, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 accent-gray-900 cursor-pointer flex-shrink-0"
              />
              {item.extra ? (
                <div className="flex items-center gap-2">
                  {item.extra}
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
              ) : (
                <span className="text-sm text-gray-700">{item.label}</span>
              )}
            </label>
          ))
        )}
      </div>

      {/* Show more / Show less — only when not in search mode */}
      {!query.trim() && showSearch && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          {expanded ? "Show less" : `+${hiddenCount} more`}
        </button>
      )}
    </div>
  );
}
