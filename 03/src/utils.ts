/**
 * Shuffles an array, and returns a new array.
 *
 * Original array is not modified.
 */
export const shuffleArray = <T = any>(
  array: T[],
  disable: boolean = false
): T[] => {
  const newArray = array.slice(0);

  if (!disable) {
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
  }

  return newArray;
};

export const clamp = (num: number, min: number, max: number) =>
  Math.min(Math.max(num, min), max);
