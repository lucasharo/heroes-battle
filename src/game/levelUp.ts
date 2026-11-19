import { computeLevelInfo } from './dailyQuests';

export interface LevelUpEvent {
  previousLevel: number;
  newLevel: number;
  previousXp: number;
  newXp: number;
  xpGained: number;
  previousProgressPct: number;
  newProgressPct: number;
  currentLevelXp: number;
  nextLevelXpTarget: number;
  source: 'match' | 'quest';
}

export interface LevelCounterFrame {
  easedProgress: number;
  displayedLevel: number;
  displayedTotalXp: number;
  displayedXpGained: number;
  barFillPct: number;
  phase: 'charging' | 'ascending' | 'settled';
  justLeveledUp: boolean;
}

export const LEVEL_UP_ANIMATION_DURATION_MS = 1350;

export function detectAccountLevelUp(
  previousXp: number,
  newXp: number,
  source: 'match' | 'quest'
): LevelUpEvent | null {
  const safePrevXp = Math.max(0, Math.floor(previousXp));
  const safeNewXp = Math.max(safePrevXp, Math.floor(newXp));
  const prevInfo = computeLevelInfo(safePrevXp);
  const nextInfo = computeLevelInfo(safeNewXp);

  if (nextInfo.level <= prevInfo.level) {
    return null;
  }

  return {
    previousLevel: prevInfo.level,
    newLevel: nextInfo.level,
    previousXp: safePrevXp,
    newXp: safeNewXp,
    xpGained: safeNewXp - safePrevXp,
    previousProgressPct: prevInfo.progressPct,
    newProgressPct: nextInfo.progressPct,
    currentLevelXp: nextInfo.currentLevelXp,
    nextLevelXpTarget: nextInfo.nextLevelXp,
    source,
  };
}

function easeOutCubic(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 3);
}

/**
 * Computes deterministic frame state for the post-game level-up animation:
 * - 0.00 -> 0.38: "charging" (previous XP bar surges to 100%, XP counter ticks up)
 * - 0.38 -> 0.88: "ascending" (level counter ticks up from previousLevel -> newLevel, bar fills new level)
 * - 0.88 -> 1.00: "settled" (holds at final newLevel and target progressPct)
 */
export function computeLevelCounterFrame(
  event: LevelUpEvent,
  elapsedMs: number,
  durationMs: number = LEVEL_UP_ANIMATION_DURATION_MS
): LevelCounterFrame {
  const safeDuration = Math.max(1, durationMs);
  const rawT = Math.max(0, Math.min(1, elapsedMs / safeDuration));
  const easedProgress = easeOutCubic(rawT);

  const displayedTotalXp = Math.round(
    event.previousXp + (event.newXp - event.previousXp) * easedProgress
  );
  const displayedXpGained = Math.round(event.xpGained * easedProgress);

  const levelDelta = Math.max(1, event.newLevel - event.previousLevel);

  if (rawT < 0.38) {
    const chargeT = easeOutCubic(rawT / 0.38);
    const barFillPct = Math.round(
      event.previousProgressPct + (100 - event.previousProgressPct) * chargeT
    );
    return {
      easedProgress,
      displayedLevel: event.previousLevel,
      displayedTotalXp,
      displayedXpGained,
      barFillPct: Math.max(0, Math.min(100, barFillPct)),
      phase: 'charging',
      justLeveledUp: false,
    };
  }

  if (rawT < 0.88) {
    const ascendT = (rawT - 0.38) / 0.5;
    const stepped = Math.min(
      levelDelta,
      1 + Math.floor(easeOutCubic(ascendT) * levelDelta)
    );
    const displayedLevel = Math.min(event.newLevel, event.previousLevel + stepped);
    const barT = easeOutCubic(ascendT);
    const barFillPct = Math.round(event.newProgressPct * barT);
    return {
      easedProgress,
      displayedLevel,
      displayedTotalXp,
      displayedXpGained,
      barFillPct: Math.max(0, Math.min(100, barFillPct)),
      phase: 'ascending',
      justLeveledUp: displayedLevel > event.previousLevel,
    };
  }

  return {
    easedProgress: 1,
    displayedLevel: event.newLevel,
    displayedTotalXp: event.newXp,
    displayedXpGained: event.xpGained,
    barFillPct: Math.max(0, Math.min(100, event.newProgressPct)),
    phase: 'settled',
    justLeveledUp: true,
  };
}
