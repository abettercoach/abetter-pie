import * as P5 from "p5";

import { Shape, Point } from "../util";
import * as util from "../util";

export abstract class UIElement {

    private _active: boolean;

    constructor() {
        this._active = true;
    }

    abstract bounds(): Shape;

    get active(): boolean {
        return this._active;
    }

    set active(val: boolean) {
        this._active = val;
    }

    contains(mouse: Point): boolean {
      return util.pointIntersects(mouse, this.bounds());
    }

    abstract draw(p5: P5): void;

    // abstract clicking(): boolean;
}