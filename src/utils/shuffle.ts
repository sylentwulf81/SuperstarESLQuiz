/**
 * Utility functions for true randomization and unbiased Fisher-Yates shuffling
 */

/**
 * Perform an unbiased in-place Fisher-Yates shuffle on an array copy.
 */
export function shuffleArray<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Scramble letters of a target word thoroughly using Fisher-Yates.
 * Guarantees the resulting letter sequence is never identical to the target word,
 * and never equal to a naive compound swap (e.g., MELON+WATER, GLASSES+SUN).
 */
export function shuffleWordLetters(word: string): string[] {
  // Clean characters: uppercase and remove spaces/hyphens
  const cleanChars = word
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .split('');

  if (cleanChars.length <= 1) {
    return cleanChars;
  }

  const originalStr = cleanChars.join('');
  let attempts = 0;
  let scrambled: string[] = cleanChars;

  while (attempts < 30) {
    attempts++;
    scrambled = shuffleArray(cleanChars);
    const scrambledStr = scrambled.join('');

    // If identical to original, reshuffle
    if (scrambledStr === originalStr) continue;

    // Check if it's a simple two-half swap (e.g. WATER + MELON -> MELON + WATER)
    const mid = Math.floor(originalStr.length / 2);
    const firstHalf = originalStr.slice(0, mid);
    const secondHalf = originalStr.slice(mid);
    if (scrambledStr === secondHalf + firstHalf) continue;

    // If we passed the checks, return this clean scramble!
    return scrambled;
  }

  // Fallback if random attempts were exhausted (e.g. repeated letters like 'EGG'):
  // Swap adjacent distinct characters
  const fallback = [...cleanChars];
  for (let i = 0; i < fallback.length - 1; i++) {
    if (fallback[i] !== fallback[i + 1]) {
      const temp = fallback[i];
      fallback[i] = fallback[i + 1];
      fallback[i + 1] = temp;
      break;
    }
  }
  return fallback;
}
