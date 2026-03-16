import { NextResponse } from 'next/server';
import { fetchExploreHotspots } from '@/lib/services/explore';
import type { ExploreHotspot } from '@/lib/services/explore';

export const dynamic = 'force-dynamic'; // Disable static rendering

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    
    const data = await fetchExploreHotspots(userId) as ExploreHotspot[];
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API /hotspots error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hotspots' },
      { status: 500 }
    );
  }
}

// ISR - revalidate every 5 minutes (300s)
export const revalidate = 300;

