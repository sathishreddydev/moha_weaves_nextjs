"use client";

import { X } from "lucide-react";

interface ActiveFilterBadgesProps {
  filters: {
    label: string;
    onRemove: () => void;
  }[];
  onClearAll: () => void;
}

export default function ActiveFilterBadges({
  filters,
  onClearAll,
}: ActiveFilterBadgesProps) {
  if (filters.length === 0) return null;

  return (
    <div className="lg:hidden flex items-center gap-2 overflow-x-auto scrollbar-none py-2 -mx-4 px-4">
      {filters.map((filter, i) => (
        <span
          key={i}
          className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200"
        >
          {filter.label}
          <button
            onClick={filter.onRemove}
            className="ml-0.5 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap px-1"
      >
        Clear All
      </button>
    </div>
  );
}
