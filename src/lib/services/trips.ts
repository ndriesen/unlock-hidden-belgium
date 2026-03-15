import { supabase } from "@/lib/Supabase/browser-client";
import { awardXP } from "./gamification";

export interface UpcomingTrip {
  id: string;
  title: string;
  start_date: string;
  looking_for_companions: boolean;
  creator: {
    id: string;
    display_name: string;
    avatar_url: string;
    city?: string;
  };
}

export async function getUpcomingTripsWithCompanions(): Promise<UpcomingTrip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select(`
      id,
      title,
      start_date,
      looking_for_companions,
      users!trips_created_by_fkey(id, username, avatar_url, city)
    `)
    .order('start_date')
    .limit(20);

  if (error) throw error;

  return data.map((trip: any) => ({
    ...trip,
    creator: {
      id: trip.users.id,
      display_name: trip.users.username || 'Explorer',
      avatar_url: trip.users.avatar_url || '',
      city: trip.users.city ?? '',
    },
  })) as UpcomingTrip[];
}

export async function createTripInvite(
  tripId: string,
  inviteeId: string
): Promise<{id: string}> {
  // Validate invitee exists
  const { count: userCount, error: userCheckError } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('id', inviteeId);
  if (userCheckError) throw new Error(`User check failed: ${userCheckError.message}`);
  if (!userCount || userCount === 0) throw new Error('Invitee user does not exist');

  const { data, error } = await supabase
    .from('trip_invites')
    .insert({
      trip_id: tripId,
      inviter_id: (await supabase.auth.getUser()).data.user!.id,
      invitee_id: inviteeId,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function createTripWithBuddy(userId: string, tripData: {title: string, buddy_ids: string[]}) {
  const { data, error } = await supabase.from("trips").insert({
    user_id: userId,
    title: tripData.title,
    buddy_ids: tripData.buddy_ids,
  }).select().single();

  if (error) throw error;

  if (tripData.buddy_ids.length > 0) {
    await awardXP(userId, 'xp_making_trip_together');
  } else {
    await awardXP(userId, 'xp_making_trips');
  }

  return data;
}

export async function getTripWithBuddyCount(userId: string) {
  const { count, error } = await supabase
    .from("trips")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("buddy_ids", JSON.stringify([]));

  return error ? 0 : count || 0;
}
