"use client";
import React, { useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Truck,
  RefreshCw,
  CreditCard,
  Star,
  Mail,
  MessageCircle,
  MapPin,
  ShieldCheck,
  AlertCircle,
  XCircle,
  FileText,
} from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  category: string;
  icon: React.ComponentType<any>;
  questions: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    category: "Order Management",
    icon: ShoppingBag,
    questions: [
      {
        q: "How can I track the status of my order?",
        a: "You can track your order in real-time by logging into your account and visiting the 'Order History' section. Once dispatched, you will also receive a tracking link via email and SMS.",
      },
      {
        q: "Can I modify my shipping address after placing an order?",
        a: "Address modifications are possible only if the order hasn't been dispatched. Please contact our support team within 12 hours of placing your order for any changes.",
      },
      {
        q: "How do I know my size for a specific silhouette?",
        a: "We provide a detailed Size Guide on every product page. Since our silhouettes range from relaxed to fitted, we recommend checking the 'Garment Measurements' specifically.",
      },
    ],
  },
  {
    category: "Cancellation Policy",
    icon: XCircle,
    questions: [
      {
        q: "What is your cancellation window?",
        a: "Orders can be cancelled within 12 hours of placement for a full refund. Beyond 12 hours, we begin the artisanal production process, and cancellations may not be possible.",
      },
      {
        q: "How is the refund processed for a cancelled order?",
        a: "For cancelled orders, the refund is initiated immediately to your original payment method. It typically reflects in your account within 5-7 business days.",
      },
    ],
  },
  {
    category: "Returns & Exchanges",
    icon: RefreshCw,
    questions: [
      {
        q: "How do I initiate a return or exchange?",
        a: "Go to 'Order History' in your account, select the item you wish to return/exchange, and click 'Raise Request'. Our team will review and approve it within 24-48 hours.",
      },
      {
        q: "Is there a time limit for returns?",
        a: "Yes, all return or exchange requests must be initiated within 7 days of delivery. The product must be unworn with all tags and security seals intact.",
      },
      {
        q: "Are sale items eligible for returns?",
        a: "Items purchased during a 'Final Sale' or 'Clearance' are eligible for size exchanges or store credit only, unless received in a damaged condition.",
      },
    ],
  },
  {
    category: "Refund Processing",
    icon: CreditCard,
    questions: [
      {
        q: "When will I receive my refund for a returned item?",
        a: "Once your return reaches our warehouse and passes the quality audit (usually 2 business days), we initiate the refund. It takes 7-10 days to appear in your bank statement.",
      },
      {
        q: "Can I get a refund in the form of store credit?",
        a: "Absolutely. You can opt for 'Moha Credit' which is issued instantly after the quality check and is valid for 12 months on any future purchase.",
      },
    ],
  },
  {
    category: "Delivery Issues",
    icon: AlertCircle,
    questions: [
      {
        q: "What should I do if my package is tampered with?",
        a: "Do not accept delivery of a tampered package. If you have already accepted it, please record an unboxing video and contact us within 24 hours.",
      },
      {
        q: "My tracking says 'Delivered' but I haven't received it.",
        a: "Please check with your building security or concierge first. If it's still missing, notify us within 24 hours so we can escalate a claim with our courier partner.",
      },
    ],
  },
  {
    category: "Warranty & Craftsmanship",
    icon: ShieldCheck,
    questions: [
      {
        q: "Do you offer a warranty on your garments?",
        a: "We take pride in our quality. We offer a 6-month repair warranty on manufacturing defects like seam stress or hardware failure. This does not cover natural wear and tear or improper washing.",
      },
      {
        q: "Why does my hand-woven fabric have slight irregularities?",
        a: "Slubs and slight variations in weave or color are the hallmark of authentic hand-woven textiles. They are not defects, but evidence of the human hand at work.",
      },
    ],
  },
  {
    category: "General Terms",
    icon: FileText,
    questions: [
      {
        q: "Do you offer international shipping?",
        a: "Yes, we ship worldwide. Duties and taxes are governed by your local government and are to be borne by the customer at the time of delivery.",
      },
      {
        q: "Can I use multiple discount codes?",
        a: "Only one promotional code can be applied per order. Discount codes cannot be combined with existing store credits or other offers.",
      },
    ],
  },
];

