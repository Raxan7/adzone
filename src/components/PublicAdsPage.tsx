import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Grid, List, TrendingUp, Pause, Play } from 'lucide-react';
import { AdCard } from './AdCard';
import { Ad } from '../types/Ad';
import { db } from '../services/database';
import { useLazyLoading } from '../hooks/useLazyLoading';

const AUTO_SCROLL_SPEED = 200; // pixels per second

export const PublicAdsPage: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [shuffledAllAds, setShuffledAllAds] = useState<Ad[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  const autoScrollFrameRef = useRef<number | null>(null);
  const autoScrollLastTimeRef = useRef<number | null>(null);
  const isAutoScrollingRef = useRef(false);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    loadAdsData();
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current !== null) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
    autoScrollLastTimeRef.current = null;
    isAutoScrollingRef.current = false;
  }, []);

  const startAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current !== null) return;

    isAutoScrollingRef.current = true;
    autoScrollLastTimeRef.current = null;

    const step = (timestamp: number) => {
      if (!isAutoScrollingRef.current) {
        autoScrollFrameRef.current = null;
        return;
      }

      if (autoScrollLastTimeRef.current === null) {
        autoScrollLastTimeRef.current = timestamp;
      }

      const delta = timestamp - autoScrollLastTimeRef.current;
      autoScrollLastTimeRef.current = timestamp;
      const distance = (AUTO_SCROLL_SPEED * delta) / 1000;

      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const clientHeight = window.innerHeight;

      if (scrollTop + clientHeight >= scrollHeight - 10) {
        stopAutoScroll();
        setIsAutoScrolling(false);
        return;
      }

      window.scrollBy(0, distance);

      autoScrollFrameRef.current = requestAnimationFrame(step);
    };

    autoScrollFrameRef.current = requestAnimationFrame(step);
  }, [stopAutoScroll]);

  const toggleAutoScroll = useCallback(() => {
    setIsAutoScrolling(prev => {
      const next = !prev;
      if (next) {
        setHasUserScrolled(false);
      } else {
        stopAutoScroll();
      }
      return next;
    });
  }, [stopAutoScroll]);

  // Detect user scrolling
  useEffect(() => {
    const markUserInteraction = () => {
      setHasUserScrolled(true);
      if (isAutoScrollingRef.current) {
        setIsAutoScrolling(false);
        stopAutoScroll();
      }
    };

    const handleScroll = () => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (isAutoScrollingRef.current) {
        lastScrollTop.current = currentScrollTop;
        return;
      }

      if (Math.abs(currentScrollTop - lastScrollTop.current) > 5) {
        markUserInteraction();
      }

      lastScrollTop.current = currentScrollTop;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const keysThatScroll = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Space', 'Home', 'End'];
      if (keysThatScroll.includes(event.key)) {
        markUserInteraction();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', markUserInteraction, { passive: true });
    window.addEventListener('touchstart', markUserInteraction, { passive: true });
    window.addEventListener('pointerdown', markUserInteraction);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', markUserInteraction);
      window.removeEventListener('touchstart', markUserInteraction);
      window.removeEventListener('pointerdown', markUserInteraction);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [stopAutoScroll]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      stopAutoScroll();
    };
  }, [stopAutoScroll]);

  const loadAdsData = async () => {
    try {
      const adsData = await db.getAllAds();
      setAds(adsData);
      // Shuffle once when ads data is loaded to keep ordering stable across renders
      const shuffled = [...adsData];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setShuffledAllAds(shuffled);
    } catch (error) {
      console.error('Failed to load ads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use the stable shuffledAllAds as the base order, then filter it for search
  const filteredAds = shuffledAllAds.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Use the filteredAds directly (they're already in a stable shuffled order)
  const shuffledAds = filteredAds;

  // Use lazy loading for the shuffled ads
  const {
    visibleItems: visibleAds,
    isLoading: isLoadingMore,
    hasMore,
    observerRef
  } = useLazyLoading(shuffledAds, {
    itemsPerPage: 8, // Load 8 ads initially, then 8 more each time
    rootMargin: '200px' // Start loading when user is 200px away from the trigger
  });

  useEffect(() => {
    if (!isAutoScrolling || hasUserScrolled || loading) {
      stopAutoScroll();
      return;
    }

    if (visibleAds.length === 0) {
      return;
    }

    startAutoScroll();

    return () => {
      stopAutoScroll();
    };
  }, [isAutoScrolling, hasUserScrolled, loading, visibleAds.length, startAutoScroll, stopAutoScroll]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Chuosmart Ads Zone
                </h1>
                <p className="text-gray-600 text-sm">Discover amazing deals from the online world</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAutoScroll}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
                title={isAutoScrolling ? "Pause auto-scroll" : "Resume auto-scroll"}
              >
                {isAutoScrolling ? <Pause size={20} /> : <Play size={20} />}
                <span className="text-sm hidden sm:inline">
                  {isAutoScrolling ? 'Pause' : 'Resume'}
                </span>
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for products and services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {ads.length === 0 ? 'No Products Available' : 
             searchTerm ? `${shuffledAds.length} Search Result${shuffledAds.length === 1 ? '' : 's'}` :
             `${shuffledAds.length} Product${shuffledAds.length === 1 ? '' : 's'} Available`}
          </h3>
          {visibleAds.length < shuffledAds.length && (
            <p className="text-sm text-gray-500">
              Showing {visibleAds.length} of {shuffledAds.length} products
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading ads...</h3>
            <p className="text-gray-600">Please wait while we fetch the latest deals</p>
          </div>
        ) : shuffledAds.length > 0 ? (
          <>
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
            }>
              {visibleAds.map(ad => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </div>

            {/* Loading trigger and more content indicator */}
            {hasMore && (
              <div ref={observerRef} className="py-8">
                {isLoadingMore ? (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="text-gray-600">Loading more ads...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-sm text-gray-500">Scroll to load more</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            {ads.length === 0 ? (
              <>
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="text-blue-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to AdZone!</h3>
                <p className="text-gray-600">No ads have been added yet. Check back later for amazing deals!</p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="text-gray-400" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your search terms</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};