import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/Supabase/server-client';

export async function GET(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await getSupabaseClient(); // echte client
    const { data, error } = await supabase
      .from('hotspots')
      .select(`
        *,
        wikipedia_intro,
        tags,
        tourism_type,
        reviews(rating)
      `)
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Hotspot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API /hotspots/[id] error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// Cache for 1 hour
export const revalidate = 3600;