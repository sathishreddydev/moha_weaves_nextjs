'use client'

import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { User, MapPin, Package, LogOut, HelpCircle } from 'lucide-react'

interface ProfileSidebarProps {
  activeSection?: string
}

export default function ProfileSidebar({ activeSection }: ProfileSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    {
      id: 'profile',
      label: 'Profile Details',
      icon: User,
      href: '/my/details'
    },
    {
      id: 'addresses',
      label: 'Addresses',
      icon: MapPin,
      href: '/my/addresses'
    },
    {
      id: 'orders',
      label: 'Order History',
      icon: Package,
      href: '/my/orders'
    }
  ]

  const helpItem = {
    id: 'help',
    label: 'Need Help? Talk to Us',
    icon: HelpCircle,
    href: '/my/help'
  }

  const isActive = (href: string) => {
    return pathname === href
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                isActive(item.href)
                  ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          )
        })}

        <div className="border-t pt-2 mt-2">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <div className="border-t mt-6 pt-6">
        <button
          onClick={() => router.push(helpItem.href)}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
            isActive(helpItem.href)
              ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-600'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <HelpCircle className="w-5 h-5" />
          <span>{helpItem.label}</span>
        </button>
      </div>
    </div>
  )
}
