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

  // optional aliases (for Leaflet compatibility)
  lat?: number;
  lng?: number;
}