import { RGBA, HSLA } from "./types";
import { rgbaToHsla, colorToString } from "./utils";

type Palette = {
  background: HSLA;
  debugLines: HSLA;
  harpBar: HSLA;
};

type PaletteStrings = { [key in keyof Palette]: string };

const loadPalette = async (
  imgPath: string
): Promise<{ palette: Palette; paletteStrings: PaletteStrings }> =>
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
        background: rgbaToHsla(colors[0]),
        debugLines: rgbaToHsla(colors[1]),
        harpBar: rgbaToHsla(colors[2]),
      };
      const paletteStrings = Object.fromEntries(
        Object.entries(palette).map(([name, color]) => [
          name,
          colorToString(color),
        ])
      ) as PaletteStrings;
      resolve({ palette, paletteStrings });
    };
    img.onerror = reject;

    img.src = imgPath;
  });

export { loadPalette };
export type { Palette, PaletteStrings };
