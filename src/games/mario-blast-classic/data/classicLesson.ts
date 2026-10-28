export const DEFAULT_CLASSIC_LESSON_GOAL = 'Make this into a “Have you ever…?” question';

const STORAGE_KEY = 'mp_classic_lesson_goal_v1';

/** The default goal is used only until the teacher sets one; a cleared goal stays empty. */
export function loadClassicLessonGoal(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored.trim();
  } catch {
    // ignore
  }
  return DEFAULT_CLASSIC_LESSON_GOAL;
}

export function persistClassicLessonGoal(goal: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, goal.trim());
  } catch {
    // ignore
  }
}

export function resetClassicLessonGoal(): string {
  persistClassicLessonGoal(DEFAULT_CLASSIC_LESSON_GOAL);
  return DEFAULT_CLASSIC_LESSON_GOAL;
}
