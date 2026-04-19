"use client";

import { useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export default function PullToRefresh({ 
  onRefresh, 
  children, 
  className = "" 
}: PullToRefreshProps) {
  const {
    containerRef,
    bindEvents,
    isPulling,
    pullDistance,
    isRefreshing,
    shouldRefresh,
  } = usePullToRefresh({ onRefresh });

  useEffect(() => {
    return bindEvents();
  }, [bindEvents]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Pull to refresh indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-white border-b border-gray-100 z-50 transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${
            isPulling ? Math.max(0, pullDistance - 60) : -60
          }px)`,
          opacity: isPulling ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 py-3">
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          ) : (
            <RefreshCw 
              className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                shouldRefresh ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          )}
          <span className="text-sm text-gray-600">
            {isRefreshing ? 'Refreshing...' : shouldRefresh ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div 
        className="transition-transform duration-200 ease-out"
        style={{
          transform: isPulling ? `translateY(${Math.min(pullDistance, 60)}px)` : 'translateY(0)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
