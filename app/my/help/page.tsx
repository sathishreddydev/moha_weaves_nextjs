import HelpSection from "@/components/user/HelpSection";
import ProfileSidebar from "@/components/user/ProfileSidebar";

export const metadata = {
  title: "Help & Support – Moha Weaves",
  description: "Get help with your orders, returns, and account.",
};

export default function HelpPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Sidebar — desktop only */}
        <div className="hidden lg:block lg:col-span-1">
          <ProfileSidebar />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3">
          <HelpSection />
        </div>
      </div>
    </div>
  );
}
