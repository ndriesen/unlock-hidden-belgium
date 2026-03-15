"use client";

import Link from 'next/link';
import { BuddyRequest } from '@/lib/services/buddies';

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("nl-BE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

interface BuddyRequestsFeedProps {
  requests: BuddyRequest[];
  onMessage?: (userId: string) => void;
  onJoinAdventure?: (requestId: string) => void;
}

export function BuddyRequestsFeed({ requests, onMessage, onJoinAdventure }: BuddyRequestsFeedProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Active Buddy Requests</h2>
      <p className="text-sm text-slate-600 mb-5">Join explorers looking for companions</p>

      {requests.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-xl flex items-center justify-center">
            <span className="text-xl">✋</span>
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">No active requests</h3>
          <p className="text-sm text-slate-600 mb-4">Be the first to post a buddy request</p>
          <button className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 text-sm">
            Post request
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="group bg-slate-50 hover:bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg text-slate-900 line-clamp-1 flex-1 pr-3">
                  {request.city ? `Buddy in ${request.city}` : 'Travel companion needed'}
                </h3>
                <span className="text-xs text-slate-500 px-1.5 py-0.5 bg-white rounded-full border">
                  {formatDate(request.createdAt)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 mb-3">
                <div>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">Style</span>
                  <span className="text-sm font-semibold capitalize">{request.style}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">Interests</span>
                  <div className="flex flex-wrap gap-1">
                    {request.interests.slice(0, 3).map((interest) => (
                      <span key={interest} className="px-1.5 py-0.5 bg-emerald-100 text-xs text-emerald-800 rounded-full">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {request.note && (
                <p className="text-slate-700 mb-4 line-clamp-2 text-sm leading-relaxed">{request.note}</p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <button onClick={() => onJoinAdventure?.(request.id)} className="text-sm py-2 px-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors">
                  Join adventure
                </button>
                <button onClick={() => onMessage?.(request.userId)} className="text-sm py-2 px-3 rounded-lg bg-white border border-slate-300 font-semibold text-slate-800 hover:bg-slate-50 transition-colors">
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

