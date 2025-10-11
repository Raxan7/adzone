import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyLoadingOptions {
  itemsPerPage?: number;
  rootMargin?: string;
  threshold?: number;
}

export function useLazyLoading<T>(
  items: T[],
  options: UseLazyLoadingOptions = {}
) {
  const {
    itemsPerPage = 8,
    rootMargin = '100px',
    threshold = 0.1
  } = options;

  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const prevItemsRef = useRef<T[] | null>(null);

  // Reset when items change, but avoid resetting if content/order didn't meaningfully change
  useEffect(() => {
    const sameItems = prevItemsRef.current && prevItemsRef.current.length === items.length && prevItemsRef.current.every((v, i) => v === items[i]);

    if (sameItems) {
      // If items are the same array content-wise, keep visibleItems as-is and just recompute hasMore
      setHasMore(items.length > visibleItems.length);
    } else {
      const initialItems = items.slice(0, itemsPerPage);
      setVisibleItems(initialItems);
      setHasMore(items.length > initialItems.length);
    }

    prevItemsRef.current = items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, itemsPerPage]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    // Simulate loading delay for smooth UX
    setTimeout(() => {
      setVisibleItems(prev => {
        const nextItems = items.slice(0, prev.length + itemsPerPage);
        const hasMoreItems = nextItems.length < items.length;
        setHasMore(hasMoreItems);
        setIsLoading(false);
        return nextItems;
      });
    }, 300);
  }, [items, itemsPerPage, isLoading, hasMore]);

  // Intersection Observer for automatic loading
  useEffect(() => {
    if (!observerRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    observer.observe(observerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [loadMore, hasMore, isLoading, rootMargin, threshold]);

  return {
    visibleItems,
    isLoading,
    hasMore,
    observerRef,
    loadMore
  };
}