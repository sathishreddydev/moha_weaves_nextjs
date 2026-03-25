import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

interface UsePerformanceMonitorReturn {
  startMeasure: (name: string) => void;
  endMeasure: (name: string) => number;
  getMetrics: () => PerformanceMetrics[];
  clearMetrics: () => void;
}

export const usePerformanceMonitor = (): UsePerformanceMonitorReturn => {
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  const startMeasure = (name: string) => {
    const startTime = performance.now();
    metricsRef.current.push({ name, startTime });
  };

  const endMeasure = (name: string): number => {
    const endTime = performance.now();
    const metric = metricsRef.current.find(m => m.name === name && !m.endTime);
    
    if (metric) {
      metric.endTime = endTime;
      metric.duration = endTime - metric.startTime;
      
      // Log performance metrics
      if (process.env.NODE_ENV === 'development') {
        console.log(`Performance: ${name} took ${metric.duration.toFixed(2)}ms`);
      }
      
      // Send to monitoring service in production
      if (process.env.NODE_ENV === 'production') {
        sendToMonitoringService(metric);
      }
      
      return metric.duration;
    }
    
    return 0;
  };

  const getMetrics = (): PerformanceMetrics[] => {
    return metricsRef.current;
  };

  const clearMetrics = (): void => {
    metricsRef.current = [];
  };

  // Send metrics to monitoring service
  const sendToMonitoringService = async (metric: PerformanceMetrics) => {
    try {
      await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: metric.name,
          duration: metric.duration,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  };

  // Monitor page load performance
  useEffect(() => {
    const handlePageLoad = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const pageLoadMetrics = {
          name: 'page-load',
          startTime: 0,
          endTime: navigation.loadEventEnd,
          duration: navigation.loadEventEnd - navigation.fetchStart,
        };

        if (process.env.NODE_ENV === 'development') {
          console.log('Page load time:', pageLoadMetrics.duration.toFixed(2) + 'ms');
        }

        if (process.env.NODE_ENV === 'production') {
          sendToMonitoringService(pageLoadMetrics);
        }
      }
    };

    if (document.readyState === 'complete') {
      handlePageLoad();
    } else {
      window.addEventListener('load', handlePageLoad);
      return () => window.removeEventListener('load', handlePageLoad);
    }
  }, []);

  return {
    startMeasure,
    endMeasure,
    getMetrics,
    clearMetrics,
  };
};
