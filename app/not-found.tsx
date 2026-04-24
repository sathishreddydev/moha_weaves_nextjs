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
    <div className="bg-gradient-to-b from-rose-50 to-white flex items-center justify-center">
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
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button asChild size="lg" className="bg-rose-600 hover:bg-rose-700">
            <Link href="/" className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-rose-200 text-rose-600 hover:bg-rose-50"
          >
            <Link href="/collections" className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Shop Products
            </Link>
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Maybe you're looking for:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* <Link
              href="/categories"
              className="flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors p-2 rounded hover:bg-rose-50"
            >
              <Search className="w-4 h-4" />
              Browse Categories
            </Link>

            <Link
              href="/collections"
              className="flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors p-2 rounded hover:bg-rose-50"
            >
              <ShoppingBag className="w-4 h-4" />
              View Collections
            </Link> */}

            <Link
              href="/my"
              className="flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors p-2 rounded hover:bg-rose-50"
            >
              <ArrowLeft className="w-4 h-4" />
              My Account
            </Link>

            <Link
              href="/contact"
              className="flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors p-2 rounded hover:bg-rose-50"
            >
              <Search className="w-4 h-4" />
              Contact Us
            </Link>
          </div>
        </div>

        {/* Contact Support */}
        <div className="text-sm text-gray-500">
          <p>Still can't find what you're looking for?</p>
          <Link
            href="/contact"
            className="text-rose-600 hover:text-rose-700 font-medium underline"
          >
            Contact our support team
          </Link>
        </div>
      </div>
    </div>
  );
}
