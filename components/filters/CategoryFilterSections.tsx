import { CategoryWithSubcategories, Color, Fabric } from "@/shared";
import { Checkbox } from "@/components/ui/checkbox";

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
  };
  onSubcategoryChange: (subcategory: string, checked: boolean) => void;
  onColorChange: (color: string, checked: boolean) => void;
  onFabricChange: (fabric: string, checked: boolean) => void;
  onToggleFilter: (filterType: "featured" | "onSale", checked: boolean) => void;
}

export default function CategoryFilterSections({
  categoryName,
  currentCategory,
  currentSubcategories,
  colors,
  fabrics,
  currentFilters,
  onSubcategoryChange,
  onColorChange,
  onFabricChange,
  onToggleFilter,
}: CategoryFilterSectionsProps) {
  return (
    <div className="space-y-6">
      {/* Current Category & Subcategories */}
      <div>
        {/* <h4 className="text-lg font-medium text-gray-900 mb-3">
          {currentCategory?.name || categoryName}
        </h4> */}
        <h4 className="text-sm font-medium text-gray-700 mb-2">Categories</h4>
        {currentSubcategories.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {currentSubcategories.map((subcategory) => (
              <div key={subcategory.id}>
                <label className="flex items-center cursor-pointer">
                  <Checkbox
                    className="mr-2"
                    checked={
                      currentFilters.subcategories?.includes(
                        subcategory.name.toLowerCase(),
                      ) || false
                    }
                    onCheckedChange={(checked) =>
                      onSubcategoryChange(subcategory.name, checked as boolean)
                    }
                  />
                  <span className="text-sm text-gray-600">
                    {subcategory.name}
                  </span>
                </label>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 ml-4">
            No subcategories available
          </div>
        )}
      </div>

      {/* Colors */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Colors</h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {colors.map((color) => (
            <label key={color.id} className="flex items-center cursor-pointer">
              <Checkbox
                className="mr-2"
                checked={
                  currentFilters.colors?.includes(color.name.toLowerCase()) ||
                  false
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
                <span className="text-sm text-gray-600">{color.name}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Fabrics */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Fabrics</h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {fabrics.map((fabric) => (
            <label key={fabric.id} className="flex items-center cursor-pointer">
              <Checkbox
                className="mr-2"
                checked={
                  currentFilters.fabrics?.includes(fabric.name.toLowerCase()) ||
                  false
                }
                onCheckedChange={(checked) =>
                  onFabricChange(fabric.name, checked as boolean)
                }
              />
              <span className="text-sm text-gray-600">{fabric.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Special Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Special</h4>
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
