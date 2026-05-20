"use client";

import OrderHistory from "@/components/user/OrderHistory";
import ProfileSidebar from "@/components/user/ProfileSidebar";

export default function OrdersPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Sidebar — desktop only */}
        <div className="hidden lg:block lg:col-span-1">
          <ProfileSidebar />
        </div>

        {/* Single OrderHistory instance — works for both mobile and desktop */}
        <div className="lg:col-span-3">
          <OrderHistory />
        </div>
      </div>
    </div>
  );
}
