"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { createTripInvite, createTripWithBuddy, getTripWithBuddyCount } from '@/lib/services/trips';
import Link from 'next/link';

interface PlanTripModalProps {
  buddyUserId: string | null;
  onClose: () => void;
}

export function PlanTripModal({ buddyUserId, onClose }: PlanTripModalProps) {
  const { user } = useAuth();
  const addToast = useToast();
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Stub trips list
    setTrips([
      { id: '1', name: 'My Ardennes Adventure' },
      { id: '2', name: 'Ghent Weekend' },
    ]);
  }, []);

  const handleInvite = async () => {
    if (!buddyUserId || !selectedTripId) return;
    setLoading(true);
    try {
      await createTripInvite(selectedTripId, buddyUserId);
      addToast('Invite sent!');
      onClose();
    } catch (error) {
      addToast('Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  if (!buddyUserId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-900">Plan Trip</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            ✕
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">Select trip</label>
            <select 
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Choose a trip</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>{trip.name}</option>
              ))}
            </select>
          </div>
          <button className="w-full p-3 bg-gradient-to-r from-[#244b55] to-[#428a9d] text-white rounded-xl font-semibold hover:shadow-lg transition-all">
            Create new trip
          </button>
        </div>

        <button 
          onClick={handleInvite}
          disabled={!selectedTripId}
          className="w-full p-4 bg-emerald-600 text-white rounded-2xl font-semibold text-lg hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Invite to trip
        </button>
      </div>
    </div>
  );
}
