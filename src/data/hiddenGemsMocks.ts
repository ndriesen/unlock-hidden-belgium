import type { Hotspot } from '@/types/hotspot';
import type { Trip } from '@/types/trip';

export interface HiddenGem extends Omit<Hotspot, 'images'> {
  images?: string[];
  category: string;
  description: string;
  lat: number;
  lng: number;
}

export const hiddenGems: HiddenGem[] = [
  // From premiumBelgiumTrip
  {
    id: 'brussels-grand-place',
    name: 'Grand Place',
    latitude: 50.8467,
    lng: 4.3525,
    lat: 50.8467,
    longitude: 4.3525,
    province: 'Brussels',
    category: 'UNESCO Square',
    description: 'Gothic architecture masterpiece. Best at golden hour.',
    images: ['https://images.unsplash.com/photo-1588132892227-46bfe9090678?w=400&h=400&fit=crop&crop=center']
  },
  {
    id: 'ghent-gravensteen',
    name: 'Gravensteen Castle',
    latitude: 51.0544,
    lng: 3.7203,
    lat: 51.0544,
    longitude: 3.7203,
    province: 'East Flanders',
    category: 'Medieval Castle',
    description: 'Waterfront fortress. Climb for panoramic views.',
    images: ['https://images.unsplash.com/photo-1627483235663-26e16373e9a2?w=400&h=400&fit=crop&crop=center']
  },
  {
    id: 'bruges-market-square',
    name: 'Markt Square & Belfry',
    latitude: 51.2094,
    lng: 3.2247,
    lat: 51.2094,
    longitude: 3.2247,
    province: 'West Flanders',
    category: 'Medieval Plaza',
    description: 'Chocolatitudee & canals. Belfry climb (366 steps!).',
    images: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop&crop=center']
  },
  {
    id: 'antwerp-cathedral',
    name: 'Cathedral of Our Lady',
    lat: 51.2205,
    lng: 4.3987,
    latitude: 51.2205,
    longitude: 4.3987,
    province: 'Antwerp',
    category: 'Gothic Cathedral',
    description: 'Rubens masterpieces inside. Sunset glow.',
    images: ['https://images.unsplash.com/photo-1580130684518-6f998af70c93?w=400&h=400&fit=crop&crop=center']
  },
  {
    id: 'leuven-town-hall',
    name: 'Town Hall & Stellar Vault',
    latitude: 50.8798,
    lng: 4.7044,
    lat: 50.8798,
    longitude: 4.7044,
    province: 'Flemish Brabant',
    category: 'Gothic Hall',
    description: 'Library vault tour required. Student vibe.',
    images: ['https://images.unsplash.com/photo-1564507592333-a29a1b8c15c5?w=400&h=400&fit=crop&crop=center']
  },
  // Additional 15 hidden gems
  {
    id: 'dinant-citadel',
    name: 'Citadel of Dinant',
    latitude: 50.2613,
    lng: 4.9121,
    lat: 50.2613,
    longitude: 4.9121,
    province: 'Namur',
    category: 'Hilltop Fortress',
    description: 'Saxophone birthplace with epic Meuse River views.',
    images: ['https://images.unsplash.com/photo-1604709176186-42a8d4e8a8f9?w=400&h=400&fit=crop']
  },
  {
    id: 'ghent-patershol',
    name: 'Patershol Neighborhood',
    latitude: 51.0529,
    lng: 3.7178,
    lat: 51.0529,
    longitude: 3.7178,
    province: 'East Flanders',
    category: 'Hidden Alleyways',
    description: "Medieval maze of cozy restaurants and secret courtyards.",
    images: ['https://images.unsplash.com/photo-1571896349840-f5076fa2d6e4?w=400&h=400&fit=crop']
  },
  {
    id: 'bouillon-castle',
    name: 'Castle of Bouillon',
    lat: 49.7931,
    lng: 5.4135,
    latitude: 49.7931,
    longitude: 5.4135,
    province: 'Luxembourg',
    category: 'Riverside Castle',
    description: 'Godfrey of Bouillon\'s crusader castle overlooking Semois.',
    images: ['https://images.unsplash.com/photo-1620325868782-2dd8a8c7f1f8?w=400&h=400&fit=crop']
  },
 
];

// demoJourneys simplified - full Trip type requires stops as TripStop[]
export interface SimpleJourney {
  id: string;
  title: string;
  description: string;
  stopIds: string[]; // hiddenGems ids
  coverImage: string;
}

export const demoJourneys: SimpleJourney[] = [
  {
    id: 'journey-flanders',
    title: 'Flanders Hidden Route',
    description: 'Medieval gems circuit',
    stopIds: ['ghent-gravensteen', 'bruges-market-square', 'ghent-patershol', 'veurne-big-market', 'damme-zen-poort'],
    coverImage: '/images/flanders-cover.jpg'
  },
  {
    id: 'journey-wallonia',
    title: 'Wallonia Secrets',
    description: 'Fortresses and springs',
    stopIds: ['dinant-citadel', 'spa-pouhon-pierre', 'bouillon-castle', 'huy-fort'],
    coverImage: '/images/wallonia-cover.jpg'
  },
  {
    id: 'premium-belgium-2024',
    title: 'Premium Belgian Gems',
    description: 'Curated architectural treasures',
    stopIds: ['brussels-grand-place', 'ghent-gravensteen', 'bruges-market-square', 'antwerp-cathedral', 'leuven-town-hall'],
    coverImage: '/images/belgium-cover.jpg'
  }
];

