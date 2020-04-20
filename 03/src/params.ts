import tombola from "./tombola";
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_PADDING } from "./constants";
// import

type Params = {
  videos: Array<{
    x: number;
    y: number;
  }>;
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
};

const getVideoCoordsInQuardrant = (
  screenWidth: number,
  screenHeight: number,
  { leftHalf, topHalf }: { leftHalf: boolean; topHalf: boolean }
): { x: number; y: number } => {
  const xOffset = tombola.rangeFloat(
    0,
    screenWidth / 2 - VIDEO_WIDTH - VIDEO_PADDING * 1.5
  );
  const x = leftHalf
    ? xOffset + VIDEO_PADDING
    : screenWidth / 2 + VIDEO_PADDING / 2;

  const yOffset = tombola.rangeFloat(
    0,
    screenHeight / 2 - VIDEO_HEIGHT - VIDEO_PADDING * 1.5
  );
  const y = topHalf
    ? yOffset + VIDEO_PADDING
    : screenHeight / 2 + VIDEO_PADDING / 2;

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

/**
 * Update the current params. Should be called every frame.
 */
export const updateParams = () => {};

export default params;
