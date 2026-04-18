'use client'

import ProfileSidebar from '@/components/user/ProfileSidebar'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">My Account</h1>
        </div>

        {/* Mobile: Sidebar Only */}
        <div className="lg:hidden">
          <ProfileSidebar />
        </div>

        {/* Desktop: Sidebar + Content */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <ProfileSidebar />
          </div>

          {/* Main Content - Desktop Only */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to Your Profile</h2>
                <p className="text-gray-600 mb-6">Select an option from the sidebar to get started</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 hover:border-primary-600 cursor-pointer transition-colors">
                    <h3 className="font-medium text-gray-900">Profile Details</h3>
                    <p className="text-sm text-gray-600 mt-1">View and edit your information</p>
                  </div>
                  <div className="border rounded-lg p-4 hover:border-primary-600 cursor-pointer transition-colors">
                    <h3 className="font-medium text-gray-900">Addresses</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage shipping addresses</p>
                  </div>
                  <div className="border rounded-lg p-4 hover:border-primary-600 cursor-pointer transition-colors">
                    <h3 className="font-medium text-gray-900">Order History</h3>
                    <p className="text-sm text-gray-600 mt-1">View your past orders</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
