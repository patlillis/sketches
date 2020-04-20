// Type definitions for tombola 0.0
// Project: https://github.com/Whitevinyl/tombola.js
// Definitions by: Pat Lillis <https://github.com/patlillis>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare class Tombola {
  /**
   * Randomly generates a whole number in the range from `min` to `max`.
   */
  range(min: number, max: number): number;

  /**
   * Randomly generates a float number in the range from `min` to `max`.
   */
  rangeFloat(min: number, max: number): number;

  /**
   * Randomly generates an array of whole numbers in the range from `min` to
   * `max`.
   */
  rangeArray(min: number, max: number, length: number): number[];

  /**
   * Randomly generates an array of float numbers in the range from `min` to
   * `max`.
   */
  rangeFloatArray(min: number, max: number, length: number): number[];

  /**
   * Randomly generates a whole number from the total of simulated dice rolls.
   */
  dice(die: number, sides: number): number;

  /**
   * Randomly generates an array of whole numbers from the total of simulated
   * dice rolls.
   */
  diceArray(die: number, sides: number, length: number): number[];

  /**
   * Randomly generates a positive or negative modifier (or zero), based on
   * the concept of
   * ["Fudge dice"](https://en.wikipedia.org/wiki/Fudge_%28role-playing_game_system%29#Fudge_dice).
   */
  fudge(die: number, strength?: number): number;

  /**
   * Randomly generates a float positive or negative modifier (or zero), based
   * on the concept of
   * ["Fudge dice"](https://en.wikipedia.org/wiki/Fudge_%28role-playing_game_system%29#Fudge_dice).
   */
  fudgeFloat(die: number, strength?: number): number;

  /**
   * Randomly generates an array of positive or negative modifiers (or zero),
   * based on the concept of
   * ["Fudge dice"](https://en.wikipedia.org/wiki/Fudge_%28role-playing_game_system%29#Fudge_dice).
   */
  fudgeArray(die: number, strength: number, length: number): number[];

  /**
   * Randomly generates an array of float positive or negative modifiers (or
   * zero), based on the concept of
   * ["Fudge dice"](https://en.wikipedia.org/wiki/Fudge_%28role-playing_game_system%29#Fudge_dice).
   */
  fudgeFloatArray(die: number, strength: number, length: number): number[];

  /**
   * Randomly generates a true or false based on a probability fraction, e.g.
   * a `chance` of 1 and `possibility` of 5 will give the function a 1 in 5
   * chance of returning true.
   */
  chance(chance: number, possibility: number): boolean;

  /**
   * Randomly generates an array of true or false based on a probability
   * fraction.
   *
   * E.g. a `chance` of 1 and `possibility` of 5 will give each entry a 1 in 5
   * chance of being true.
   */
  chanceArray(chance: number, possiblity: number, length: number): boolean[];

  /**
   * Randomly generates a true or false based on a probability percentage.
   *
   *
   * E.g. a `percentage` of 25 will give the function a 25% chance of
   * returning true.
   */
  percent(percent: number): boolean;

  /**
   * Randomly generates an array of true or false based on a probability
   * percentage.
   *
   * E.g. a `percentage` of 25 will give each entry a 25% chance of being
   * true.
   */
  percentArray(percent: number, length: number): boolean[];

  /**
   * Randomly picks from an array of items (can be strings, numbers, objects
   * etc.) with equal probability.
   */
  item<T>(items: T[]): T;
  item(items: any[]): any;

  /**
   * Randomly generates a whole number with a weighted probability.
   *
   * E.g. using weights of [10, 5, 5] would pick a number between 1 - 3, where
   * 1 is twice as likely to be returned than either 2 or 3.
   */
  weightedNumber(weights: number[]): number;

  /**
   * Randomly picks from an array of items (can be strings, numbers, objects
   * etc) with a weighted probability.
   *
   * E.g. using the items ['cat', 'dog', 'tortoise'] and using weights of [10,
   * 5, 5] would randomly return one of the pets, but 'cat' would be twice as
   * likely to be returned than either 'dog' or 'tortoise'.
   */
  weightedItem<T>(items: T[], weights: number[]): T;
  weightedItem(items: any[], weights: number[]): any;

  /**
   * Randomly picks from an array of functions, using a weighted probability,
   * and executes that function.
   *
   * E.g. using an array of functions [blur, fade, dissolve], and using
   * weights of [10, 5, 5] would randomly call one of the given functions, but
   * the function 'blur' would be twice as likely to be picked than either
   * 'fade' or 'dissolve'.
   */
  weightedFunction<T>(functions: Array<() => T>, weights: number[]): T;
  weightedFunction(functions: Array<() => any>, weights: number[]): any;

  /**
   * Randomly generates an array of whole numbers, which are clustered around
   * a randomly selected point between `min` and `max`.
   *
   * `spread` sets how wide the cluster is, e.g if the center of the cluster
   * is 50, and `spread` is set to 10, generated numbers can be anything from
   * 40 to 60 (-10 and +10 of 50). The chance is evenly distributed.
   */
  cluster(quantity: number, min: number, max: number, spread: number): number[];

  /**
   * Randomly generates an array of whole numbers, which are clustered around
   * a randomly selected point between 'min' and 'max', same as
   * `tombola.cluster()`.
   *
   * The difference is that chance is not evenly distributed, it can be
   * weighted so that generated numbers are more heavily distributed around
   * the center of the cluster. Higher `strength` and fewer `die` will give a
   * more even distribution, while lower 'strength' and more 'die' will make a
   * more center-heavy cluster.
   *
   * `strength` and `die` refer to
   * ["Fudge dice"](https://en.wikipedia.org/wiki/Fudge_%28role-playing_game_system%29#Fudge_dice)
   * properties (see `tombola.fudge()`). `strength` x `die` = the total spread
   * of the cluster.
   */
  clusterFudge(
    quantity: number,
    min: number,
    max: number,
    die: number,
    strength: number
  ): number[];

  /**
   * Creates a `RandomDeck` instance.
   *
   * It's a persistant deck/hat/tombola which can contain a set of items which
   * can be randomly drawn from, added to, looked at or shuffled.
   *
   * A simple example would be if you wanted a set of names to be drawn from a
   * hat in a random order and without repetition.
   */
  deck<T>(contents?: T[]): RandomDeck<T>;
  deck(contents?: any[]): RandomDeck;

  /**
   * Creates a `WeightedDeck` instance.
   *
   * It's a persistant deck/hat/tombola which can contain a set of items which
   * can be randomly drawn from, added to, looked at or shuffled.
   *
   * A simple example would be if you wanted a set of names to be drawn from a
   * hat in a random order and without repetition.
   *
   * `contents` is an array of items to populate the deck with, `weights` add weighting to
   * the chance, and `instances` allows for multiple instances of each object.
   */
  weightedDeck<T>(
    contents?: T[],
    options?: { weights?: number[]; instances?: number[] }
  ): WeightedDeck<T>;
  weightedDeck(
    contents?: any[],
    options?: { weights?: number[]; instances?: number[] }
  ): WeightedDeck;
}

