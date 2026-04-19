"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, ArrowLeft } from "lucide-react";
import ProfileSidebar from "./ProfileSidebar";
import MobileNavigation from "@/components/ui/mobile-navigation";
import { MobileMenuButton } from "@/components/ui/mobile-navigation";
import { useSwipeToToggleMenu, useSwipeToGoBack } from "@/hooks/use-swipe-gesture";

interface MobileProfileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  onBack?: () => void;
}

export default function MobileProfileLayout({
  children,
  title,
  showBackButton = false,
  showMenuButton = true,
  onBack,
}: MobileProfileLayoutProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Swipe gestures
  const swipeMenuRef = useSwipeToToggleMenu(
    () => setIsMenuOpen(true),  // Swipe left to open menu
    () => setIsMenuOpen(false) // Swipe right to close menu
  ) as React.RefObject<HTMLDivElement>;

  const swipeBackRef = useSwipeToGoBack(() => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }) as React.RefObject<HTMLButtonElement>;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuItemClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white lg:hidden" ref={swipeMenuRef}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 touch-manipulation active:scale-95 transition-transform"
                ref={swipeBackRef}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {title && (
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            )}
          </div>
          
          {showMenuButton && (
            <MobileMenuButton
              onClick={handleMenuToggle}
              isOpen={isMenuOpen}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-16">
        {children}
      </main>

      {/* Mobile Navigation Menu */}
      <MobileNavigation
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title="Menu"
      >
        <div className="p-4">
          <ProfileSidebar activeSection="" onItemClick={handleMenuItemClick} />
        </div>
      </MobileNavigation>
    </div>
  );
}
