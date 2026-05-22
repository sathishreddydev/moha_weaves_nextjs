"use client";

import ProfileSidebar from "@/components/user/ProfileSidebar";
import Link from "next/link";

export default function ProfilePage() {
  return (
    <>
      {/* Mobile: show sidebar as the page content (navigation menu) */}
      <div className="lg:hidden">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">My Account</h1>
        </div>
        <ProfileSidebar />
      </div>

      {/* Desktop: welcome content (sidebar is already in layout) */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Welcome to Your Profile
            </h2>
            <p className="text-gray-600 mb-6">
              Select an option from the sidebar to get started
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/my/details"
                className="border rounded-lg p-4 hover:border-gray-400 cursor-pointer transition-colors text-left"
              >
                <h3 className="font-medium text-gray-900">Profile Details</h3>
                <p className="text-sm text-gray-600 mt-1">
                  View and edit your information
                </p>
              </Link>
              <Link
                href="/my/addresses"
                className="border rounded-lg p-4 hover:border-gray-400 cursor-pointer transition-colors text-left"
              >
                <h3 className="font-medium text-gray-900">Addresses</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Manage shipping addresses
                </p>
              </Link>
              <Link
                href="/my/orders"
                className="border rounded-lg p-4 hover:border-gray-400 cursor-pointer transition-colors text-left"
              >
                <h3 className="font-medium text-gray-900">Order History</h3>
                <p className="text-sm text-gray-600 mt-1">
                  View your past orders
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
