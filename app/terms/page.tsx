import LegalPage from "@/components/layout/LegalPage";

export default function TermsPage() {
  const termsContent = [
    {
      heading: "Order Acceptance",
      body: "Receipt of an electronic order confirmation does not signify our acceptance of your order. We reserve the right to decline any order for any reason.",
    },
    {
      heading: "Artisanal Nature",
      body: "Due to the hand-woven nature of our products, slight variations in color and weave are expected and celebrated as marks of authenticity.",
    },
    {
      heading: "Intellectual Property",
      body: "All content on this site, including designs, text, and graphics, is the exclusive property of Moha Weaves and protected by international copyright laws.",
    },
  ];
  return <LegalPage title="Terms of Service" content={termsContent} />;
}
