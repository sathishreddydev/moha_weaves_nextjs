"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseInfiniteScrollProps<T> {
  fetchMore: (page: number) => Promise<T[]>;
  initialData?: T[];
  threshold?: number;
  hasMore?: boolean;
}

export function useInfiniteScroll<T>({
  fetchMore,
  initialData = [],
  threshold = 100,
  hasMore: initialHasMore = true,
}: UseInfiniteScrollProps<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMoreItems, setHasMoreItems] = useState(initialHasMore);
  
  const observer = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMoreItems) return;

    setLoading(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const newItems = await fetchMore(nextPage);
      
      if (newItems.length === 0) {
        setHasMoreItems(false);
      } else {
        setData(prev => [...prev, ...newItems]);
        setPage(nextPage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more items');
    } finally {
      setLoading(false);
    }
  }, [loading, hasMoreItems, page, fetchMore]);

  const reset = useCallback(() => {
    setData(initialData);
    setPage(1);
    setLoading(false);
    setError(null);
    setHasMoreItems(initialHasMore);
  }, [initialData, initialHasMore]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    observer.current = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && !loading && hasMoreItems) {
        loadMore();
      }
    }, options);

    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observer.current && loadMoreRef.current) {
        observer.current.unobserve(loadMoreRef.current);
      }
    };
  }, [loadMore, loading, hasMoreItems]);

  return {
    data,
    loading,
    error,
    hasMore: hasMoreItems,
    loadMoreRef,
    loadMore,
    reset,
  };
}
