export function xpRequiredForLevel(level: number) {
  return 100 * level * level;
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