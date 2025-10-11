import { useState, useEffect, useRef } from 'react';

interface UseLazyIframeOptions {
  rootMargin?: string;
  threshold?: number;
}

export function useLazyIframe(options: UseLazyIframeOptions = {}) {
  const { rootMargin = '50px', threshold = 0.1 } = options;
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return {
    elementRef,
    isVisible,
    isLoaded,
    handleLoad
  };
}