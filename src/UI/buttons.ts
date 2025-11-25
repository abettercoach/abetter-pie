import * as P5 from "p5";

import { UIElement, UIColor } from "../ui";

import { Rect, Line } from "../util";

// UI - Buttons
//#region
export abstract class UIButton extends UIElement {
    private _bounds: Rect;

    constructor(b: Rect) {
        super();
        this._bounds = b;
    }

    bounds() {
        return this._bounds;
    }
}

export class UIAddButton extends UIButton {
    readonly color: UIColor;
    readonly hoverColor: UIColor;
    readonly strokeWeight: number;
    readonly lines: Array<Line>;

    constructor(b: Rect) {
        super(b);

        this.color = [180, 180, 180];
        this.hoverColor = [30,30,30];
        this.strokeWeight = 3;

        //Lines that make up a plus sign
        this.lines = [
            {
                a: {
                    x: this.bounds().o.x - this.bounds().w * 0.5,
                    y: this.bounds().o.y
                },
                b: {
                    x: this.bounds().o.x + this.bounds().w * 0.5,
                    y: this.bounds().o.y
                }
            },
            {
                a:  {
                    x: this.bounds().o.x,
                    y: this.bounds().o.y + this.bounds().h * 0.5
                },
                b: {
                    x: this.bounds().o.x,
                    y: this.bounds().o.y - this.bounds().h * 0.5
                }
            }
        ];
    }

    draw(p5: P5) {
        if (!this.active) return;

        const c = super.hovering ? this.hoverColor : this.color;
        p5.stroke(c);
        
        p5.strokeWeight(this.strokeWeight);

        for (const l of this.lines) {
            p5.line(l.a.x, l.a.y, l.b.x, l.b.y);
        }
    }
}

export class UIRemoveButton extends UIButton {

    readonly color: UIColor;
    readonly hoverColor: UIColor;
    readonly strokeWeight: number;
    readonly line;

    constructor(b: Rect) {
        super(b);

        this.color = [180,180,180];
        this.hoverColor = [30,30,30];
        this.strokeWeight = 3;

        this.line = {
            a: {
                x: this.bounds().o.x - this.bounds().w * 0.5,
                y: this.bounds().o.y
            },
            b: {
                x: this.bounds().o.x + this.bounds().w * 0.5,
                y: this.bounds().o.y
            }
        };
    }

    draw(p5: P5) {
        if (!this.active) return;

        const c = super.hovering ? this.hoverColor : this.color;
        p5.stroke(c);
        
        p5.strokeWeight(this.strokeWeight);

        p5.line(this.line.a.x, this.line.a.y, this.line.b.x, this.line.b.y);
    }
}
