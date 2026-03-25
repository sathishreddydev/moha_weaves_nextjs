"use client";
import { useState } from "react";
import {
  Phone,
  MessageCircle,
  FileText,
  Truck,
  MapPin,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <CheckCircle2 className="w-12 h-12 text-slate-900 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Message Received
          </h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Thank you for reaching out. Our support team will respond to your
            inquiry via email within 24 hours.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-sm font-bold uppercase tracking-widest border-b border-slate-900 pb-1 hover:text-slate-500 hover:border-slate-500 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased">
      <main className="max-w-5xl mx-auto space-y-12 py-12">
        <header className="border-b border-slate-100 pb-8 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            Contact Support
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Choose your preferred method of contact. We're here to help you
            Monday through Saturday.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 gap-x-12 max-w-5xl border-b border-slate-100 pb-8">
          {/* WhatsApp */}
          <div className="group">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-slate-400" /> WhatsApp
            </h2>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Chat with our support team — no bots, just helpful humans.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:gap-3 transition-all"
            >
              Let's chat <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Call Us */}
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" /> Call Us
            </h2>
            <p className="text-sm text-slate-500 mb-1 leading-relaxed">
              Mon — Sat | 10:00 — 18:30 Hrs
            </p>
            <p className="text-sm font-bold text-slate-900 mb-4">
              +91 74984 76544
            </p>
            <a
              href="tel:+917498476544"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:gap-3 transition-all"
            >
              Call Now <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Track Order */}
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-400" /> Track Order
            </h2>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Track your order seamlessly, every step of the way.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:gap-3 transition-all"
            >
              Track <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-8">
              Our Location
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Registered Office
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-light">
                  Moha Weaves Atelier, <br />
                  Indiranagar, 2nd Stage, <br />
                  Bangalore, Karnataka — 560038
                </p>
              </div>
              <div className="pt-4">
                <p className="text-xs text-slate-400 leading-relaxed italic">
                  Note: Visits are by appointment only to ensure we can give you
                  our full attention.
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-8">
              Get in Touch
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border-b border-slate-200 py-2 focus:border-slate-900 outline-none transition-colors text-sm"
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full border-b border-slate-200 py-2 focus:border-slate-900 outline-none transition-colors text-sm"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Subject *
                </label>
                <select className="w-full border-b border-slate-200 py-2 focus:border-slate-900 outline-none transition-colors text-sm bg-transparent appearance-none">
                  <option>Order Inquiry</option>
                  <option>Returns & Exchanges</option>
                  <option>Wholesale</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Message *
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full border-b border-slate-200 py-2 focus:border-slate-900 outline-none transition-colors text-sm resize-none"
                  placeholder="How can we help?"
                />
              </div>

              <button
                type="submit"
                className="w-full md:w-auto px-12 py-4 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-slate-800 transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
