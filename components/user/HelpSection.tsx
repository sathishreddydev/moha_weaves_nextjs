'use client'

import { Button } from '@/components/ui/button'

export default function HelpSection() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Need Help? Talk to Us</h2>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">How can we help you?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 hover:border-primary-600 cursor-pointer transition-colors">
                <h4 className="font-medium text-gray-900 mb-2">Order Issues</h4>
                <p className="text-gray-600 text-sm">Questions about your orders, shipping, or returns</p>
              </div>
              <div className="border rounded-lg p-4 hover:border-primary-600 cursor-pointer transition-colors">
                <h4 className="font-medium text-gray-900 mb-2">Product Information</h4>
                <p className="text-gray-600 text-sm">Details about products, sizes, and availability</p>
              </div>
              <div className="border rounded-lg p-4 hover:border-primary-600 cursor-pointer transition-colors">
                <h4 className="font-medium text-gray-900 mb-2">Account Help</h4>
                <p className="text-gray-600 text-sm">Login issues, profile updates, and security</p>
              </div>
              <div className="border rounded-lg p-4 hover:border-primary-600 cursor-pointer transition-colors">
                <h4 className="font-medium text-gray-900 mb-2">Payment & Billing</h4>
                <p className="text-gray-600 text-sm">Payment methods, refunds, and billing questions</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Us</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">support@mohaweaves.com</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-gray-900">+91 1800-123-4567</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours</label>
                <p className="text-gray-900">Monday - Saturday: 9:00 AM - 6:00 PM</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <Button className="w-full">Start Live Chat</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
