import { useEffect, useState } from 'react';
import type { ExploreHotspot } from '@/lib/services/explore';
import { hiddenGems } from '@/data/hiddenGemsMocks';

export function useHiddenGemsDemo() {
  const [hiddenGemsData, setHiddenGemsData] = useState<ExploreHotspot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Map mocks to ExploreHotspot type
    const demoData: ExploreHotspot[] = hiddenGems.map(gem => ({
      id: gem.id,
      name: gem.name,
      category: gem.category,
      province: gem.province,
      description: gem.description,
imageUrl: gem.images?.[0] || '/images/placeholder-image.png',
      visitCount: Math.floor(Math.random() * 100),
      likesCount: Math.floor(Math.random() * 50),
      savesCount: Math.floor(Math.random() * 20),
      reviewCount: Math.floor(Math.random() * 10),
      averageRating: (Math.floor(Math.random() * 5) + 1),
      viewsCount: Math.floor(Math.random() * 1000),
      likedByMe: false,
      savedByMe: false,
      visited: false,
      wishlist: false,
      favorite: false,
      latitude: gem.latitude || gem.lat,
      longitude: gem.longitude || gem.lng,
    }));

    setHiddenGemsData(demoData);
    setLoading(false);
  }, []);

  return {
    hiddenGems: hiddenGemsData,
    loading,
    error: null,
  };
}
