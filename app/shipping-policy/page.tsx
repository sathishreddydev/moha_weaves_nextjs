import {
  Clock,
  Mail,
  Phone,
  Shield,
  Truck,
  User
} from "lucide-react";

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased">
      <main className="max-w-5xl mx-auto py-8">
        
        {/* Simple Header */}
        <header className="mb-8 md:mb-12 border-b border-slate-100 pb-6 md:pb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            Shipping Policy
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
            Our commitment to delivering your orders safely and transparently across India.
          </p>
        </header>

        {/* Content Sections */}
        <div className="space-y-8">
          
          {/* Section 1: Overview */}
          <section>
            <h2 className="text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] text-slate-900 mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-400" /> 01. Delivery Overview
            </h2>
            <div className="text-slate-600 space-y-4 text-sm leading-relaxed">
              <p>
                We provide shipping services to over 20,000 pincodes across India. Our reliable shipping 
                partners, <strong className="text-slate-900">Bluedart, Xpressbees, and Delhivery</strong>, help us facilitate 
                seamless delivery nationwide.
              </p>
              <ul className="grid grid-cols-1 gap-2 text-slate-500 list-none">
                <li className="flex items-start gap-2">
                  <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  <span>Standard delivery: 5-7 business days.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  <span>Express delivery: 2-3 business days (available in metros).</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  <span>Free shipping on all orders above ₹5,000.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2: Order Tracking */}
          <section>
            <h2 className="text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" /> 02. Order Tracking
            </h2>
            <div className="text-slate-600 text-sm leading-relaxed">
              <p>
                You can easily log into your <strong className="text-slate-900">Account</strong> to track your order anytime. 
                Once your order is dispatched, you will receive a tracking ID from our logistics 
                partners to monitor the transit in real-time.
              </p>
            </div>
          </section>

          {/* Section 3: Processing Timeline */}
          <section>
            <h2 className="text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> 03. Processing Timelines
            </h2>
            <div className="text-slate-600 text-sm leading-relaxed space-y-4">
              <p>
                Every order undergoes a rigorous quality check at our central atelier to ensure 
                artisan standards are met before dispatch.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-bold text-slate-900 mb-1 text-[10px] uppercase tracking-wider">Verification</h4>
                  <p className="text-xs text-slate-500">Orders are verified within 4 hours of placement.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-bold text-slate-900 mb-1 text-[10px] uppercase tracking-wider">Handling</h4>
                  <p className="text-xs text-slate-500">Packing takes 1-2 business days for most items.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Insurance & Claims */}
          <section>
            <h2 className="text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" /> 04. Insurance & Claims
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              All high-value shipments are fully insured during transit. If your package 
              is damaged or lost, please contact us within 48 hours of the delivery 
              status update to initiate a claim. We will either reship the item or 
              process a full refund upon verification.
            </p>
          </section>

          {/* Support Section */}
          <section className="pt-8 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Customer Support</h3>
            <p className="text-slate-500 text-xs mb-6">
              Please get in touch with our team if you have any questions or need further assistance.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 text-sm">
              <a href="mailto:support@example.com" className="flex items-center gap-2 text-blue-600 hover:underline">
                <Mail className="w-4 h-4" /> support@example.com
              </a>
              <span className="hidden sm:block text-slate-200">|</span>
              <a href="tel:+919876543210" className="flex items-center gap-2 text-slate-500">
                <Phone className="w-4 h-4" /> +91 98765 43210
              </a>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}