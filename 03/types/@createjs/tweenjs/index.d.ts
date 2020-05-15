// Type definitions for TweenJS 1.0.2
// Project: http://www.createjs.com/#!/TweenJS
// Definitions by: Pedro Ferreira <https://bitbucket.org/drk4>, Chris Smith <https://github.com/evilangelist>, J.C <https://github.com/jcyuan>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/*
    Copyright (c) 2012 Pedro Ferreira
    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Library documentation : http://www.createjs.com/Docs/TweenJS/modules/TweenJS.html

declare module "@createjs/tweenjs" {
  export class Ticker {
    // properties
    static framerate: number;
    static interval: number;
    static maxDelta: number;
    static paused: boolean;
    static RAF: string;
    static RAF_SYNCHED: string;
    static TIMEOUT: string;
    static timingMode: string;
    /**
     * @deprecated
     */
    static useRAF: boolean;

    // methods
    static getEventTime(runTime?: boolean): number;
    /**
     * @deprecated - use the 'framerate' property instead
     */
    static getFPS(): number;
    /**
     * @deprecated - use the 'interval' property instead
     */
    static getInterval(): number;
    static getMeasuredFPS(ticks?: number): number;
    static getMeasuredTickTime(ticks?: number): number;
    /**
     * @deprecated - use the 'paused' property instead
     */
    static getPaused(): boolean;
    static getTicks(pauseable?: boolean): number;
    static getTime(runTime?: boolean): number;
    static init(): void;
    static reset(): void;
    /**
     * @deprecated - use the 'framerate' property instead
     */
    static setFPS(value: number): void;
    /**
     * @deprecated - use the 'interval' property instead
     */
    static setInterval(interval: number): void;
    /**
     * @deprecated - use the 'paused' property instead
     */
    static setPaused(value: boolean): void;

    // EventDispatcher mixins
    static addEventListener(
      type: string,
      listener: (eventObj: Object) => boolean,
      useCapture?: boolean
    ): Function;
    static addEventListener(
      type: string,
      listener: (eventObj: Object) => void,
      useCapture?: boolean
    ): Function;
    static addEventListener(
      type: string,
      listener: { handleEvent: (eventObj: Object) => boolean },
      useCapture?: boolean
    ): Object;
    static addEventListener(
      type: string,
      listener: { handleEvent: (eventObj: Object) => void },
      useCapture?: boolean
    ): Object;
    static dispatchEvent(
      eventObj: Object | string | Event,
      target?: Object
    ): boolean;
    static hasEventListener(type: string): boolean;
    static off(
      type: string,
      listener: (eventObj: Object) => boolean,
      useCapture?: boolean
    ): void;
    static off(
      type: string,
      listener: (eventObj: Object) => void,
      useCapture?: boolean
    ): void;
    static off(
      type: string,
      listener: { handleEvent: (eventObj: Object) => boolean },
      useCapture?: boolean
    ): void;
    static off(
      type: string,
      listener: { handleEvent: (eventObj: Object) => void },
      useCapture?: boolean
    ): void;
    static off(type: string, listener: Function, useCapture?: boolean): void; // It is necessary for "arguments.callee"
    static on(
      type: string,
      listener: (eventObj: Object) => boolean,
      scope?: Object,
      once?: boolean,
      data?: any,
      useCapture?: boolean
    ): Function;
    static on(
      type: string,
      listener: (eventObj: Object) => void,
      scope?: Object,
      once?: boolean,
      data?: any,
      useCapture?: boolean
    ): Function;
    static on(
      type: string,
      listener: { handleEvent: (eventObj: Object) => boolean },
      scope?: Object,
      once?: boolean,
      data?: any,
      useCapture?: boolean
    ): Object;
    static on(
      type: string,
      listener: { handleEvent: (eventObj: Object) => void },
      scope?: Object,
      once?: boolean,
      data?: any,
      useCapture?: boolean
    ): Object;
    static removeAllEventListeners(type?: string): void;
    static removeEventListener(
      type: string,
      listener: (eventObj: Object) => boolean,
      useCapture?: boolean
    ): void;
    static removeEventListener(
      type: string,
      listener: (eventObj: Object) => void,
      useCapture?: boolean
    ): void;
    static removeEventListener(
      type: string,
      listener: { handleEvent: (eventObj: Object) => boolean },
      useCapture?: boolean
    ): void;
    static removeEventListener(
      type: string,
      listener: { handleEvent: (eventObj: Object) => void },
      useCapture?: boolean
    ): void;
    static removeEventListener(
      type: string,
      listener: Function,
      useCapture?: boolean
    ): void; // It is necessary for "arguments.callee"
    static toString(): string;
    static willTrigger(type: string): boolean;
  }

