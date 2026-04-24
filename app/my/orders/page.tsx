"use client";

import OrderHistory from "@/components/user/OrderHistory";
import ProfileSidebar from "@/components/user/ProfileSidebar";

export default function OrdersPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Mobile: Back Button + Content Only */}
      <div className="lg:hidden">
        <OrderHistory />
      </div>

      {/* Desktop: Sidebar + Content */}
      <div className="hidden lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <ProfileSidebar />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <OrderHistory />
        </div>
      </div>
    </div>
  );
}
