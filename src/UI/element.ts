import * as P5 from "p5";

import { Shape, Point } from "../util";
import * as util from "../util";

export abstract class UIElement {

    private _active: boolean;
    private _hovering: boolean;
    private _onClick: () => void;

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

    public get hovering() {
        return this._hovering;
    }

    public set hovering(b: boolean) {
        this._hovering = b;
    }

    public set onClick(cb: () => void) {
        this._onClick = cb;
    }

    contains(mouse: Point): boolean {
      return util.pointIntersects(mouse, this.bounds());
    }

    mouseMoved({x,y}: Point): void {
        this.hovering = this.contains({x,y});
    }

    mouseClicked({x,y}: Point): void {
        if (!this._active) return;
        if (this._onClick && this.contains({x,y})) {
            this._onClick();
        }
    }

    mousePressed({x,y}: Point): void {

    }

    mouseDragged({x,y}: Point): void {
        
    }

    abstract draw(p5: P5): void;


    // abstract clicking(): boolean;
}