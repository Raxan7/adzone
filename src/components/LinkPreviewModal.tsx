import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Ad } from '../types/Ad';
import { db } from '../services/database';

interface LinkPreviewModalProps {
  ad: Ad;
  isOpen: boolean;
  onClose: () => void;
}

export const LinkPreviewModal: React.FC<LinkPreviewModalProps> = ({ ad, isOpen, onClose }) => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (isOpen) {
      // Increment click count when preview opens
      db.incrementAdClicks(ad.id);
    }
  }, [isOpen, ad.id]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleOpenInNewTab = () => {
    window.open(ad.smart_link, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 truncate">{ad.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{ad.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleOpenInNewTab}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <ExternalLink size={16} />
              Open in New Tab
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading preview...</p>
              </div>
            </div>
          )}
          <iframe
            src={ad.smart_link}
            className="w-full h-[600px] border-0"
            onLoad={handleIframeLoad}
            title={`${ad.title} Preview`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <ExternalLink size={14} />
              {ad.clicks || 0} clicks
            </span>
            <span>
              Added {new Date(ad.created_at).toLocaleDateString()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};