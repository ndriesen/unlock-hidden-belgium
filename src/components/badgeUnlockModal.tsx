"use client";

export default function BadgeUnlockModal({
  badge,
  onClose,
}: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-3xl p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-yellow-600">
          🏆 New Badge!
        </h2>
        <p>{badge.name}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-yellow-500 text-white rounded-full"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}