"use client";

import { useRouter } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  productName?: string;
}

export default function Breadcrumbs({ items, productName }: BreadcrumbsProps) {
  const router = useRouter();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <>
      <nav className="flex items-center text-sm text-gray-500">
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            {item.href ? (
              <button
                onClick={() => handleNavigation(item.href!)}
                className="hover:text-gray-700 capitalize min-h-[44px] px-2 py-1 touch-manipulation active:scale-95 transition-transform"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-gray-900">{item.label}</span>
            )}
            {index < items.length - 1 && <span className="mx-2">/</span>}
          </div>
        ))}
        {productName && (
          <>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{productName}</span>
          </>
        )}
      </nav>
    </>
  );
}
