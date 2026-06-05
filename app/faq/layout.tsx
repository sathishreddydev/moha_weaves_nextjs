import { Metadata } from "next";
import FAQSchema from "@/components/seo/FAQSchema";

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions | Urumi",
  description:
    "Find answers to common questions about orders, shipping, returns, exchanges, refunds, and more at Urumi.",
  alternates: {
    canonical: "/faq",
  },
};

// All FAQ data for schema (must match the client component)
const allFaqs = [
  { question: "How can I track the status of my order?", answer: "You can track your order in real-time by logging into your account and visiting the 'Order History' section. Once dispatched, you will also receive a tracking link via email and SMS." },
  { question: "Can I modify my shipping address after placing an order?", answer: "Address modifications are possible only if the order hasn't been dispatched. Please contact our support team within 12 hours of placing your order for any changes." },
  { question: "How do I know my size for a specific silhouette?", answer: "We provide a detailed Size Guide on every product page. Since our silhouettes range from relaxed to fitted, we recommend checking the 'Garment Measurements' specifically." },
  { question: "What is your cancellation window?", answer: "Orders can be cancelled within 12 hours of placement for a full refund. Beyond 12 hours, we begin the artisanal production process, and cancellations may not be possible." },
  { question: "How is the refund processed for a cancelled order?", answer: "For cancelled orders, the refund is initiated immediately to your original payment method. It typically reflects in your account within 5-7 business days." },
  { question: "How do I initiate a return or exchange?", answer: "Go to 'Order History' in your account, select the item you wish to return/exchange, and click 'Raise Request'. Our team will review and approve it within 24-48 hours." },
  { question: "Is there a time limit for returns?", answer: "Yes, all return or exchange requests must be initiated within 7 days of delivery. The product must be unworn with all tags and security seals intact." },
  { question: "Are sale items eligible for returns?", answer: "Items purchased during a 'Final Sale' or 'Clearance' are eligible for size exchanges or store credit only, unless received in a damaged condition." },
  { question: "When will I receive my refund for a returned item?", answer: "Once your return reaches our warehouse and passes the quality audit (usually 2 business days), we initiate the refund. It takes 7-10 days to appear in your bank statement." },
  { question: "Can I get a refund in the form of store credit?", answer: "Absolutely. You can opt for 'Urumi Credit' which is issued instantly after the quality check and is valid for 12 months on any future purchase." },
  { question: "What should I do if my package is tampered with?", answer: "Do not accept delivery of a tampered package. If you have already accepted it, please record an unboxing video and contact us within 24 hours." },
  { question: "My tracking says 'Delivered' but I haven't received it.", answer: "Please check with your building security or concierge first. If it's still missing, notify us within 24 hours so we can escalate a claim with our courier partner." },
  { question: "Do you offer a warranty on your garments?", answer: "We take pride in our quality. We offer a 6-month repair warranty on manufacturing defects like seam stress or hardware failure. This does not cover natural wear and tear or improper washing." },
  { question: "Why does my hand-woven fabric have slight irregularities?", answer: "Slubs and slight variations in weave or color are the hallmark of authentic hand-woven textiles. They are not defects, but evidence of the human hand at work." },
  { question: "Do you offer international shipping?", answer: "Yes, we ship worldwide. Duties and taxes are governed by your local government and are to be borne by the customer at the time of delivery." },
  { question: "Can I use multiple discount codes?", answer: "Only one promotional code can be applied per order. Discount codes cannot be combined with existing store credits or other offers." },
];

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FAQSchema faqs={allFaqs} />
      {children}
    </>
  );
}
