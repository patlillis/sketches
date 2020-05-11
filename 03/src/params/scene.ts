import { Block, Beat, Scene } from "../types";
import tombola from "../tombola";
import * as constants from "../constants";
import { shuffleArray } from "../utils";

import params from "./index";

export const initSceneParams = () => {
  params.scene = {
    current: Scene.Main,
    previous: null,
    transition: 1,
  };
};

export const randomizeSceneParam = (): void => {};

export const updateSceneParamTick = () => {};

export const updateSceneParamBeat = (beat: Beat) => {};