const FAQItem = ({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) => (
  <div className="border-b border-slate-100 last:border-0">
    <button
      onClick={onClick}
      className="w-full py-6 flex justify-between items-center text-left group"
    >
      <span
        className={`text-sm font-medium transition-colors ${isOpen ? "text-slate-900" : "text-slate-600 group-hover:text-slate-900"}`}
      >
        {question}
      </span>
      {isOpen ? (
        <ChevronUp className="w-4 h-4 text-slate-900 shrink-0" />
      ) : (
        <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-slate-900 shrink-0 transition-colors" />
      )}
    </button>
    {isOpen && (
      <div className="pb-8 pr-12">
        <p className="text-sm text-slate-500 leading-relaxed italic border-l-2 border-slate-100 pl-4">
          {answer}
        </p>
      </div>
    )}
  </div>
);

export default function FAQsPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (catIdx: number, qIdx: number) => {
    const key = `${catIdx}-${qIdx}`;
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased">
      <main className="max-w-5xl mx-auto py-12 space-y-12">
        {/* Header */}
        <header className="border-b border-slate-100 pb-8 max-w-3xl">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">
            Support Center
          </h2>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            A comprehensive guide to Moha Weaves services. From order tracking
            to artisanal care, find everything you need to know below.
          </p>
        </header>

        {/* FAQ Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 border-b border-slate-100 pb-8">
          {/* Navigation/Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-12 h-fit">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-900 mb-6">
              Policy Directory
            </h3>
            <nav className="space-y-4">
              {faqData.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSection(`cat-${idx}`)}
                  className="flex items-center gap-3 text-[11px] text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-wider font-bold w-full text-left"
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.category}
                </button>
              ))}
            </nav>

            <div className="pt-12 border-t border-slate-50 mt-12">
              <div className="p-6 bg-slate-50 rounded-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900 mb-2">
                  Concierge Access
                </p>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Available Mon-Sat for styling and order assistance.
                </p>
                <a
                  href="#"
                  className="text-[10px] font-bold uppercase tracking-widest border-b border-slate-900 pb-0.5"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-24">
            {faqData.map((category, catIdx) => (
              <section
                key={catIdx}
                id={`cat-${catIdx}`}
                className="scroll-mt-12"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-2 bg-slate-900 text-white rounded-sm">
                    <category.icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-900">
                    {category.category}
                  </h2>
                </div>
                <div className="border-t border-slate-100">
                  {category.questions.map((item, qIdx) => (
                    <FAQItem
                      key={qIdx}
                      question={item.q}
                      answer={item.a}
                      isOpen={!!openItems[`${catIdx}-${qIdx}`]}
                      onClick={() => toggleItem(catIdx, qIdx)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Bottom Contact Us Section */}
        <section id="contact-us" className="text-center">
          <p className="text-[10px] text-slate-400 mb-8 uppercase tracking-[0.3em] font-bold">
            Still Need Assistance?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            <div className="group cursor-pointer">
              <div className="w-12 h-12 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-slate-900 group-hover:text-white transition-all">
                <Mail className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1">
                Email Care
              </p>
              <p className="text-[11px] text-slate-500">care@mohaweaves.com</p>
            </div>
            <div className="group cursor-pointer">
              <div className="w-12 h-12 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-slate-900 group-hover:text-white transition-all">
                <MessageCircle className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1">
                WhatsApp
              </p>
              <p className="text-[11px] text-slate-500">+91 74984 76544</p>
            </div>
            <div className="group cursor-pointer">
              <div className="w-12 h-12 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-slate-900 group-hover:text-white transition-all">
                <MapPin className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1">
                Atelier
              </p>
              <p className="text-[11px] text-slate-500">Bangalore, India</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
