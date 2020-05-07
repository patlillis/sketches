import { Block, Beat } from "../types";
import tombola from "../tombola";
import * as constants from "../constants";
import { shuffleArray } from "../utils";

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

export const randomizeBlocks = (
  screenWidth: number,
  screenHeight: number
): void => {
  const backgroundBlocks = getBlockBounds(screenWidth, screenHeight);
  const backgroundBlocksWithColors = backgroundBlocks.map((block) => ({
    ...block,
    color: {
      r: constants.BLOCK_BASE_COLOR.r,
      g: constants.BLOCK_BASE_COLOR.g,
      b: constants.BLOCK_BASE_COLOR.b + tombola.fudge(200, 0.1),
    },
  }));
  params.blocks = shuffleArray(backgroundBlocksWithColors).map((b) => ({
    ...b,
    colorChangeDirection: tombola.percent(50) ? 1 : -1,
  }));
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
