import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, TrendingUp } from 'lucide-react';
import { Ad } from '../types/Ad';
import { db } from '../services/database';

interface AdCardProps {
  ad: Ad;
  isAdmin?: boolean;
  onEdit?: (ad: Ad) => void;
  onDelete?: (id: number) => void;
}

export const AdCard: React.FC<AdCardProps> = ({ ad, isAdmin = false, onEdit, onDelete }) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    // If already shouldLoad, nothing to do
    if (shouldLoad) return;

    // Respect reduced motion by loading as normal (don't delay)
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setShouldLoad(true);
      return;
    }

    // If IntersectionObserver is not supported, load immediately
    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
        }
      });
    }, {
      root: null,
      rootMargin: '200px', // start loading a bit before it enters
      threshold: 0.01,
    });

    obs.observe(node);

    return () => {
      obs.disconnect();
    };
  }, [shouldLoad]);

  const handleClick = async () => {
    if (!isAdmin) {
      await db.incrementAdClicks(ad.id);
      window.open(ad.smart_link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className={`group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-1 ${!isAdmin ? 'cursor-pointer hover:shadow-blue-200/50' : ''}`}
      onClick={!isAdmin ? handleClick : undefined}
    >
      {/* Iframe Preview Section */}
      <div ref={containerRef} className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border-b border-gray-200">
        {!iframeLoaded && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-gray-600">Loading preview...</p>
            </div>
          </div>
        )}
        {shouldLoad ? (
          <iframe
            src={ad.smart_link}
            className="w-full h-full border-0"
            onLoad={() => setIframeLoaded(true)}
            title={`${ad.title} Preview`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          // lightweight placeholder to preserve layout until iframe loads
          <div className="w-full h-full" aria-hidden />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
        
        {/* Click hint for non-admin users */}
        {!isAdmin && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-3 py-1 text-sm font-medium text-blue-600">
              Click anywhere to open offer
            </div>
          </div>
        )}
        
        {/* Click indicator */}
        {!isAdmin && (
          <div className="absolute top-3 right-3 bg-white bg-opacity-90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <ExternalLink className="text-blue-600" size={16} />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {ad.title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
          {ad.description}
        </p>
        
        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <TrendingUp size={14} />
            {ad.clicks || 0} clicks
          </span>
          <span>
            {new Date(ad.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Action Button */}
        {isAdmin ? (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(ad);
              }}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(ad.id);
              }}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <span>Open Offer</span>
            <ExternalLink size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

// IntersectionObserver setup for lazy loading
// We attach effect inside module scope by exporting a small hook that AdCard could call.