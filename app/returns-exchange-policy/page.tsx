"use client";
import React from "react";
import {
  RefreshCw,
  ShieldCheck,
  Clock,
  Package,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Mail,
  Truck,
  CreditCard,
  Globe,
  HelpCircle,
} from "lucide-react";

export default function ReturnsPolicyPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased">
      <main className="max-w-5xl mx-auto py-12 space-y-12">
        {/* Minimalist Centered Header */}
        <header className="border-b border-slate-100 pb-8 max-w-3xl">
          {/* <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-4">
            Service Policy
          </h2> */}
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">
            Returns & Exchanges
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Every Moha Weaves creation is a labor of love. If your piece isn't
            perfect for you, we offer a streamlined return and exchange process
            to ensure your satisfaction.
          </p>
        </header>

        {/* The Process - Horizontal Flow */}
        <section >
          <div className="flex items-center gap-3 mb-10">
            <span className="h-px w-8 bg-slate-900"></span>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">
              The 4-Step Process
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
            {[
              {
                icon: Mail,
                title: "Request",
                desc: "Raise a request from your Order History within 7 days.",
              },
              {
                icon: Truck,
                title: "Pickup",
                desc: "Our partner will collect the item within 48-72 hours.",
              },
              {
                icon: ShieldCheck,
                title: "Audit",
                desc: "Inspection at our atelier takes 1-2 business days.",
              },
              {
                icon: CreditCard,
                title: "Settlement",
                desc: "Refund or exchange processed within 7-10 days.",
              },
            ].map((step, idx) => (
              <div key={idx} className="relative group">
                <div className="mb-4 text-slate-900 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-6 h-6 stroke-[1.5px]" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">
                  {step.title}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed pr-4">
                  {step.desc}
                </p>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-3 right-0 w-full h-px bg-slate-100 -z-10 translate-x-1/2"></div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 border-b border-slate-100 pb-8">
          {/* Eligibility Section */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-8 bg-slate-900"></span>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">
                Eligibility & Guidelines
              </h2>
            </div>
            <div className="space-y-6">
              {[
                "Items must be returned in their original condition: unworn, unwashed, and undamaged.",
                "The original 'Moha' security tag must be intact and attached to the garment.",
                "All original packaging, including dust bags and hangers, must be included.",
                "Invoices and authenticity cards must be returned with the product.",
                "Exchanges are subject to stock availability at the time of processing.",
                "Reverse pickup is complimentary for the first exchange request.",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="text-[10px] font-bold text-slate-300 mt-1">
                    0{i + 1}
                  </span>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Damage & Claims */}
          <section className="space-y-12">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <span className="h-px w-8 bg-slate-900"></span>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">
                  Damage Claims
                </h2>
              </div>
              <div className="p-8 border border-slate-100 rounded-lg">
                <div className="flex items-center gap-3 mb-4 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Report Within 24 Hours
                  </span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  If you receive a package that is tampered with or an item that
                  is damaged, please record an unboxing video. This is mandatory
                  for insurance claims.
                </p>
                <p className="text-xs text-slate-400 italic">
                  Note: Hand-woven variations in weave, color, and texture are
                  characteristic of artisanal craftsmanship and are not
                  considered defects.
                </p>
              </div>
            </div>

            {/* International Returns */}
            {/* <div>
              <div className="flex items-center gap-3 mb-8">
                <span className="h-px w-8 bg-slate-900"></span>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">
                  International Policy
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <Globe className="w-4 h-4 text-slate-400 mt-1" />
                  <p className="text-sm text-slate-500 leading-relaxed">
                    We currently do not offer free reverse pickups for
                    international orders. Shipping costs for returns/exchanges
                    are borne by the customer.
                  </p>
                </div>
                <div className="flex gap-4 items-start">
                  <CreditCard className="w-4 h-4 text-slate-400 mt-1" />
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Customs duties and local taxes paid at the time of delivery
                    are non-refundable.
                  </p>
                </div>
              </div>
            </div> */}
          </section>
        </div>

        {/* Detailed FAQ Section */}
        <section className="border-b border-slate-100 pb-8">
          <div className="flex items-center gap-3 mb-10">
            <span className="h-px w-8 bg-slate-900"></span>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">
              Common Questions
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                Can I cancel my order?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Orders can be cancelled within 12 hours of placement, provided
                they haven't been dispatched. A full refund will be processed to
                your original payment method.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                How do Store Credits work?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                If you choose store credit, we issue a digital voucher valid for
                1 year. This can be applied to any future purchase on our
                website.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                What if I bought from a Sale?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Items purchased during a flash sale or 'Clearance' are
                considered final sale. We only offer size exchanges for these
                items, subject to availability.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                How do I track my return?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Once the courier picks up your return, we will email you the
                tracking number. You can also see the status in the 'My Account'
                section.
              </p>
            </div>
          </div>
        </section>

        {/* Minimal Footer Contact */}
        <footer className="text-center">
          <p className="text-xs text-slate-400 mb-6 uppercase tracking-widest">
            Questions regarding a specific order?
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <a
              href="mailto:care@mohaweaves.com"
              className="inline-block px-10 py-4 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-slate-800 transition-colors"
            >
              Email Care Team
            </a>
            <a
              href="#"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900 border-b border-slate-900 pb-1"
            >
              View Order History
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
