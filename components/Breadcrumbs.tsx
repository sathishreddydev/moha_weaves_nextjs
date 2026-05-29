"use client";

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-500 min-w-0">
      <ol className="flex items-center min-w-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center min-w-0">
              {!isLast && item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-gray-700 capitalize px-2 py-1 touch-manipulation active:scale-95 transition-transform whitespace-nowrap flex-shrink-0"
                >
                  {item.label}
                </Link>
              ) : isLast ? (
                <span
                  className="text-gray-900 truncate min-w-0 px-2 max-w-[140px] sm:max-w-[260px] lg:max-w-[340px]"
                  title={item.label}
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <span className="text-gray-900 whitespace-nowrap flex-shrink-0 px-2">{item.label}</span>
              )}
              {!isLast && <span aria-hidden="true" className="flex-shrink-0">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
