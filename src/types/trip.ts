export interface TripCreator {
  id: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
}

export interface TripMedia {
  id: string;
  tripId: string;
  tripStopId: string | null;
  hotspotId: string | null;
  storagePath: string;
  signedUrl: string;
  caption: string;
  visibility: 'private' | 'friends' | 'public';
  isHighlight: boolean;
  createdAt: string;
}

export interface TripStop {
  id: string;
  hotspotId: string;
  name: string;
  province: string;
  category: string;
  lat: number;
  lng: number;
  note: string;
  photoUrl: string;
  addedAt: string;
  visitedAt: string | null;
  media: TripMedia[];
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  visibility: 'private' | 'friends' | 'public';
  coverImage: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  savesCount: number;
  viewsCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  creator?: TripCreator;
  stops: TripStop[];
}

