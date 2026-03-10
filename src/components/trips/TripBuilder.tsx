"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createTrip } from "@/lib/services/tripBuilder";

interface TripBuilderProps {
  onComplete?: () => void;
}

export default function TripBuilder({ onComplete }: TripBuilderProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCreate = async () => {
    if (!user?.id) {
      setMessage("Please log in to create a trip.");
      return;
    }
    if (!title.trim()) {
      setMessage("Please enter a trip title.");
      return;
    }

    setLoading(true);
    setMessage("");

    const trip = await createTrip({
      userId: user.id,
      title: title.trim(),
      description: description.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      visibility: "private",
    });

    setLoading(false);

    if (trip) {
      setMessage("Trip created! 🎉");
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      if (onComplete) {
        setTimeout(onComplete, 1000);
      }
    } else {
      setMessage("Failed to create trip. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero CTA */}
      <div className="text-center pb-6 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Start a new adventure</h2>
        <p className="text-slate-600">Plan your next journey and track your memories</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Trip Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Eurotrip 2025"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2A7FFF] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this trip about?"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2A7FFF] focus:border-transparent resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2A7FFF] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2A7FFF] focus:border-transparent"
            />
          </div>
        </div>

        {message && (
          <p className={`text-sm ${message.includes("Failed") ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}

        <button
          onClick={handleCreate}
          disabled={loading || !title.trim()}
          className="w-full py-3 bg-[#2A7FFF] text-white font-semibold rounded-xl hover:bg-[#1a6ee8] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Trip"}
        </button>
      </div>
    </div>
  );
}

