"use client";

import { useState, useEffect } from "react";
import Confetti from "react-confetti";
import useSound from "use-sound";

// Gebruik publieke URL i.p.v. import
const badgeSoundUrl = "/sounds/badge.wav";

interface BadgeCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
}

export default function BadgeCelebration({ trigger, onComplete }: BadgeCelebrationProps) {
  const [show, setShow] = useState(false);
  const [play] = useSound(badgeSoundUrl, { volume: 0.5 });

  useEffect(() => {
    if (trigger) {
      setShow(true);
      play();
      const timer = setTimeout(() => {
        setShow(false);
        if (onComplete) onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger, play, onComplete]);

  if (!show) return null;

  return <Confetti numberOfPieces={200} recycle={false} />;
}