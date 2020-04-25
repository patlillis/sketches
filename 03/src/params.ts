import { Block, intersects, Color } from "./types";
import tombola from "./tombola";
import * as constants from "./constants";
import { shuffleArray, clamp } from "./utils";
type Video = { bounds: Block };

type Params = {
  videos: Array<Video>;
  blocks: Array<Block & { color: Color }>;
};

/**
 * Randomized parameters that control how the scene renders.
 */
const params = {} as Params;

/**
 * Re-randomize the params.
 */
export const randomizeParams = (
  screenWidth: number,
  screenHeight: number
): void => {
  randomizeVideos(screenWidth, screenHeight);
  randomizeBlocks(screenWidth, screenHeight);
};

const getVideoCoordsInQuardrant = (
  screenWidth: number,
  screenHeight: number,
  { leftHalf, topHalf }: { leftHalf: boolean; topHalf: boolean }
): Block => {
  const xOffset = tombola.rangeFloat(
    0,
    screenWidth / 2 - constants.VIDEO_WIDTH - constants.VIDEO_PADDING * 1.5
  );
  const x = leftHalf
    ? xOffset + constants.VIDEO_PADDING
    : xOffset + screenWidth / 2 + constants.VIDEO_PADDING / 2;

  const yOffset = tombola.rangeFloat(
    0,
    screenHeight / 2 - constants.VIDEO_HEIGHT - constants.VIDEO_PADDING * 1.5
  );
  const y = topHalf
    ? yOffset + constants.VIDEO_PADDING
    : yOffset + screenHeight / 2 + constants.VIDEO_PADDING / 2;

  return { x, y, width: constants.VIDEO_WIDTH, height: constants.VIDEO_HEIGHT };
};

const randomizeVideos = (screenWidth: number, screenHeight: number): void => {
  params.videos = [];

  const divideIntoColumns = tombola.percent(50);

  if (divideIntoColumns) {
    // Two side-by-side-columns
    const singleVideoOnLeft = tombola.percent(50);

    // Place first video in a half by itself.
    const v1Coords = getVideoCoordsInQuardrant(screenWidth, screenHeight, {
      leftHalf: singleVideoOnLeft,
      topHalf: tombola.percent(50),
    });
    params.videos.push({ bounds: v1Coords });

    // Place second video.
    const v2Coords = getVideoCoordsInQuardrant(screenWidth, screenHeight, {
      topHalf: true,
      leftHalf: !singleVideoOnLeft,
    });
    params.videos.push({ bounds: v2Coords });

    // Place third video.
    const v3Coords = getVideoCoordsInQuardrant(screenWidth, screenHeight, {
      topHalf: false,
      leftHalf: !singleVideoOnLeft,
    });
    params.videos.push({ bounds: v3Coords });
  } else {
    // Two rows on top of each other.
    const singleVideoOnTop = tombola.percent(50);

    // Place first video in a half by itself.
    const v1Coords = getVideoCoordsInQuardrant(screenWidth, screenHeight, {
      leftHalf: tombola.percent(50),
      topHalf: singleVideoOnTop,
    });
    params.videos.push({ bounds: v1Coords });

    // Place second video.
    const v2Coords = getVideoCoordsInQuardrant(screenWidth, screenHeight, {
      topHalf: !singleVideoOnTop,
      leftHalf: true,
    });
    params.videos.push({ bounds: v2Coords });

    // Place third video.
    const v3Coords = getVideoCoordsInQuardrant(screenWidth, screenHeight, {
      topHalf: !singleVideoOnTop,
      leftHalf: false,
    });
    params.videos.push({ bounds: v3Coords });
  }
};

