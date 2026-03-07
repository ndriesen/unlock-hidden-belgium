"use client";

import { useEffect } from "react";
import Confetti from "react-confetti";
import useSound from "use-sound";

const badgeSoundUrl = "/sounds/badge.wav";

interface BadgeCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
}

export default function BadgeCelebration({
  trigger,
  onComplete,
}: BadgeCelebrationProps) {
  const [play] = useSound(badgeSoundUrl, { volume: 0.5 });

  useEffect(() => {
    if (!trigger) return;

    play();
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [trigger, play, onComplete]);

  if (!trigger) return null;

  return <Confetti numberOfPieces={200} recycle={false} />;
}