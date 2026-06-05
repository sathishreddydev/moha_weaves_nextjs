import {
  ArrowRight,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Truck,
} from "lucide-react";

export default function ContactPage() {
  return (
    <div>
      <main className="max-w-5xl mx-auto space-y-12">
        <header className="border-b border-slate-100 pb-8">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            Contact Us
          </h1>
          <p className="text-slate-500 text-xs leading-relaxed">
            We&apos;re here to help you Monday through Saturday, 10:00 — 18:30 Hrs.
          </p>
        </header>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 gap-x-12 border-b border-slate-100 pb-8">
          {/* WhatsApp */}
          <div className="group">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-slate-400" /> WhatsApp
            </h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Chat with our support team — no bots, just helpful humans.
            </p>
            <a
              href="https://wa.me/917498476544"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 hover:gap-3 transition-all"
            >
              Let&apos;s chat <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Call Us */}
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" /> Call Us
            </h2>
            <p className="text-xs text-slate-500 mb-1 leading-relaxed">
              Mon — Sat | 10:00 — 18:30 Hrs
            </p>
            <p className="text-xs font-bold text-slate-900 mb-4">
              +91 74984 76544
            </p>
            <a
              href="tel:+917498476544"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 hover:gap-3 transition-all"
            >
              Call Now <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Email */}
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" /> Email
            </h2>
            <p className="text-xs text-slate-500 mb-1 leading-relaxed">
              We respond within 24 hours.
            </p>
            <p className="text-xs font-bold text-slate-900 mb-4">
              care@urumibymounika.com
            </p>
            <a
              href="mailto:care@urumibymounika.com"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 hover:gap-3 transition-all"
            >
              Send Email <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Track Order + Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-slate-100 pb-8">
          {/* Track Order */}
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-400" /> Track Your Order
            </h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Log into your account to track your order in real-time. Once
              dispatched, you&apos;ll receive a tracking link via email and SMS.
            </p>
            <a
              href="/my/orders"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 hover:gap-3 transition-all"
            >
              View Orders <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" /> Our Location
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-2">
              Urumi Atelier, <br />
              Indiranagar, 2nd Stage, <br />
              Bangalore, Karnataka — 560038
            </p>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              Visits are by appointment only.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
