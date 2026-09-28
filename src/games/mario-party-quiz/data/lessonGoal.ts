const STORAGE_PREFIX = 'mp_party_lesson_goal_v1_';

export function loadPartyLessonGoal(theme: string): string {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${theme}`) || '';
  } catch {
    return '';
  }
}

export function persistPartyLessonGoal(theme: string, goal: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${theme}`, goal);
  } catch {
    // ignore
  }
}
