import React, { useState } from 'react';
import { ExternalLink, Eye, TrendingUp } from 'lucide-react';
import { Ad } from '../types/Ad';
import { db } from '../services/database';

interface AdCardProps {
  ad: Ad;
  isAdmin?: boolean;
  onEdit?: (ad: Ad) => void;
  onDelete?: (id: number) => void;
}

export const AdCard: React.FC<AdCardProps> = ({ ad, isAdmin = false, onEdit, onDelete }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleClick = async () => {
    if (!isAdmin) {
      await db.incrementAdClicks(ad.id);
      window.open(ad.smart_link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  return (
    <div 
      className={`group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-1 ${!isAdmin ? 'cursor-pointer hover:shadow-blue-200/50' : ''}`}
      onClick={!isAdmin ? handleClick : undefined}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <Eye className="text-gray-400" size={32} />
          </div>
        )}
        
        {!imageError ? (
          <img
            src={ad.image_url}
            alt={ad.title}
            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <TrendingUp className="text-blue-500" size={48} />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
        
        {/* Click hint for non-admin users */}
        {!isAdmin && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-3 py-1 text-sm font-medium text-blue-600">
              Click to view offer
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
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <span>View Offer</span>
            <ExternalLink size={16} />
          </button>
        )}
      </div>
    </div>
  );
};