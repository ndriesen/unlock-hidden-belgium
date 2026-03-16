"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import type { Trip } from "@/types/trip";
import { fetchPublicTrip } from "@/lib/services/publicTrip";
import { toggleTripLike, toggleTripSave } from "@/lib/services/tripBuilder";

import { Heart, Bookmark, Calendar, MapPin, Image as ImageIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

export default function PublicTripPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [updatingLike, setUpdatingLike] = useState(false);
  const [updatingSave, setUpdatingSave] = useState(false);
  const [lightbox, setLightbox] = useState<{ index: number } | null>(null);

  useEffect(() => {
    const loadTrip = async () => {
      try {
        const publicTrip = await fetchPublicTrip(tripId);
        if (!publicTrip) {
          setError('Trip not found or not public');
          setLoading(false);
          return;
        }
        setTrip(publicTrip);
        setIsLiked(publicTrip.likedByMe || false);
        setIsSaved(publicTrip.savedByMe || false);
      } catch (err) {
        setError('Failed to load trip');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTrip();
  }, [tripId]);

  const handleLike = async () => {
    if (!user?.id || updatingLike) return;
    setUpdatingLike(true);
    try {
      const liked = await toggleTripLike({
        tripId,
        userId: user.id,
        tripTitle: trip!.title,
      });
      setIsLiked(liked);
      if (trip) {
        setTrip({ ...trip, likesCount: liked ? trip.likesCount + 1 : trip.likesCount - 1 });
      }
    } catch (err) {
      console.error('Like failed', err);
    } finally {
      setUpdatingLike(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id || updatingSave) return;
    setUpdatingSave(true);
    try {
      const saved = await toggleTripSave({
        tripId,
        userId: user.id,
        tripTitle: trip!.title,
      });
      setIsSaved(saved);
      if (trip) {
        setTrip({ ...trip, savesCount: saved ? trip.savesCount + 1 : trip.savesCount - 1 });
      }
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setUpdatingSave(false);
    }
  };

  const allTripPhotos = trip ? trip.stops.flatMap(s => s.media) : [];

  const openLightbox = useCallback((imageUrl: string) => {
    const index = allTripPhotos.findIndex(p => p.signedUrl === imageUrl);
    if (index > -1) setLightbox({ index });
  }, [allTripPhotos]);

  const closeLightbox = () => setLightbox(null);

  const nextPhoto = () => {
    if (!lightbox || allTripPhotos.length === 0) return;
    const nextIndex = (lightbox.index + 1) % allTripPhotos.length;
    setLightbox({ index: nextIndex });
  };

  const prevPhoto = () => {
    if (!lightbox || allTripPhotos.length === 0) return;
    const prevIndex = (lightbox.index - 1 + allTripPhotos.length) % allTripPhotos.length;
    setLightbox({ index: prevIndex });
  };

  if (loading) {
    return <div className="min-h-screen p-8 flex items-center justify-center">Loading...</div>;
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Trip not found</h1>
          <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Back to Home</Link>
        </div>
      </div>
    );
  }

  const dateRange = trip.startDate && trip.endDate 
    ? `${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}`
    : trip.startDate 
    ? new Date(trip.startDate).toLocaleDateString()
    : 'No dates set';

  const travelerName = trip.creator?.display_name || trip.creator?.username || 'Unknown traveler';

  return (
    <>
      <div className="flex flex-col h-full max-w-6xl mx-auto p-4 md:p-8">
        {/* Header with cover image */}
        <div className="mb-8">
          <Link href="/" className="inline-block mb-4 text-slate-500 hover:text-slate-900 text-lg font-medium">
            ← Back to Discovery
          </Link>
          {trip.coverImage && (
            <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden mb-6 shadow-2xl max-w-full z-0 cursor-pointer" onClick={() => openLightbox(trip.coverImage!)}>
              <Image
                src={trip.coverImage}
                alt={trip.title}
                fill
                className="object-cover hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 100vw, 80vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-0" />
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-start md:gap-6">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">{trip.title}</h1>
              <p className="text-xl text-slate-600 mb-6 max-w-2xl">{trip.description}</p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                className={`px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2 ${
                  isLiked 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-400/25' 
                    : 'border-2 border-slate-200 hover:border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
                } ${updatingLike || !user ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleLike}
                disabled={updatingLike || !user}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{trip.likesCount}</span>
              </button>
              <button
                className={`px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2 ${
                  isSaved 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-400/25'
                    : 'border-2 border-slate-200 hover:border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
                } ${updatingSave || !user ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleSave}
                disabled={updatingSave || !user}
              >
                <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                <span>{trip.savesCount}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Compact metadata bar */}
        <div className="flex items-center gap-8 mb-12 py-4 px-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-slate-900">{dateRange}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-slate-900">{trip.stops.length} stops</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ImageIcon className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-slate-900">{trip.viewsCount} views</span>
          </div>
        </div>

        {/* Traveler info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl mb-12 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-2">By {travelerName}</h3>
          <p className="text-slate-600">Discover this amazing trip created by an explorer like you!</p>
        </div>

        {/* Stops */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <MapPin className="h-8 w-8" />
            Trip Stops ({trip.stops.length})
          </h2>
          <div className="space-y-6">
            {trip.stops.map((stop, index) => (
              <div key={stop.id} className="flex gap-6 p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                <div className="font-mono text-2xl font-bold text-slate-400 w-12 flex-shrink-0 text-center pt-1">{index + 1}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{stop.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {stop.province}</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">{stop.category}</span>
                  </div>
                  {stop.note && (
                    <p className="text-slate-700 mb-4 italic">"{stop.note}"</p>
                  )}
                  {stop.visitedAt && (
                    <div className="text-xs text-green-600 font-medium mb-3">✓ Visited {new Date(stop.visitedAt).toLocaleDateString()}</div>
                  )}
                </div>
                <div className="relative w-48 h-32 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => openLightbox(stop.media[0]?.signedUrl!)} title="View photos">
                  {stop.media[0]?.signedUrl ? (
                    <Image src={stop.media[0].signedUrl} alt="" fill className="object-cover hover:scale-105 transition-transform duration-200" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">No photo</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gallery */}
        {trip.stops.some(s => s.media.length > 0) && (
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Trip Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {trip.stops.flatMap(s => s.media.slice(0, 4)).map((media, index) => (
                <div key={index} className="group relative aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer" onClick={() => openLightbox(media.signedUrl)} title="View full size">
                  {media.signedUrl ? (
                    <Image 
                      src={media.signedUrl} 
                      alt="" 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-300" 
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightbox && allTripPhotos.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && closeLightbox()}
        >
          <button 
            className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-4 text-white text-2xl transition-all z-10"
            onClick={(e) => {
              e.stopPropagation();
              prevPhoto();
            }}
            aria-label="Previous"
          >
            ‹
          </button>
          <button 
            className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-4 text-white text-2xl transition-all z-10"
            onClick={(e) => {
              e.stopPropagation();
              nextPhoto();
            }}
            aria-label="Next"
          >
            ›
          </button>
          <button 
            className="absolute top-8 right-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 text-white text-xl transition-all z-10"
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            aria-label="Close"
          >
            ×
          </button>
          <div className="max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center overflow-hidden">
            <Image 
              src={allTripPhotos[lightbox.index].signedUrl} 
              alt="" 
              fill 
              className="object-contain max-h-[90vh] max-w-full"
              priority
            />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 text-white px-6 py-2 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              {lightbox.index + 1} / {allTripPhotos.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
