import React, { useState, useEffect } from 'react';
import { Plus, BarChart, Users, TrendingUp, LogOut } from 'lucide-react';
import { Ad, AdminStats } from '../types/Ad';
import { db } from '../services/database';
import { AdCard } from './AdCard';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [adsData, statsData] = await Promise.all([
        db.getAllAds(),
        db.getAdStats()
      ]);
      setAds(adsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAd = async (id: number) => {
    if (confirm('Are you sure you want to delete this ad?')) {
      await db.deleteAd(id);
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 text-sm">Manage your ads and track performance</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <Plus size={20} />
                Add New Ad
              </button>
              <button
                onClick={onLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <LogOut size={18} />
                Logout
              </button>
              <button
                onClick={async () => {
                  if (confirm('This will delete all ads and reset the database. Are you sure?')) {
                    try {
                      await db.forceResetDatabase();
                      alert('Database reset successfully!');
                      loadData();
                    } catch (error) {
                      console.error('Failed to reset database:', error);
                      alert('Failed to reset database. Check console for details.');
                    }
                  }
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                Reset DB
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Ads</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalAds}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Clicks</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalClicks}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Users className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Avg Clicks/Ad</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.averageClicksPerAd}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="text-purple-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ads Grid */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">All Ads ({ads.length})</h2>
          
          {ads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ads.map(ad => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  isAdmin={true}
                  onEdit={(ad) => setEditingAd(ad)}
                  onDelete={handleDeleteAd}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No ads yet</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first ad</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
              >
                Create First Ad
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddForm && (
        <AdFormModal
          onClose={() => setShowAddForm(false)}
          onSave={() => {
            setShowAddForm(false);
            loadData();
          }}
        />
      )}

      {editingAd && (
        <AdFormModal
          ad={editingAd}
          onClose={() => setEditingAd(null)}
          onSave={() => {
            setEditingAd(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

interface AdFormModalProps {
  ad?: Ad;
  onClose: () => void;
  onSave: () => void;
}

const AdFormModal: React.FC<AdFormModalProps> = ({ ad, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: ad?.title || '',
    description: ad?.description || '',
    image_url: ad?.image_url || '',
    smart_link: ad?.smart_link || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started');
    console.log('Form data:', formData);
    
    // Validate that smart_link is provided
    if (!formData.smart_link.trim()) {
      alert('Smart Link URL is required');
      return;
    }

    // Basic URL validation for smart_link
    try {
      new URL(formData.smart_link.trim());
    } catch {
      alert('Please enter a valid URL for the Smart Link');
      return;
    }

    setSaving(true);

    try {
      // Prepare data with defaults for optional fields
      const adData = {
        title: formData.title.trim() || 'Untitled Ad',
        description: formData.description.trim() || 'No description provided',
        image_url: formData.image_url.trim() || 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=No+Image',
        smart_link: formData.smart_link.trim()
      };

      console.log('Prepared ad data:', adData);

      if (ad) {
        console.log('Updating existing ad with id:', ad.id);
        await db.updateAd(ad.id, adData);
      } else {
        console.log('Creating new ad');
        console.log('Final ad data being sent to database:', adData);
        console.log('Smart link length:', adData.smart_link.length);
        console.log('Smart link starts with:', adData.smart_link.substring(0, 20) + '...');
        await db.createAd(adData);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save ad:', error);
      alert('Failed to save ad. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {ad ? 'Edit Ad' : 'Create New Ad'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
            <div className="mt-2">
              <label className="block text-sm text-gray-600 mb-1">Or upload an image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setFormData({ ...formData, image_url: event.target?.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {formData.image_url && formData.image_url.startsWith('data:') && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">Preview:</p>
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    className="w-32 h-20 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Smart Link URL
            </label>
            <input
              type="url"
              value={formData.smart_link}
              onChange={(e) => setFormData({ ...formData, smart_link: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
            >
              {saving ? 'Saving...' : ad ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};