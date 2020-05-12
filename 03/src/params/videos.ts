import { Block, Beat } from "../types";
import tombola from "../tombola";
import * as constants from "../constants";

import params from "./index";

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

export const randomizeVideos = (
  screenWidth: number,
  screenHeight: number
): void => {
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
    params.videos.push({ bounds: v1Coords, intersectingBlocks: [] });

    // Place second video.
    const v2Coords = getVideoCoordsInQuardrant(screenWidth, screenHeight, {
      topHalf: true,
      leftHalf: !singleVideoOnLeft,
    });
    params.videos.push({ bounds: v2Coords, intersectingBlocks: [] });

    // Place third video.
    const v3Coords = getVideoCoordsInQuardrant(screenWidth, screenHeight, {
      topHalf: false,
      leftHalf: !singleVideoOnLeft,
    });
    params.videos.push({ bounds: v3Coords, intersectingBlocks: [] });
  } else {
    // Two rows on top of each other.
    const singleVideoOnTop = tombola.percent(50);

    // Place first video in a half by itself.
    const v1Coords = getVideoCoordsInQuardrant(screenWidth, screenHeight, {
      leftHalf: tombola.percent(50),
      topHalf: singleVideoOnTop,
    });
    params.videos.push({ bounds: v1Coords, intersectingBlocks: [] });

    // Place second video.
    const v2Coords = getVideoCoordsInQuardrant(screenWidth, screenHeight, {
      topHalf: !singleVideoOnTop,
      leftHalf: true,
    });
    params.videos.push({ bounds: v2Coords, intersectingBlocks: [] });

    // Place third video.
    const v3Coords = getVideoCoordsInQuardrant(screenWidth, screenHeight, {
      topHalf: !singleVideoOnTop,
      leftHalf: false,
    });
    params.videos.push({ bounds: v3Coords, intersectingBlocks: [] });
  }
};

export const updateVideosTick = () => {};

export const updateVideosBeat = (beat: Beat) => {};
