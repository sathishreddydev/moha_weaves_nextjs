"use client";

import { ProductWithDetails } from "@/shared";

interface SpecificationsProps {
  product: ProductWithDetails;
}

export default function Specifications({ product }: SpecificationsProps) {
  return (
    <div className="border rounded-lg p-6 bg-white">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Specifications
      </h3>
      <div className="grid grid-cols-1 gap-3 text-xs space-y-1">
        {product.sku && (
          <div className="flex justify-between border-b border-gray-100">
            <span className="text-gray-600">SKU</span>
            <span className="font-medium text-gray-900">
              {product.sku}
            </span>
          </div>
        )}
        {product.category?.name && (
          <div className="flex justify-between border-b border-gray-100">
            <span className="text-gray-600">Category</span>
            <span className="font-medium text-gray-900">
              {product.category.name}
            </span>
          </div>
        )}
        {product.subcategory?.name && (
          <div className="flex justify-between border-b border-gray-100">
            <span className="text-gray-600">Subcategory</span>
            <span className="font-medium text-gray-900">
              {product.subcategory.name}
            </span>
          </div>
        )}
        {product.color?.name && (
          <div className="flex justify-between border-b border-gray-100">
            <span className="text-gray-600">Color</span>
            <span className="font-medium text-gray-900">
              {product.color.name}
            </span>
          </div>
        )}
        {product.fabric?.name && (
          <div className="flex justify-between border-b border-gray-100">
            <span className="text-gray-600">Fabric</span>
            <span className="font-medium text-gray-900">
              {product.fabric.name}
            </span>
          </div>
        )}
        <div className="flex justify-between border-b border-gray-100">
          <span className="text-gray-600">Availability</span>
          <span
            className={`font-medium ${
              product.variants?.some(v => v.onlineStock > 0)
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {product.variants?.some(v => v.onlineStock > 0)
              ? "In Stock"
              : "Out of Stock"}
          </span>
        </div>
      </div>
    </div>
  );
}
