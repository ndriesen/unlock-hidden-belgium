"use client";

import type { ReactNode } from "react";
import { Bookmark, Heart, Navigation, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TripFloatingActionsProps {
  likesCount: number;
  savesCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onOpenMaps: () => void;
  disabled?: boolean;
}

interface ActionButtonProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  value?: string | number;
  disabled?: boolean;
}

function ActionButton({ label, icon, onClick, active = false, value, disabled = false }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-w-[70px] flex-col items-center gap-1 rounded-2xl border px-3 py-2 text-[11px] font-medium transition-all",
        "shadow-[0_10px_20px_-14px_rgba(15,23,42,0.85)] backdrop-blur-xl",
        "disabled:cursor-not-allowed disabled:opacity-60",
        active
          ? "border-emerald-300/80 bg-emerald-50/90 text-emerald-800"
          : "border-white/65 bg-white/85 text-slate-700 hover:border-slate-200 hover:bg-white"
      )}
      aria-label={label}
    >
      <span className="flex h-6 w-6 items-center justify-center">{icon}</span>
      <span>{label}</span>
      {value !== undefined ? <span className="font-semibold text-slate-900">{value}</span> : null}
    </button>
  );
}

export default function TripFloatingActions({
  likesCount,
  savesCount,
  likedByMe,
  savedByMe,
  onLike,
  onSave,
  onShare,
  onOpenMaps,
  disabled = false,
}: TripFloatingActionsProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 md:bottom-8 md:justify-end md:px-8">
      <div className="pointer-events-auto flex items-center gap-2 rounded-3xl border border-white/65 bg-white/70 p-2 shadow-[0_30px_40px_-28px_rgba(10,19,36,0.95)] backdrop-blur-xl">
        <ActionButton
          label="Share"
          icon={<Share2 className="h-4 w-4" />}
          onClick={onShare}
          disabled={disabled}
        />
        <ActionButton
          label="Like"
          icon={<Heart className={cn("h-4 w-4", likedByMe && "fill-rose-500 text-rose-500")} />}
          onClick={onLike}
          active={likedByMe}
          value={likesCount}
          disabled={disabled}
        />
        <ActionButton
          label="Save"
          icon={<Bookmark className={cn("h-4 w-4", savedByMe && "fill-amber-500 text-amber-500")} />}
          onClick={onSave}
          active={savedByMe}
          value={savesCount}
          disabled={disabled}
        />
        <ActionButton
          label="Start"
          icon={<Navigation className="h-4 w-4" />}
          onClick={onOpenMaps}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
