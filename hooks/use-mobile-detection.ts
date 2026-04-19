"use client";

import { useState, useEffect } from "react";

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const updateDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      
      // Mobile: < 768px
      // Tablet: 768px - 1024px
      // Desktop: > 1024px
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width <= 1024);
      setIsDesktop(width > 1024);
    };

    updateDevice();
    
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenSize,
    isSmallMobile: screenSize.width < 640,
    isLargeMobile: screenSize.width >= 640 && screenSize.width < 768,
    isSmallTablet: screenSize.width >= 768 && screenSize.width < 896,
    isLargeTablet: screenSize.width >= 896 && screenSize.width <= 1024,
  };
}

// Hook for mobile-specific features
export function useMobileFeatures() {
  const { isMobile, isTablet } = useMobileDetection();
  
  return {
    // Touch features
    hasTouch: typeof window !== 'undefined' && 'ontouchstart' in window,
    
    // Device capabilities
    isTouchDevice: isMobile || isTablet,
    
    // Layout preferences
    shouldUseMobileLayout: isMobile,
    shouldUseTabletLayout: isTablet,
    
    // Interaction preferences
    prefersReducedMotion: typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    
    // Network conditions
    isSlowConnection: typeof window !== 'undefined' && 
      (navigator as any).connection?.effectiveType === 'slow-2g' ||
      (navigator as any).connection?.effectiveType === '2g',
    
    // Battery optimization
    isLowBattery: typeof window !== 'undefined' && 
      (navigator as any).getBattery?.().then((battery: any) => battery.level < 0.2),
  };
}
