export function xpRequiredForLevel(level: number) {
  // Dynamic from app_rules.xp_curve_multiplier
  const multiplier = 100; // fetch from DB in production
  return multiplier * level * level;
}

export function totalXpForLevel(level: number) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpRequiredForLevel(i);
  }
  return total;
}

export function getLevelFromXp(xp: number) {
  let level = 1;
  let accumulated = 0;

  while (xp >= accumulated + xpRequiredForLevel(level)) {
    accumulated += xpRequiredForLevel(level);
    level++;
  }

  return level;
}

export function getProgressPercentage(xp: number) {
  const level = getLevelFromXp(xp);
  const xpForCurrentLevel = totalXpForLevel(level);
  const xpForNextLevel = xpRequiredForLevel(level);

  return ((xp - xpForCurrentLevel) / xpForNextLevel) * 100;
}