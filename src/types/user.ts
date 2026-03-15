export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  interests: string[];
  exploration_style: 'solo' | 'friends' | 'meet_new' | null;
  city: string | null;
  country?: string | null;
  travel_style: string;
  onboarding_completed: boolean;
  avatar_url?: string | null;
  bio?: string;
  xp_points?: number;
  created_at: string;
}

export type OnboardingInterests = (
  | 'Hidden cafés'
  | 'Viewpoints'
  | 'Nature spots'
  | 'Street art'
  | 'Architecture'
  | 'Nightlife'
  | 'Photography spots'
  | 'Abandoned places'
  | 'Local food'
  | 'Secret bars'
)[];

export type ExplorationStyle = 'solo' | 'friends' | 'meet_new';

