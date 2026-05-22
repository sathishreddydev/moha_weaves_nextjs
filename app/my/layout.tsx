"use client";

import ProfileSidebar from "@/components/user/ProfileSidebar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MyLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Sidebar — desktop only, rendered once for all /my/* pages */}
        <div className="hidden lg:block lg:col-span-1">
          <ProfileSidebar />
        </div>

        {/* Page content */}
        <div className="lg:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
}