  export class EventDispatcher {
    constructor();

    // methods
    addEventListener(
      type: string,
      listener: (eventObj: Object) => boolean,
      useCapture?: boolean
    ): Function;
    addEventListener(
      type: string,
      listener: (eventObj: Object) => void,
      useCapture?: boolean
    ): Function;
    addEventListener(
      type: string,
      listener: { handleEvent: (eventObj: Object) => boolean },
      useCapture?: boolean
    ): Object;
    addEventListener(
      type: string,
      listener: { handleEvent: (eventObj: Object) => void },
      useCapture?: boolean
    ): Object;
    dispatchEvent(eventObj: Object, target?: Object): boolean;
    dispatchEvent(eventObj: string, target?: Object): boolean;
    dispatchEvent(eventObj: Event, target?: Object): boolean;
    hasEventListener(type: string): boolean;
    static initialize(target: Object): void;
    off(
      type: string,
      listener: (eventObj: Object) => boolean,
      useCapture?: boolean
    ): void;
    off(
      type: string,
      listener: (eventObj: Object) => void,
      useCapture?: boolean
    ): void;
    off(
      type: string,
      listener: { handleEvent: (eventObj: Object) => boolean },
      useCapture?: boolean
    ): void;
    off(
      type: string,
      listener: { handleEvent: (eventObj: Object) => void },
      useCapture?: boolean
    ): void;
    off(type: string, listener: Function, useCapture?: boolean): void; // It is necessary for "arguments.callee"
    on(
      type: string,
      listener: (eventObj: Object) => boolean,
      scope?: Object,
      once?: boolean,
      data?: any,
      useCapture?: boolean
    ): Function;
    on(
      type: string,
      listener: (eventObj: Object) => void,
      scope?: Object,
      once?: boolean,
      data?: any,
      useCapture?: boolean
    ): Function;
    on(
      type: string,
      listener: { handleEvent: (eventObj: Object) => boolean },
      scope?: Object,
      once?: boolean,
      data?: any,
      useCapture?: boolean
    ): Object;
    on(
      type: string,
      listener: { handleEvent: (eventObj: Object) => void },
      scope?: Object,
      once?: boolean,
      data?: any,
      useCapture?: boolean
    ): Object;
    removeAllEventListeners(type?: string): void;
    removeEventListener(
      type: string,
      listener: (eventObj: Object) => boolean,
      useCapture?: boolean
    ): void;
    removeEventListener(
      type: string,
      listener: (eventObj: Object) => void,
      useCapture?: boolean
    ): void;
    removeEventListener(
      type: string,
      listener: { handleEvent: (eventObj: Object) => boolean },
      useCapture?: boolean
    ): void;
    removeEventListener(
      type: string,
      listener: { handleEvent: (eventObj: Object) => void },
      useCapture?: boolean
    ): void;
    removeEventListener(
      type: string,
      listener: Function,
      useCapture?: boolean
    ): void; // It is necessary for "arguments.callee"
    toString(): string;
    willTrigger(type: string): boolean;
  }

  export class Ease {
    // methods
    static backIn: (amount: number) => number;
    static backInOut: (amount: number) => number;
    static backOut: (amount: number) => number;
    static bounceIn: (amount: number) => number;
    static bounceInOut: (amount: number) => number;
    static bounceOut: (amount: number) => number;
    static circIn: (amount: number) => number;
    static circInOut: (amount: number) => number;
    static circOut: (amount: number) => number;
    static cubicIn: (amount: number) => number;
    static cubicInOut: (amount: number) => number;
    static cubicOut: (amount: number) => number;
    static elasticIn: (amount: number) => number;
    static elasticInOut: (amount: number) => number;
    static elasticOut: (amount: number) => number;
    static get(amount: number): (amount: number) => number;
    static getBackIn(amount: number): (amount: number) => number;
    static getBackInOut(amount: number): (amount: number) => number;
    static getBackOut(amount: number): (amount: number) => number;
    static getElasticIn(
      amplitude: number,
      period: number
    ): (amount: number) => number;
    static getElasticInOut(
      amplitude: number,
      period: number
    ): (amount: number) => number;
    static getElasticOut(
      amplitude: number,
      period: number
    ): (amount: number) => number;
    static getPowIn(pow: number): (amount: number) => number;
    static getPowInOut(pow: number): (amount: number) => number;
    static getPowOut(pow: number): (amount: number) => number;
    static linear: (amount: number) => number;
    static none: (amount: number) => number; // same as linear
    static quadIn: (amount: number) => number;
    static quadInOut: (amount: number) => number;
    static quadOut: (amount: number) => number;
    static quartIn: (amount: number) => number;
    static quartInOut: (amount: number) => number;
    static quartOut: (amount: number) => number;
    static quintIn: (amount: number) => number;
    static quintInOut: (amount: number) => number;
    static quintOut: (amount: number) => number;
    static sineIn: (amount: number) => number;
    static sineInOut: (amount: number) => number;
    static sineOut: (amount: number) => number;
  }

