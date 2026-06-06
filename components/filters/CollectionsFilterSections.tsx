"use client";

import { CategoryWithSubcategories, Color, Fabric } from "@/shared";
import { PriceRangeSlider } from "@/components/ui/price-range-slider";
import { Checkbox } from "@/components/ui/checkbox";
import FilterSection from "./FilterSection";

interface FilterSectionsProps {
  categories: CategoryWithSubcategories[];
  colors: Color[];
  fabrics: Fabric[];
  currentFilters: {
    categories?: string[];
    colors?: string[];
    fabrics?: string[];
    featured?: boolean;
    onSale?: boolean;
    priceRange?: [number, number];
    minPrice?: number;
    maxPrice?: number;
  };
  onCategoryChange: (category: string, checked: boolean) => void;
  onColorChange: (color: string, checked: boolean) => void;
  onFabricChange: (fabric: string, checked: boolean) => void;
  onToggleFilter: (filterType: "featured" | "onSale", checked: boolean) => void;
  onPriceRangeChange?: (priceRange: [number, number]) => void;
}

export default function CollectionsFilterSections({
  categories,
  colors,
  fabrics,
  currentFilters,
  onCategoryChange,
  onColorChange,
  onFabricChange,
  onToggleFilter,
  onPriceRangeChange,
}: FilterSectionsProps) {
  return (
    <div className="space-y-7">
      {/* Categories */}
      <FilterSection
        title="Categories"
        items={categories.map((c) => ({ id: c.name.toLowerCase(), label: c.name }))}
        isChecked={(id) => currentFilters.categories?.includes(id) ?? false}
        onCheckedChange={(id, checked) => onCategoryChange(id, checked)}
      />

      {/* Colors */}
      <FilterSection
        title="Colors"
        items={colors.map((c) => ({
          id: c.name.toLowerCase(),
          label: c.name,
          extra: (
            <div
              className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
              style={{ backgroundColor: c.hexCode }}
            />
          ),
        }))}
        isChecked={(id) => currentFilters.colors?.includes(id) ?? false}
        onCheckedChange={(id, checked) => onColorChange(id, checked)}
      />

      {/* Fabrics */}
      <FilterSection
        title="Fabrics"
        items={fabrics.map((f) => ({ id: f.name.toLowerCase(), label: f.name }))}
        isChecked={(id) => currentFilters.fabrics?.includes(id) ?? false}
        onCheckedChange={(id, checked) => onFabricChange(id, checked)}
      />

      {/* Price Range */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Price Range
        </h4>
        <PriceRangeSlider
          min={100}
          max={50000}
          step={100}
          value={[currentFilters.minPrice || 100, currentFilters.maxPrice || 50000]}
          onValueChange={onPriceRangeChange || (() => {})}
        />
      </div>

      {/* Special */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Special
        </h4>
        <div className="space-y-1">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox
              checked={currentFilters.featured || false}
              onCheckedChange={(checked) => onToggleFilter("featured", checked as boolean)}
            />
            <span className="text-sm text-gray-700">Featured</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox
              checked={currentFilters.onSale || false}
              onCheckedChange={(checked) => onToggleFilter("onSale", checked as boolean)}
            />
            <span className="text-sm text-gray-700">On Sale</span>
          </label>
        </div>
      </div>
    </div>
  );
}
