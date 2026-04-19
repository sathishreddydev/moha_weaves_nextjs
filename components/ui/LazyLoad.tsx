"use client";

import { useState, useEffect, useRef, ReactNode } from "react";

interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
}

export default function LazyLoad({
  children,
  fallback = null,
  rootMargin = "50px",
  threshold = 0.1,
  className = "",
}: LazyLoadProps) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsIntersecting(true);
          setHasLoaded(true);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [rootMargin, threshold, hasLoaded]);

  return (
    <div ref={elementRef} className={className}>
      {isIntersecting ? children : fallback}
    </div>
  );
}

// Higher-order component for lazy loading any component
export function withLazyLoad<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  rootMargin?: string
) {
  return function LazyComponent(props: P) {
    return (
      <LazyLoad fallback={fallback} rootMargin={rootMargin}>
        <Component {...props} />
      </LazyLoad>
    );
  };
}
