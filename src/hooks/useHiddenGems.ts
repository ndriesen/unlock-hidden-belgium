import { useState, useEffect } from 'react';
import type { ExploreHotspot } from '@/lib/services/explore';
import { fetchExploreHotspots } from '@/lib/services/explore';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useHiddenGems(userId?: string) {
  const [hiddenGems, setHiddenGems] = useState<ExploreHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const gems = await fetchExploreHotspots(userId);
        setHiddenGems(gems);
      } catch (err) {
        setError('Failed to load hidden gems');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  return {
    hiddenGems,
    loading,
    error,
    refetch: () => {/* impl with react-query later */},
  };
}