/**
 * A deck (hat/tombola) which can be drawn from, added to or shuffled.
 */
declare class RandomDeck<T = any> {
  constructor(contents?: T[]);

  /**
   * Selects an item from the deck, either randomly or at a given index, and
   * removes the item from the deck so that it won't be drawn again.
   */
  draw(index?: number): T;

  /**
   * Selects an item from the deck, either randomly or at a given index, but
   * leaves the item in the deck so that it may be looked at or drawn again.
   */
  look(index?: number): T;

  /**
   * Adds an item to the deck, either randomly or at a given index.
   */
  insert(item: T, index?: number): void;

  /**
   * Randomly shuffles the order of the deck contents.
   */
  shuffle(): void;

  /**
   * Simply returns a list of the deck contents in their current state.
   */
  show(): T[];
}

/**
 * A deck (hat/tombola) which can be drawn from, added to or shuffled.
 */
declare class WeightedDeck<T = any> {
  constructor(
    contents?: T[],
    options?: { weights?: number[]; instances?: number[] }
  );

  /**
   * Selects an item from the deck, either randomly or at a given index, and
   * removes the item from the deck so that it won't be drawn again.
   */
  draw(index?: number): T;

  /**
   * Selects an item from the deck, either randomly or at a given index, but
   * leaves the item in the deck so that it may be looked at or drawn again.
   */
  look(index?: number): T;

  /**
   * Adds an item to the deck, either randomly or at a given index.
   */
  insert(
    item: T,
    options?: { index?: number; weight?: number; instances?: number }
  ): void;

  /**
   * Randomly shuffles the order of the deck contents.
   */
  shuffle(): void;

  /**
   * Simply returns a list of the deck contents in their current state.
   */
  show(): T[];
}

export = Tombola;
