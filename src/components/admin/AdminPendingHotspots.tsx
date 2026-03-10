"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/Supabase/browser-client";

interface PendingHotspot {
  id: string;
  name: string;
  province: string;
  category: string;
  created_at: string;
  hidden_score?: number;
  description?: string;
  status?: string;
}

export default function AdminPendingHotspots() {
  const [hotspots, setHotspots] = useState<PendingHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingHotspots();
  }, []);

  async function fetchPendingHotspots() {
    setLoading(true);
    const { data, error } = await supabase
      .from("hotspots")
      .select("id, name, province, category, created_at, hidden_score, description, status")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching pending hotspots:", error.message);
      setLoading(false);
      return;
    }

    setHotspots(data || []);
    setLoading(false);
  }

  async function handleApprove(id: string) {
    setActionLoading(id);
    const { error } = await supabase
      .from("hotspots")
      .update({ status: "approved" })
      .eq("id", id);

    if (error) {
      console.error("Error approving hotspot:", error.message);
    } else {
      setHotspots((prev) => prev.filter((h) => h.id !== id));
    }
    setActionLoading(null);
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    const { error } = await supabase
      .from("hotspots")
      .update({ is_hidden: true })
      .eq("id", id);

    if (error) {
      console.error("Error rejecting hotspot:", error.message);
    } else {
      setHotspots((prev) => prev.filter((h) => h.id !== id));
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-slate-500">Loading pending hotspots...</div>
      </div>
    );
  }

  if (hotspots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500">
        <div className="text-lg">No pending hotspots!</div>
        <p className="text-sm mt-2">All hotspots have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Pending Hotspots</h1>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
          {hotspots.length} pending
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Province</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Score</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hotspots.map((h) => (
                <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{h.name}</div>
                    {h.description && (
                      <div className="text-sm text-slate-500 mt-1 line-clamp-2">{h.description}</div>
                    )}
                  </td>
                  <td className="p-4 text-slate-600">{h.province}</td>
                  <td className="p-4">
                    <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                      {h.category}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{h.hidden_score ?? 0}</td>
                  <td className="p-4 text-slate-600 text-sm">
                    {new Date(h.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        disabled={actionLoading === h.id}
                        onClick={() => handleApprove(h.id)}
                        className="px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        disabled={actionLoading === h.id}
                        onClick={() => handleReject(h.id)}
                        className="px-3 py-1.5 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

