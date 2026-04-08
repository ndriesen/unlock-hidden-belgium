// DEPRECATED - Premium map moved to NewTripsPage.tsx
// Basic skeleton replaced with full-featured travel map experience

export default function LegacyMap() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">🚀 Premium Travel Map</h1>
        <p className="text-xl opacity-80 mb-8">Full experience now at /newTrips</p>
        <div className="bg-slate-800/50 p-8 rounded-2xl max-w-md mx-auto backdrop-blur-sm">
          <p className="text-slate-300">• Dark MapLibre GL world map</p>
          <p className="text-slate-300">• Clustered trip stops (visited/upcoming)</p>
          <p className="text-slate-300">• Animated route lines</p>
          <p className="text-slate-300">• Side panel with gallery & notes</p>
          <p className="text-slate-300 mb-4">• Journey stepper & controls</p>
        </div>
      </div>
    </div>
  );
}

