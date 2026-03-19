"use client";

import { getPublicProfileData } from '@/lib/services/publicProfiles';
import { PhotosGallery } from '@/components/profile/PhotosGallery';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function PhotosPage() {
  const params = useParams();
  const profileId = params.id as string;
const [photos, setPhotos] = useState([] as any[]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getPublicProfileData(profileId);
        setPhotos(data.photos || []);
      } catch (error) {
        console.error('Error loading photos:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [profileId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="relative max-w-4xl mx-auto px-4 py-12">
      <button
        onClick={() => window.history.back()}
        className="absolute -left-12 top-4 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-full transition-colors"
        aria-label="Back to profile"
      >
        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <PhotosGallery photos={photos} />
    </div>
  );

}
