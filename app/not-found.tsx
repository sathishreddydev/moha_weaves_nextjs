import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ShoppingBag, Search, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Page Not Found - Moha Weaves",
  description:
    "The page you're looking for doesn't exist. Explore our collection of premium fashion and lifestyle products.",
};

export default function NotFound() {
  return (
    <div className="flex items-center justify-center">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Number Display */}
        <div className="relative mb-8">
          <h1 className="text-9xl font-bold text-rose-200 select-none">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-semibold text-rose-600">Oops!</span>
          </div>
        </div>

        {/* Error Message */}
        <h2 className="text-xl font-bold tracking-[0.3em] uppercase text-gray-900 mb-4">
          Page Not Found
        </h2>

        <p className="text-sm text-gray-600 mb-8 max-w-md mx-auto">
          We couldn't find the page you're looking for. The page might have been
          removed, renamed, or is temporarily unavailable.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mb-12">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-700 hover:underline"
          >
            <Home className="w-5 h-5" />
            Return to Home
          </Link>

          <Link
            href="/collections"
            className="flex items-center gap-2 text-gray-700 hover:underline"
          >
            <ShoppingBag className="w-5 h-5" />
            Collections
          </Link>
        </div>
      </div>
    </div>
  );
}
