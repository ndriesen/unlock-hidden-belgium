import type { Trip } from '@/types/trip';

export const premiumBelgiumTrip: Trip = {
  id: 'premium-belgium-2024',
  title: 'Premium Belgian Gems',
  description: "Curated journey through Belgium's hidden architectural treasures and cultural hotspots",
  startDate: '2024-06-01',
  endDate: '2024-06-07',
  visibility: 'public',
  coverImage: '/images/belgium-cover.jpg',
  createdAt: '2024-05-01T10:00:00Z',
  updatedAt: '2024-05-15T14:30:00Z',
  likesCount: 247,
  savesCount: 89,
  viewsCount: 1247,
  likedByMe: false,
  savedByMe: true,
  stops: [
    {
      id: 'stop-brussels',
      hotspotId: 'brussels-grand-place',
      name: 'Grand Place, Brussels',
      province: 'Brussels',
      category: 'UNESCO Square',
      lat: 50.8467,
      lng: 4.3525,
      note: 'Gothic architecture masterpiece. Best at golden hour.',
      photoUrl: 'https://images.unsplash.com/photo-1588132892227-46bfe9090678?w=800',
      addedAt: '2024-05-01T10:00:00Z',
      visitedAt: '2024-06-01T14:00:00Z', // visited
      media: [
        {
          id: 'media1',
          tripId: 'premium-belgium-2024',
          tripStopId: 'stop-brussels',
          hotspotId: null,
          storagePath: 'trips/media/brussels1.jpg',
          signedUrl: 'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Grand+Place',
          caption: 'Evening lights magic ✨',
          visibility: 'public',
          isHighlight: true,
          createdAt: '2024-06-01T14:30:00Z'
        }
      ]
    },
    {
      id: 'stop-ghent',
      hotspotId: 'ghent-gravensteen',
      name: 'Gravensteen Castle, Ghent',
      province: 'East Flanders',
      category: 'Medieval Castle',
      lat: 51.0544,
      lng: 3.7203,
      note: 'Waterfront fortress. Climb for panoramic views.',
      photoUrl: 'https://images.unsplash.com/photo-1627483235663-26e16373e9a2?w=800',
      addedAt: '2024-05-02T09:00:00Z',
      visitedAt: null, // upcoming
    media: [{
      id: 'ghent1',
      tripId: 'premium-belgium-2024',
      tripStopId: 'stop-ghent',
      hotspotId: null,
      storagePath: 'trips/ghent1.jpg',
      signedUrl: 'https://via.placeholder.com/800x600/4ECDC4/FFFFFF?text=Gravensteen',
      caption: 'Castle view from river',
      visibility: 'public',
      isHighlight: false,
      createdAt: '2024-05-02T10:00:00Z'
    }]
    },
    {
      id: 'stop-bruges',
      hotspotId: 'bruges-market-square',
      name: 'Markt Square & Belfry, Bruges',
      province: 'West Flanders',
      category: 'Medieval Plaza',
      lat: 51.2094,
      lng: 3.2247,
      note: 'Chocolate & canals. Belfry climb (366 steps!)',
      photoUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      addedAt: '2024-05-03T11:00:00Z',
      visitedAt: '2024-06-03T16:00:00Z', // visited
      media: []
    },
    {
      id: 'stop-antwerp',
      hotspotId: 'antwerp-cathedral',
      name: 'Cathedral of Our Lady, Antwerp',
      province: 'Antwerp',
      category: 'Gothic Cathedral',
      lat: 51.2205,
      lng: 4.3987,
      note: 'Rubens masterpieces inside. Sunset glow.',
      photoUrl: 'https://images.unsplash.com/photo-1580130684518-6f998af70c93?w=800',
      addedAt: '2024-05-04T13:00:00Z',
      visitedAt: null, // upcoming
      media: []
    },
    {
      id: 'stop-leuven',
      hotspotId: 'leuven-town-hall',
      name: 'Town Hall & Stellar Vault, Leuven',
      province: 'Flemish Brabant',
      category: 'Gothic Hall',
      lat: 50.8798,
      lng: 4.7044,
      note: 'Library vault tour required. Student vibe.',
      photoUrl: 'https://via.placeholder.com/800x600/F7DC6F/000?text=Leuven+Town+Hall',
      addedAt: '2024-05-05T15:00:00Z',
      visitedAt: null, // wishlist/upcoming
      media: []
    }
  ]
};

export const demoTrips = [premiumBelgiumTrip];
