import { RGBA, HSLA } from "./types";
import { rgbaToHsla } from "./utils";

type Palette = {
  blockBase: RGBA;
  ui: HSLA;
  uiHover: HSLA;
  circleSynth: HSLA;
  circleSynthPressed: HSLA;
};

const loadPalette = async (imgPath: string): Promise<Palette> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const length = img.width;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.height = img.naturalHeight;
      canvas.width = img.naturalWidth;
      // Temporarily place image.
      ctx.drawImage(img, 0, 0, length, 1);
      // Get the image data.
      const data = ctx.getImageData(0, 0, length, 1).data;

      const colors: RGBA[] = [];
      for (let i = 0; i < length; i++) {
        const rgba: RGBA = {
          r: data[i * 4],
          g: data[i * 4 + 1],
          b: data[i * 4 + 2],
          a: 1,
        };
        colors.push(rgba);
      }

      const palette: Palette = {
        blockBase: colors[0],
        ui: rgbaToHsla(colors[1]),
        uiHover: rgbaToHsla(colors[2]),
        circleSynth: rgbaToHsla(colors[3]),
        circleSynthPressed: rgbaToHsla(colors[4]),
      };
      resolve(palette);
    };
    img.onerror = reject;

    img.src = imgPath;
  });

export { loadPalette };
export type { Palette };
