import { Block, Beat, Vector, Point } from "../types";
import tombola from "../tombola";
import * as constants from "../constants";
import {
  shuffleArray,
  enclosedIn,
  intersects,
  getLineBetween,
  getPointAlongLine,
  getDistance,
  getBounds,
} from "../utils";

import params from "./index";

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

const getBlockAdjustmentForVideo = (block: Block, video: Block): Block => {
  const videoBounds = getBounds(video);
  const blockBounds = getBounds(block);

  const topDistance = blockBounds.bottom - videoBounds.top;
  const rightDistance = videoBounds.right - blockBounds.left;
  const leftDistance = blockBounds.right - videoBounds.left;
  const bottomDistance = videoBounds.bottom - blockBounds.top;

  const intersectsTop =
    blockBounds.top < videoBounds.top && blockBounds.bottom > videoBounds.top;
  const intersectsRight =
    blockBounds.left < videoBounds.right &&
    blockBounds.right > videoBounds.right;
  const intersectsLeft =
    blockBounds.left < videoBounds.left && blockBounds.right > videoBounds.left;
  const intersectsBottom =
    blockBounds.top < videoBounds.bottom &&
    blockBounds.bottom > videoBounds.bottom;

  const minDistance = Math.min(
    intersectsTop ? topDistance : Infinity,
    intersectsRight ? rightDistance : Infinity,
    intersectsLeft ? leftDistance : Infinity,
    intersectsBottom ? bottomDistance : Infinity
  );

  let adjustment: Block = { x: 0, y: 0, width: 0, height: 0 };
  let isSpecial = false;

  if (minDistance === topDistance && intersectsTop) {
    // Just need to adjust the height.
    adjustment = { x: 0, y: 0, width: 0, height: -topDistance };
  } else if (minDistance === rightDistance && intersectsRight) {
    // Need to adjust width and x coordinate.
    adjustment = { x: rightDistance, y: 0, width: -rightDistance, height: 0 };
  } else if (minDistance === leftDistance && intersectsLeft) {
    // Just need to adjust the width.
    adjustment = { x: 0, y: 0, width: -leftDistance, height: 0 };
  } else if (minDistance === bottomDistance && intersectsBottom) {
    // Need to adjust height and y coordinate.
    adjustment = {
      x: 0,
      y: bottomDistance,
      width: 0,
      height: -bottomDistance,
    };
  }

  return adjustment;
};

export const randomizeBlocks = (
  screenWidth: number,
  screenHeight: number
): void => {
  const backgroundBlocks = getBlockBounds(screenWidth, screenHeight)
    // Don't include blocks that are completely inside one of the videos.
    .filter((block) =>
      params.videos.every((video) => !enclosedIn(block, video.bounds))
    )
    // Add some properties for fancy color stuff.
    .map((block) => ({
      ...block,
      color: {
        r: constants.BLOCK_BASE_COLOR.r,
        g: constants.BLOCK_BASE_COLOR.g,
        b: constants.BLOCK_BASE_COLOR.b + tombola.fudge(200, 0.1),
        a: 1,
      },
      colorChangeDirection: tombola.item([-1, 1]),
      intersectingVideos: params.videos.map((video) => {
        const intersectsWithVideo = intersects(block, video.bounds);
        return {
          intersects: intersectsWithVideo,
          adjustment: intersectsWithVideo
            ? getBlockAdjustmentForVideo(block, video.bounds)
            : { x: 0, y: 0, width: 0, height: 0 },
        };
      }),
    }));

  const shuffledBlocks = shuffleArray(backgroundBlocks);

  // Track which blocks intersect with videos.
  shuffledBlocks.forEach((block, blockIndex) => {
    for (const [videoIndex, video] of block.intersectingVideos.entries()) {
      if (video.intersects) {
        params.videos[videoIndex].intersectingBlocks.push(blockIndex);
      }
    }
  });

  params.blocks = shuffledBlocks;
};

export const updateBlocksTick = () => {
  const minB = constants.BLOCK_BASE_COLOR.b - 20;
  const maxB = constants.BLOCK_BASE_COLOR.b + 20;

  params.blocks.forEach((block) => {
    block.color.b += tombola.rangeFloat(0, 0.75) * block.colorChangeDirection;

    if (
      (block.color.b <= minB && block.colorChangeDirection === -1) ||
      (block.color.b >= maxB && block.colorChangeDirection === 1)
    ) {
      block.colorChangeDirection *= -1;
    }
  });
};

export const updateBlocksBeat = (beat: Beat) => {};
