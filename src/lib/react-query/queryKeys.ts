export const queryKeys = {
  allHotspots: (filters?: any) => ['hotspots', 'all', filters] as const,
  hotspotDetail: (id: string) => ['hotspots', id] as const,
  popularTrips: (userId?: string) => ['trips', 'popular', userId] as const,
  mentions: () => ['mentions'] as const,
  locationsBbox: (bbox: string) => ['locations', 'bbox', bbox] as const,
  location: (id: string) => ['location', id],
} as const;

export type QueryKey = typeof queryKeys[keyof typeof queryKeys];
