"use client";

export default function LevelUpModal({
  level,
  onClose,
}: {
  level: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-3xl p-8 text-center space-y-4 animate-scale-in">
        <h2 className="text-2xl font-bold text-emerald-600">
          🎉 Level Up!
        </h2>
        <p>You reached Level {level}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-emerald-500 text-white rounded-full"
        >
          Continue Exploring
        </button>
      </div>
    </div>
  );
}