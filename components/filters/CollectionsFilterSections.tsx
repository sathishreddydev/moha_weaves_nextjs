import { CategoryWithSubcategories, Color, Fabric } from "@/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { PriceRangeSlider } from "@/components/ui/price-range-slider";

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
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Categories
        </h4>
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id}>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={
                    currentFilters.categories?.includes(category.name.toLowerCase()) || false
                  }
                  onCheckedChange={(checked) => onCategoryChange(category.name, checked as boolean)}
                />
                <span className="text-sm text-gray-700">{category.name}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Colors
        </h4>
        <div className="space-y-3">
          {colors.map((color) => (
            <label key={color.id} className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox
                checked={currentFilters.colors?.includes(color.name.toLowerCase()) || false}
                onCheckedChange={(checked) => onColorChange(color.name, checked as boolean)}
              />
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: color.hexCode }}
                />
                <span className="text-sm text-gray-700">{color.name}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Fabrics */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Fabrics
        </h4>
        <div className="space-y-3">
          {fabrics.map((fabric) => (
            <label key={fabric.id} className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox
                checked={currentFilters.fabrics?.includes(fabric.name.toLowerCase()) || false}
                onCheckedChange={(checked) => onFabricChange(fabric.name, checked as boolean)}
              />
              <span className="text-sm text-gray-700">{fabric.name}</span>
            </label>
          ))}
        </div>
      </div>

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

      {/* Special Filters */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Special
        </h4>
        <div className="space-y-3">
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