const getBlockBounds = (
  screenWidth: number,
  screenHeight: number
): Array<Block> => {
  const blocks: Array<Block> = [];

  let previousRow: Array<Block> = [];
  let index = 0;
  // Set up initial row based on top of screen.
  for (let prevX = 0; prevX < screenWidth; index++) {
    let block: Block;
    if (prevX === 0) {
      // First block.
      block = {
        x: 0,
        y: 0 - tombola.rangeFloat(0, constants.VIDEO_BLOCK_MAX_OVERHANG_OUTER),
        width: tombola.rangeFloat(
          constants.BLOCK_MIN_SIZE,
          constants.BLOCK_MAX_SIZE
        ),
        height: tombola.rangeFloat(
          constants.BLOCK_MIN_SIZE,
          constants.BLOCK_MAX_SIZE
        ),
      };
    } else {
      // Other blocks, set based on previous block.
      const previousBlock = previousRow[previousRow.length - 1];
      block = {
        x:
          prevX -
          tombola.rangeFloat(0, constants.VIDEO_BLOCK_MAX_BLOCK_OVERLAP),
        y: 0 - tombola.rangeFloat(0, constants.VIDEO_BLOCK_MAX_OVERHANG_OUTER),
        width: tombola.rangeFloat(
          constants.BLOCK_MIN_SIZE,
          constants.BLOCK_MAX_SIZE
        ),
        height: tombola.rangeFloat(
          constants.BLOCK_MIN_SIZE,
          constants.BLOCK_MAX_SIZE
        ),
      };
    }

    prevX = block.x + block.width;
    previousRow.push(block);
  }

  // Set up subsequent rows based on previous row.
  let allBlocksInRowOffscreen = false;
  while (!allBlocksInRowOffscreen) {
    const newRow: Array<Block> = [];
    allBlocksInRowOffscreen = true;

    // Do stuff, check if each block is off-screen.
    let previousRowIndex = 0;
    index = 0;
    for (
      let prevBlockRightSide = 0;
      prevBlockRightSide < screenWidth;
      index++
    ) {
      const x =
        prevBlockRightSide -
        tombola.rangeFloat(0, constants.VIDEO_BLOCK_MAX_BLOCK_OVERLAP);
      const width = tombola.rangeFloat(
        constants.BLOCK_MIN_SIZE,
        constants.BLOCK_MAX_SIZE
      );

      // Figure out which blocks of the previous row this block will intersect
      // with.
      let previousRowMinBottom = Infinity;
      while (previousRowIndex < previousRow.length) {
        const previousRowBlock = previousRow[previousRowIndex];
        if (previousRowBlock.x > x + width) break;

        previousRowMinBottom = Math.min(
          previousRowMinBottom,
          previousRowBlock.y + previousRowBlock.height
        );
        previousRowIndex++;
      }
      previousRowIndex--;
      const y =
        previousRowMinBottom -
        tombola.rangeFloat(0, constants.VIDEO_BLOCK_MAX_BLOCK_OVERLAP);
      const height = tombola.rangeFloat(
        constants.BLOCK_MIN_SIZE,
        constants.BLOCK_MAX_SIZE
      );

      prevBlockRightSide = x + width;
      if (y < screenHeight) allBlocksInRowOffscreen = false;
      const block = { x, y, width, height };

      newRow.push(block);
    }
    blocks.push(...previousRow);
    previousRow = newRow;
  }

  // Add last row to list of blocks.
  blocks.push(...previousRow);

  return blocks;
};

const randomizeBlocks = (screenWidth: number, screenHeight: number): void => {
  const backgroundBlocks = getBlockBounds(screenWidth, screenHeight);
  const backgroundBlocksWithColors = backgroundBlocks.map((block) => ({
    ...block,
    color: {
      r: constants.BLOCK_BASE_COLOR.r + tombola.fudge(20, 0.1),
      g: constants.BLOCK_BASE_COLOR.g + tombola.fudge(20, 0.1),
      b: constants.BLOCK_BASE_COLOR.b + tombola.fudge(20, 0.1),
    },
  }));
  params.blocks = shuffleArray(backgroundBlocksWithColors);
};

/**
 * Update the current params. Should be called every frame.
 */
export const updateParams = () => {
  params.blocks.forEach((block, index) => {
    const oldColor = block.color;
    for (const [key, value] of Object.entries(block.color)) {
      const newColor = value + tombola.fudgeFloat(1, 0.05);
      block.color[key] = clamp(
        newColor,
        constants.BLOCK_BASE_COLOR[key] - 2,
        constants.BLOCK_BASE_COLOR[key] + 2
      );
    }
  });
};

export default params;
