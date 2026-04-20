import { CategoryWithSubcategories, Color, Fabric } from "@/shared";
import { Checkbox } from "@/components/ui/checkbox";

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
  };
  onCategoryChange: (category: string, checked: boolean) => void;
  onColorChange: (color: string, checked: boolean) => void;
  onFabricChange: (fabric: string, checked: boolean) => void;
  onToggleFilter: (filterType: "featured" | "onSale", checked: boolean) => void;
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
}: FilterSectionsProps) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Categories
        </h4>
        <div className="space-y-2 overflow-y-auto">
          {categories.map((category) => (
            <div key={category.id}>
              <label className="flex items-center cursor-pointer">
                <Checkbox
                  className="mr-2"
                  checked={
                    currentFilters.categories?.includes(
                      category.name.toLowerCase(),
                    ) || false
                  }
                  onCheckedChange={(checked) =>
                    onCategoryChange(
                      category.name,
                      checked as boolean,
                    )
                  }
                />
                <span className="text-sm text-gray-600">
                  {category.name}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Colors
        </h4>
        <div className="space-y-2 overflow-y-auto">
          {colors.map((color) => (
            <label key={color.id} className="flex items-center cursor-pointer">
              <Checkbox
                className="mr-2"
                checked={
                  currentFilters.colors?.includes(
                    color.name.toLowerCase(),
                  ) || false
                }
                onCheckedChange={(checked) =>
                  onColorChange(color.name, checked as boolean)
                }
              />
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                  style={{ backgroundColor: color.hexCode }}
                ></div>
                <span className="text-sm text-gray-600">
                  {color.name}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Fabrics */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Fabrics
        </h4>
        <div className="space-y-2 overflow-y-auto">
          {fabrics.map((fabric) => (
            <label key={fabric.id} className="flex items-center cursor-pointer">
              <Checkbox
                className="mr-2"
                checked={
                  currentFilters.fabrics?.includes(
                    fabric.name.toLowerCase(),
                  ) || false
                }
                onCheckedChange={(checked) =>
                  onFabricChange(fabric.name, checked as boolean)
                }
              />
              <span className="text-sm text-gray-600">
                {fabric.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Special Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Special
        </h4>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer">
            <Checkbox
              className="mr-2"
              checked={currentFilters.featured || false}
              onCheckedChange={(checked) =>
                onToggleFilter("featured", checked as boolean)
              }
            />
            <span className="text-sm text-gray-600">Featured</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <Checkbox
              className="mr-2"
              checked={currentFilters.onSale || false}
              onCheckedChange={(checked) =>
                onToggleFilter("onSale", checked as boolean)
              }
            />
            <span className="text-sm text-gray-600">On Sale</span>
          </label>
        </div>
      </div>
    </div>
  );
}
