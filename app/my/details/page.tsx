'use client'

import ProfileSidebar from '@/components/user/ProfileSidebar'
import ProfileDetails from '@/components/user/ProfileDetails'
import BackButton from '@/components/user/BackButton'

export default function ProfileDetailsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">My Account</h1>
        </div>

        {/* Mobile: Back Button + Content Only */}
        <div className="lg:hidden">
          <BackButton />
          <ProfileDetails />
        </div>

        {/* Desktop: Sidebar + Content */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <ProfileSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <ProfileDetails />
          </div>
        </div>
      </div>
    </div>
  )
}
