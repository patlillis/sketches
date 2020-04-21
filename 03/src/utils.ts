/**
 * Shuffles an array, and returns a new array.
 *
 * Original array is not modified.
 */
export const shuffleArray = (array: any[]): any[] => {
  const newArray = array.slice(0);
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};
