export interface Hotspot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  province: string;
  description?: string;
  images?: string[];
  opening_hours?: string;
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