  export type TweenProps = {
    useTicks?: boolean;
    ignoreGlobalPause?: boolean;
    loop?: number;
    reversed?: boolean;
    bounce?: boolean;
    timeScale?: number;
    pluginData?: any;
    paused?: boolean;
    position?: number;
    onChange?: (e: Event) => void;
    onComplete?: (e: Event) => void;
    override?: boolean;
  };

  export type TimelineProps = {
    useTicks?: boolean;
    ignoreGlobalPause?: boolean;
    loop?: number;
    reversed?: boolean;
    bounce?: boolean;
    timeScale?: number;
    paused?: boolean;
    position?: number;
    onChange?: (e: Event) => void;
    onComplete?: (e: Event) => void;
  };

  export class TweenStep {
    constructor(
      prev: TweenStep,
      t: number,
      d: number,
      props: TweenProps,
      ease: Function,
      passive: boolean
    );

    next: TweenStep;
    prev: TweenStep;
    t: number;
    d: number;
    props: TweenProps;
    ease: Function;
    passive: boolean;
    index: number;
  }

  export class TweenAction {
    constructor(
      prev: TweenAction,
      t: number,
      scope: any,
      funct: Function,
      params: any[]
    );

    next: TweenAction;
    prev: TweenAction;
    t: number;
    d: number;
    scope: any;
    funct: Function;
    params: any[];
  }

  export class MotionGuidePlugin {
    //properties
    static priority: number;
    static ID: string;

    //methods
    static install(): Object;
    static init(tween: Tween, prop: string, value: any): void;
    static step(tween: Tween, step: TweenStep, props: TweenProps): void;
    static change(
      tween: Tween,
      step: TweenStep,
      prop: string,
      value: any,
      ratio: number,
      end: boolean
    ): void;
    static debug(guideData: any, ctx: any, higlight: number[]): void;
  }

  export class Timeline extends AbstractTween {
    constructor(props?: TimelineProps);

    // properties
    tweens: Tween[];

    // method
    addTween(tween: Tween): Tween;
    removeTween(tween: Tween): boolean;
    updateDuration(): void;
  }

  export class AbstractTween extends EventDispatcher {
    constructor(props?: TweenProps);

    // properties
    ignoreGlobalPause: boolean;
    loop: number;
    useTicks: boolean;
    reversed: boolean;
    bounce: boolean;
    timeScale: number;
    duration: number;
    position: number;
    rawPosition: number;

    paused: boolean;
    readonly currentLabel: string;

    // methods
    advance(delta: number, ignoreActions?: boolean): void;
    setPosition(
      rawPosition: number,
      ignoreActions?: boolean,
      jump?: boolean,
      callback?: (tween: AbstractTween) => void
    ): void;
    calculatePosition(rawPosition: number): void;
    getLabels(): string[];
    setLabels(labels: { [labelName: string]: number }[]): void;
    addLabel(label: string, position: number): void;
    gotoAndPlay(positionOrLabel: string | number): void;
    gotoAndStop(positionOrLabel: string | number): void;
    resolve(positionOrLabel: string | number): number;
    toString(): string;
  }

  export class Tween extends AbstractTween {
    constructor(target: any, props?: TweenProps);

    static IGNORE: any;

    // properties
    target: any;
    pluginData: any;
    passive: boolean;

    // methods
    static get(target: any, props?: TweenProps): Tween;
    static tick(delta: number, paused: boolean): void;
    static handleEvent(e: Event): void;
    static removeTweens(target: any): void;
    static removeAllTweens(): void;
    static hasActiveTweens(target: any): boolean;

    wait(duration: number, passive?: boolean): Tween;
    to(props: any, duration?: number, ease?: Function): Tween;
    label(name: string): Tween;
    call(
      callback: (...params: any[]) => void,
      params?: any[],
      scope?: any
    ): Tween;
    set(props: any, target?: any): Tween;
    play(tween?: Tween): Tween;
    pause(tween?: Tween): Tween;
  }

  export class TweenJS {
    // properties
    static buildDate: string;
    static version: string;
  }
}