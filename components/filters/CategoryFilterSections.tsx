"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { PriceRangeSlider } from "@/components/ui/price-range-slider";
import { CategoryWithSubcategories, Color, Fabric } from "@/shared";
import FilterSection from "./FilterSection";

interface CategoryFilterSectionsProps {
  categoryName: string;
  currentCategory: CategoryWithSubcategories | null;
  currentSubcategories: any[];
  colors: Color[];
  fabrics: Fabric[];
  currentFilters: {
    subcategories?: string[];
    colors?: string[];
    fabrics?: string[];
    featured?: boolean;
    onSale?: boolean;
    priceRange?: [number, number];
    minPrice?: number;
    maxPrice?: number;
  };
  onSubcategoryChange: (subcategory: string, checked: boolean) => void;
  onColorChange: (color: string, checked: boolean) => void;
  onFabricChange: (fabric: string, checked: boolean) => void;
  onToggleFilter: (filterType: "featured" | "onSale", checked: boolean) => void;
  onPriceRangeChange?: (priceRange: [number, number]) => void;
}

export default function CategoryFilterSections({
  currentSubcategories,
  colors,
  fabrics,
  currentFilters,
  onSubcategoryChange,
  onColorChange,
  onFabricChange,
  onToggleFilter,
  onPriceRangeChange,
}: CategoryFilterSectionsProps) {
  return (
    <div className="space-y-6">
      {/* Subcategories */}
      {currentSubcategories.length > 0 ? (
        <FilterSection
          title="Categories"
          items={currentSubcategories.map((s) => ({
            id: s.name.toLowerCase(),
            label: s.name,
          }))}
          isChecked={(id) => currentFilters.subcategories?.includes(id) ?? false}
          onCheckedChange={(id, checked) => onSubcategoryChange(id, checked)}
        />
      ) : (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Categories
          </h4>
          <p className="text-sm text-gray-500 ml-0.5">No subcategories available</p>
        </div>
      )}

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
          value={[
            currentFilters.minPrice || 100,
            currentFilters.maxPrice || 50000,
          ]}
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
              onCheckedChange={(checked) =>
                onToggleFilter("featured", checked as boolean)
              }
            />
            <span className="text-sm text-gray-700">Featured</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox
              checked={currentFilters.onSale || false}
              onCheckedChange={(checked) =>
                onToggleFilter("onSale", checked as boolean)
              }
            />
            <span className="text-sm text-gray-700">On Sale</span>
          </label>
        </div>
      </div>
    </div>
  );
}
