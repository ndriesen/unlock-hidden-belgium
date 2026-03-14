export interface Hotspot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string | Record<string, any>;
  province: string;
  description?: string;
  wikipedia_intro?: string;
  tags?: string[];
  tourism_type?: string;
  heritage?: boolean;
  images?: string[];
  opening_hours?: string | Record<string, any> | Record<string, string>[];
  combine_with?: string[];
  visit_count?: number;
  likes_count?: number;
  saves_count?: number;
  status?: "private" | "pending" | "approved";
  created_by?: string;

  // optional aliases (for Leaflet compatibility)
  lat?: number;
  lng?: number;
}

// Safe display for category or opening_hours (plain text fallback)
export function getSafeDisplay(value: string | Record<string, any> | Record<string, string>[]): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    // Days object {Friday:..., Monday:...}
    if ('Friday' in value || 'Monday' in value) {
      return 'Schedule';
    }
    // Array of day objects
    if (Array.isArray(value)) {
      return 'Opening Hours';
    }
    return Object.keys(value)[0] || 'Details';
  }
  return 'Unknown';
}

// Category display mapping - user-friendly names for hotspot categories
export function getCategoryDisplay(category: string | Record<string, any>): string {
  if (typeof category !== 'string') {
    return getSafeDisplay(category);
  }

  const categoryMap: Record<string, string> = {
    // Common Belgian hotspots
    'museum': 'Museums',
    'museums': 'Museums',
    'castle': 'Castles',
    'castles': 'Castles', 
    'park': 'Parks',
    'parks': 'Parks',
    'church': 'Churches',
    'churches': 'Churches',
    'viewpoint': 'Viewpoints',
    'viewpoints': 'Viewpoints',
    'beach': 'Beaches',
    'beaches': 'Beaches',
    'monument': 'Monuments',
    'monuments': 'Monuments',
    'restaurant': 'Restaurants',
    'restaurants': 'Restaurants',
    'nature reserve': 'Nature Reserves',
    'nature reserves': 'Nature Reserves',
    'forest': 'Forests',
    'forests': 'Forests',
    'lake': 'Lakes',
    'lakes': 'Lakes',
    'river': 'Rivers',
    'cave': 'Caves',
    'waterfall': 'Waterfalls',
    'abbey': 'Abbeys',
    'brewery': 'Breweries',
    'bakery': 'Bakeries',
    'market': 'Markets',
    'street art': 'Street Art',
    // Add more as needed
  };

  const display = categoryMap[category.toLowerCase()];
  return display || category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1').trim();
}

// String formatter for opening_hours - safe for text rendering
export function formatOpeningHours(value: string | Record<string, any> | Record<string, string>[] | null | undefined): string {
  if (!value) return 'Not provided';

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    // Array of day objects or simple strings
    const items = value.map(item => {
      if (typeof item === 'object' && item !== null) {
        return Object.entries(item)
          .map(([day, hours]) => `${day}: ${hours || 'Closed'}`)
          .join(', ');
      }
      return String(item);
    });
    return items.join('; ');
  }

  if (typeof value === 'object' && value !== null) {
    // Single days object {Friday: '10:00-18:00', ...}
    const days = Object.entries(value as Record<string, any>)
      .filter(([_, hours]) => hours !== null && hours !== undefined)
      .sort(([a], [b]) => {
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return dayOrder.indexOf(a) - dayOrder.indexOf(b);
      })
      .map(([day, hours]) => `${day}: ${String(hours) || 'Closed'}`);

    return days.length === 0 ? 'Closed' : days.join('\\n');
  }

  return String(value);
}

// Organized media for Polarsteps-like display
// Note: Uses raw fields to avoid circular imports
export interface OrganizedHotspotMedia {
  personal: {
    id: string;
    signedUrl: string;
    caption: string;
    visibility: string;
    createdAt: string;
    uploadedBy: string;
  }[];
  community: {
    id: string;
    signedUrl: string;
    caption: string;
    visibility: string;
    createdAt: string;
    uploadedBy: string;
  }[];
  inspiration: string[]; // Database filler images
}
