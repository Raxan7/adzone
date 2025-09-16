export interface Ad {
  id: number;
  title: string;
  description: string;
  image_url: string;
  smart_link: string;
  clicks?: number;
  created_at: string;
}

export interface Click {
  id: string;
  ad_id: string;
  click_type: 'auto' | 'manual' | 'simulated';
  user_agent?: string;
  ip_address?: string;
  referrer?: string;
  created_at: string;
}

export interface AdminStats {
  totalAds: number;
  totalClicks: number;
  averageClicksPerAd: number;
  topPerformingAd?: Ad;
}