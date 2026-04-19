"use client";

import { useRef, useEffect, useCallback } from "react";

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  restraint?: number;
  allowedTime?: number;
}

export function useSwipeGesture(options: SwipeGestureOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    restraint = 100,
    allowedTime = 300,
  } = options;

  const touchRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    distX: number;
    distY: number;
    elapsedTime: number;
  }>({
    startX: 0,
    startY: 0,
    startTime: 0,
    distX: 0,
    distY: 0,
    elapsedTime: 0,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touchobj = e.changedTouches[0];
    touchRef.current = {
      startX: touchobj.pageX,
      startY: touchobj.pageY,
      startTime: new Date().getTime(),
      distX: 0,
      distY: 0,
      elapsedTime: 0,
    };
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const touchobj = e.changedTouches[0];
    const distX = touchobj.pageX - touchRef.current.startX;
    const distY = touchobj.pageY - touchRef.current.startY;
    const elapsedTime = new Date().getTime() - touchRef.current.startTime;

    if (elapsedTime <= allowedTime) {
      if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
        // Horizontal swipe
        if (distX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) {
        // Vertical swipe
        if (distY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, restraint, allowedTime]);

  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return elementRef;
}

// Hook for swipe to go back
export function useSwipeToGoBack(onSwipe: () => void) {
  return useSwipeGesture({
    onSwipeRight: onSwipe,
    threshold: 30,
  });
}

// Hook for swipe to open/close menu
export function useSwipeToToggleMenu(onSwipeLeft: () => void, onSwipeRight: () => void) {
  return useSwipeGesture({
    onSwipeLeft,
    onSwipeRight,
    threshold: 30,
  });
}
