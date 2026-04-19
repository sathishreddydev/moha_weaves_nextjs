"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Mail, Phone, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import LiveChat from "./LiveChat";

export default function HelpSection() {
  const router = useRouter();
  const handleBack = () => {
    router.push("/my");
  };

  const quickActions = [
    {
      title: "Track Order",
      description: "Check the status of your recent orders",
      icon: "📦",
      action: () => router.push("/my/orders")
    },
    {
      title: "Return Request",
      description: "Initiate a return or exchange",
      icon: "🔄",
      action: () => router.push("/my/orders")
    },
    {
      title: "Payment Issues",
      description: "Help with payment and billing",
      icon: "💳",
      action: () => window.open("mailto:support@mohaweaves.com?subject=Payment Issue")
    },
    {
      title: "Account Help",
      description: "Login, profile, and security assistance",
      icon: "🔐",
      action: () => window.open("mailto:support@mohaweaves.com?subject=Account Help")
    }
  ];

  return (
    <>
      <div className="space-y-4">
        <div
          onClick={handleBack}
          className="flex items-center gap-4 cursor-pointer lg:hidden"
        >
          <ArrowLeft className="w-6 h-6 text-gray-500" color="#1F2937" />
          <h1 className="text-xl font-semibold text-gray-900">
            Need Help? Talk to Us
          </h1>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md overflow-hidden">
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className="border rounded-lg p-4 hover:border-primary-600 hover:bg-primary-50 transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl group-scale-110 transition-transform duration-200">
                          {action.icon}
                        </span>
                        <h4 className="font-medium text-gray-900 group-text-primary-600 transition-colors">
                          {action.title}
                        </h4>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {action.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Contact Us
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a
                    href="mailto:support@mohaweaves.com"
                    className="flex items-center gap-3 p-4 border rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center group-bg-primary-200 transition-colors">
                      <Mail className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">support@mohaweaves.com</p>
                    </div>
                  </a>

                  <a
                    href="tel:+9118001234567"
                    className="flex items-center gap-3 p-4 border rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center group-bg-primary-200 transition-colors">
                      <Phone className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Phone</p>
                      <p className="text-sm text-gray-600">+91 1800-123-4567</p>
                    </div>
                  </a>

                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Working Hours</p>
                      <p className="text-sm text-gray-600">9:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Chat CTA */}
              <div className="border-t pt-6">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">Support is online</span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Prefer to chat? We're here to help!
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Get instant answers to your questions with our live chat support.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button className="touch-manipulation active:scale-95">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Start Live Chat
                    </Button>
                    <Button variant="outline" className="touch-manipulation active:scale-95">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Support
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Frequently Asked Questions
            </h3>
            <div className="space-y-4">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="font-medium text-gray-900">How do I track my order?</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform duration-200">▼</span>
                </summary>
                <div className="p-4 pt-0 text-gray-600 text-sm">
                  You can track your order by visiting the "Order History" section in your account. Click on any order to view its current status and tracking details.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="font-medium text-gray-900">What is your return policy?</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform duration-200">▼</span>
                </summary>
                <div className="p-4 pt-0 text-gray-600 text-sm">
                  We offer a 30-day return policy from the date of delivery. Items must be unused and in original condition. Visit your order history to initiate a return.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="font-medium text-gray-900">How do I change my address?</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform duration-200">▼</span>
                </summary>
                <div className="p-4 pt-0 text-gray-600 text-sm">
                  Go to the "Addresses" section in your account to add, edit, or delete shipping addresses. You can set a default address for future orders.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="font-medium text-gray-900">What payment methods do you accept?</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform duration-200">▼</span>
                </summary>
                <div className="p-4 pt-0 text-gray-600 text-sm">
                  We accept all major credit/debit cards, UPI, net banking, and digital wallets. All payments are secure and encrypted.
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {/* Live Chat Component */}
      <LiveChat />
    </>
  );
}
