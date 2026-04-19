"use client";

import ProfileSidebar from "@/components/user/ProfileSidebar";
import Addresses from "@/components/user/Addresses";
import BackButton from "@/components/user/BackButton";

export default function AddressesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile: Back Button + Content Only */}
        <div className="lg:hidden">
          {/* <BackButton /> */}
          <Addresses />
        </div>

        {/* Desktop: Sidebar + Content */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <ProfileSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Addresses />
          </div>
        </div>
      </div>
    </div>
  );
}
