import LegalPage from "@/components/layout/LegalPage";

export default function PrivacyPage() {
  const privacyContent = [
    {
      heading: "Information Collection",
      body: "We collect information you provide directly to us when you create an account, make a purchase, or subscribe to our newsletter. This includes your name, email, and shipping address.",
    },
    {
      heading: "Data Security",
      body: "The security of your personal information is important to us. We implement industry-standard encryption and security protocols to protect your data from unauthorized access.",
    },
    {
      heading: "Cookie Policy",
      body: "We use cookies to enhance your browsing experience and analyze site traffic. You can choose to disable cookies through your browser settings, though some site features may be affected.",
    },
  ];
  return <LegalPage title="Privacy Policy" content={privacyContent} />;
}
