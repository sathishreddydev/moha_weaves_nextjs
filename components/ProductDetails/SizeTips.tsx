"use client";

interface SizeTipsProps {
  className?: string;
}

export default function SizeTips({ className = "" }: SizeTipsProps) {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-blue-900 mb-3">Size Tips</h3>
      <ul className="space-y-2 text-sm text-blue-800">
        <li className="flex items-start gap-2">
          <span className="text-blue-600 mt-0.5">•</span>
          <span>If you're between sizes, we recommend sizing up for comfort</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-600 mt-0.5">•</span>
          <span>Traditional Indian wear may have different sizing than Western brands</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-600 mt-0.5">•</span>
          <span>Consider the fabric - stretchable materials may allow for smaller sizing</span>
        </li>
      </ul>
    </div>
  );
}
