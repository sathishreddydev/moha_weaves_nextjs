import { ArrowRight, Minus } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-50 text-slate-900 border-t border-slate-200 px-10 overflow-hidden">
      <div className="max-w-7xl mx-auto py-8">
        {/* Brand Anchor */}
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-16 gap-8">
          <h2 className="text-6xl md:text-8xl font-light tracking-tighter uppercase opacity-10">
            Moha
          </h2>

          <div className="flex items-center gap-4 group cursor-pointer">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500 group-hover:text-slate-900 transition-colors">
              Join The Artisanal Journal
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-2 transition-transform" />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-8 lg:gap-4 mb-12">
          {/* Links */}
          <div className="lg:col-span-6 flex flex-col md:flex-row gap-12 md:gap-24">
            {/* Quick Links */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <Minus className="w-4 h-4 text-slate-500" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">
                  Quick Links
                </h4>
              </div>

              <nav className="flex flex-col gap-5">
                <Link
                  href="/collections"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:tracking-widest transition-all duration-300"
                >
                  Collections
                </Link>
                <Link
                  href="/categories"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:tracking-widest transition-all duration-300"
                >
                  Categories
                </Link>
                <Link
                  href="/sales"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:tracking-widest transition-all duration-300"
                >
                  Sales & Offers
                </Link>
                <Link
                  href="/about"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:tracking-widest transition-all duration-300"
                >
                  About Us
                </Link>
              </nav>
            </div>

            {/* Customer Service */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <Minus className="w-4 h-4 text-slate-500" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">
                  Customer Service
                </h4>
              </div>

              <nav className="flex flex-col gap-5">
                <Link
                  href="/contact"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:tracking-widest transition-all duration-300"
                >
                  Contact Us
                </Link>
                <Link
                  href="/shipping-policy"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:tracking-widest transition-all duration-300"
                >
                  Shipping Policy
                </Link>
                <Link
                  href="/returns-exchange-policy"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:tracking-widest transition-all duration-300"
                >
                  Returns & Exchanges
                </Link>
                <Link
                  href="/faq"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:tracking-widest transition-all duration-300"
                >
                  FAQ
                </Link>
              </nav>
            </div>
          </div>

          {/* Philosophy */}
          <div className="lg:col-span-6 lg:border-l lg:border-slate-200 lg:pl-24 flex flex-col justify-center">
            <p className="text-2xl font-light leading-snug tracking-tight text-slate-900 italic mb-8">
              Preserving the rhythm of the{" "}
              <span className="underline decoration-slate-300 underline-offset-8">
                hand-loom
              </span>{" "}
              for a modern world.
            </p>

            <div className="flex gap-8">
              <Link
                href="#"
                className="text-[10px] font-bold uppercase tracking-widest text-slate-700 border-b border-transparent hover:border-slate-900 transition-all pb-1"
              >
                Instagram
              </Link>

              <Link
                href="#"
                className="text-[10px] font-bold uppercase tracking-widest text-slate-700 border-b border-transparent hover:border-slate-900 transition-all pb-1"
              >
                Facebook
              </Link>

              <Link
                href="#"
                className="text-[10px] font-bold uppercase tracking-widest text-slate-700 border-b border-transparent hover:border-slate-900 transition-all pb-1"
              >
                Twitter
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-500 italic">
            Hyderabad — Telangana
          </p>
          <div className="flex gap-12 items-center">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">
              © 2026 Moha Weaves
            </span>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-[9px] text-slate-600 hover:text-slate-900 uppercase tracking-widest transition-colors font-bold"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-[9px] text-slate-600 hover:text-slate-900 uppercase tracking-widest transition-colors font-bold"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
