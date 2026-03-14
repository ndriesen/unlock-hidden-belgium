# Gamification System Implementation TODO

## Overview
Complete gamification: XP awards, level progression, badge unlocks for actions (visit, photo, review, etc.) with toast/sound feedback.

## Steps:
- [ ] 1. Apply DB schema (users.xp/level/daily_xp, user_actions, user_badges, app_rules seed from app_rules_rows.sql, badges seed from badges_rows (1).sql)
- [x] 2. Extended src/lib/services/gamification.ts (awardXP central fn, upgraded triggers)
- [x] 3. Created src/hooks/useGamification.ts (hook for UI/sound/toast triggers)
- [x] 4a. Integrated core triggers (AddHotspotModal, ReviewsSection, CreateMemoryModal)
- [ ] 5. Test all actions + anti-abuse (cooldowns, daily cap)
- [ ] 6. Update TODO_BADGES.md + attempt_completion

**Current progress marked as incomplete until done.**
