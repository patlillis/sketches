import tombola from "./tombola";
import * as constants from "./constants";
import { shuffleArray } from "./utils";

type Video = { x: number; y: number };
type Block = {
  x: number;
  y: number;
  width: number;
  height: number;

  // Whether this block is edging around a specific video.
  edgingForVideo?: number;
};

type Params = {
  videos: Array<Video>;

  blocks: Array<Block>;
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
): { x: number; y: number } => {
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

  return { x, y };
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
    params.videos.push(v1Coords);

    // Place second video.
    const v2Coords = getVideoCoordsInQuardrant(screenWidth, screenHeight, {
      topHalf: true,
      leftHalf: !singleVideoOnLeft,
    });
    params.videos.push(v2Coords);

    // Place third video.
    const v3Coords = getVideoCoordsInQuardrant(screenWidth, screenHeight, {
      topHalf: false,
      leftHalf: !singleVideoOnLeft,
    });
    params.videos.push(v3Coords);
  } else {
    // Two rows on top of each other.
    const singleVideoOnTop = tombola.percent(50);

    // Place first video in a half by itself.
    const v1Coords = getVideoCoordsInQuardrant(screenWidth, screenHeight, {
      leftHalf: tombola.percent(50),
      topHalf: singleVideoOnTop,
    });
    params.videos.push(v1Coords);

    // Place second video.
    const v2Coords = getVideoCoordsInQuardrant(screenWidth, screenHeight, {
      topHalf: !singleVideoOnTop,
      leftHalf: true,
    });
    params.videos.push(v2Coords);

    // Place third video.
    const v3Coords = getVideoCoordsInQuardrant(screenWidth, screenHeight, {
      topHalf: !singleVideoOnTop,
      leftHalf: false,
    });
    params.videos.push(v3Coords);
  }
};

const getEdgingBlocksForVideo = (
  video: Video,
  videoIndex: number
): Array<Block> => {
  const videoBlocks = [];

  // Place left side edging blocks.
  let blockY =
    video.y - tombola.rangeFloat(0, constants.VIDEO_BLOCK_MAX_OVERHANG_OUTER);
  while (blockY < video.y + constants.VIDEO_HEIGHT) {
    const overhangInner = tombola.rangeFloat(
      0,
      constants.VIDEO_BLOCK_MAX_OVERHANG_INNER
    );
    const overhangOuter = tombola.rangeFloat(
      0,
      // Make sure combined overhangs aren't greater than max block size.
      Math.min(
        constants.VIDEO_BLOCK_MAX_OVERHANG_OUTER,
        constants.BLOCK_MAX_SIZE - overhangInner
      )
    );
    const x = video.x - overhangOuter;
    const width = overhangInner + overhangOuter;
    const height = tombola.rangeFloat(
      width / constants.BLOCK_MIN_ASPECT,
      width / constants.BLOCK_MAX_ASPECT
    );
    videoBlocks.push({
      x,
      y: blockY,
      width,
      height,
      edgingForVideoIndex: videoIndex,
    });

    blockY += tombola.rangeFloat(
      height - constants.VIDEO_BLOCK_MAX_BLOCK_OVERLAP,
      height
    );
  }

  // Place right side edging blocks.
  blockY =
    video.y - tombola.rangeFloat(0, constants.VIDEO_BLOCK_MAX_OVERHANG_OUTER);
  while (blockY < video.y + constants.VIDEO_HEIGHT) {
    const overhangInner = tombola.rangeFloat(
      0,
      constants.VIDEO_BLOCK_MAX_OVERHANG_INNER
    );
    const overhangOuter = tombola.rangeFloat(
      0,
      // Make sure combined overhangs aren't greater than max block size.
      Math.min(
        constants.VIDEO_BLOCK_MAX_OVERHANG_OUTER,
        constants.BLOCK_MAX_SIZE - overhangInner
      )
    );
    const x = video.x + constants.VIDEO_WIDTH - overhangInner;
    const width = overhangInner + overhangOuter;
    const height = tombola.rangeFloat(
      width / constants.BLOCK_MIN_ASPECT,
      width / constants.BLOCK_MAX_ASPECT
    );
    videoBlocks.push({
      x,
      y: blockY,
      width,
      height,
      edgingForVideoIndex: videoIndex,
    });

    blockY += tombola.rangeFloat(
      height - constants.VIDEO_BLOCK_MAX_BLOCK_OVERLAP,
      height
    );
  }

  // Place top side edging blocks.
  let blockX =
    video.x - tombola.rangeFloat(0, constants.VIDEO_BLOCK_MAX_OVERHANG_OUTER);
  while (blockX < video.x + constants.VIDEO_WIDTH) {
    const overhangInner = tombola.rangeFloat(
      0,
      constants.VIDEO_BLOCK_MAX_OVERHANG_INNER
    );
    const overhangOuter = tombola.rangeFloat(
      0,
      // Make sure combined overhangs aren't greater than max block size.
      Math.min(
        constants.VIDEO_BLOCK_MAX_OVERHANG_OUTER,
        constants.BLOCK_MAX_SIZE - overhangInner
      )
    );
    const y = video.y - overhangOuter;
    const height = overhangInner + overhangOuter;
    const width = tombola.rangeFloat(
      height * constants.BLOCK_MIN_ASPECT,
      height * constants.BLOCK_MAX_ASPECT
    );
    videoBlocks.push({
      x: blockX,
      y,
      width,
      height,
      edgingForVideoIndex: videoIndex,
    });

    blockX += tombola.rangeFloat(
      width - constants.VIDEO_BLOCK_MAX_BLOCK_OVERLAP,
      width
    );
  }

  // Place bottom side edging blocks.
  blockX =
    video.x - tombola.rangeFloat(0, constants.VIDEO_BLOCK_MAX_OVERHANG_OUTER);
  while (blockX < video.x + constants.VIDEO_WIDTH) {
    const overhangInner = tombola.rangeFloat(
      0,
      constants.VIDEO_BLOCK_MAX_OVERHANG_INNER
    );
    const overhangOuter = tombola.rangeFloat(
      0,
      // Make sure combined overhangs aren't greater than max block size.
      Math.min(
        constants.VIDEO_BLOCK_MAX_OVERHANG_OUTER,
        constants.BLOCK_MAX_SIZE - overhangInner
      )
    );
    const y = video.y + constants.VIDEO_HEIGHT - overhangInner;
    const height = overhangInner + overhangOuter;
    const width = tombola.rangeFloat(
      height * constants.BLOCK_MIN_ASPECT,
      height * constants.BLOCK_MAX_ASPECT
    );
    videoBlocks.push({
      x: blockX,
      y,
      width,
      height,
      edgingForVideoIndex: videoIndex,
    });

    blockX += tombola.rangeFloat(
      width - constants.VIDEO_BLOCK_MAX_BLOCK_OVERLAP,
      width
    );
  }

  return shuffleArray(videoBlocks);
};

const randomizeBlocks = (screenWidth: number, screenHeight: number): void => {
  params.blocks = [];

  const blocks = [];
  params.videos.forEach((video, index) => {
    blocks.push(...shuffleArray(getEdgingBlocksForVideo(video, index)));
  });
  params.blocks.push(...shuffleArray(blocks));
};

/**
 * Update the current params. Should be called every frame.
 */
export const updateParams = () => {};

export default params;
