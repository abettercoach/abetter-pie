import * as P5 from "p5";

import { TWO_PI, mod } from "../util";
import { Circle, Arc, Line, Point } from "../util";
import * as util from "../util";

import { UIElement, UIColor } from "../ui";
import { Wheel } from "../wheel";


export class UIWedgeLabel {
    private arc: Arc;
    private lines: Array<Line>
    private label: string;
    private _highlighted: boolean;
    private _selected: boolean;

    constructor(arc: Arc, label: string) {
        this.arc = arc;
        this._highlighted = false;
        this._selected = false;
        this.label = label;
        this.calc_lines();
    }

    private calc_lines() {

        let s_a = 1.05;
        s_a = this.highlighted ? 1.1 : s_a;
        s_a = this.selected ? 1.2 : s_a;

        let s_b = 1.15;
        s_b = this.highlighted ? 1.2 : s_b;
        s_b = this.selected ? 1.2 : s_b;

        const a = util.angleBetween(this.arc.t1, this.arc.t2);
        const label_ln1 = {
            a: {x: Math.cos(a) * this.arc.r * s_a, y: Math.sin(a) * this.arc.r * s_a},
            b: {x: Math.cos(a) * this.arc.r * s_b, y: Math.sin(a) * this.arc.r * s_b}
        };

        const d_x = label_ln1.b.x < 0 ? -140 : 140;
        const label_ln2 = {
            a: label_ln1.b,
            b: {x: label_ln1.b.x + d_x, y:label_ln1.b.y}
        };

        this.lines = [label_ln1, label_ln2];

    }

    get highlighted() {
        return this._highlighted;
    }

    set highlighted(h: boolean) {
        this._highlighted = h;
        this.calc_lines();
    }

    get selected() {
        return this._selected;
    }

    set selected(h: boolean) {
        this._selected = h;
        this.calc_lines();
    }

    draw(p5: P5) {
        p5.push();
        p5.stroke(40,40,40);
        p5.strokeWeight(1);
        for (let l of this.lines) {
            const dx = 0;
            const dy = 0;
            
            if (this.highlighted) {
                p5.translate(dx, dy);
            }
            
            p5.line(l.a.x, l.a.y, l.b.x, l.b.y);
        }
        
        const p = this.lines[1].a;
        const padding = 10;
        p5.textSize(16);
        p5.fill(40,40,40);
        if (p.x < 0) {
            p5.textAlign(p5.RIGHT);
            p5.text(this.label, p.x - padding, p.y - padding);
        } else {
            p5.textAlign(p5.LEFT);
            p5.text(this.label, p.x + padding, p.y - padding);
        }
        p5.pop();
    }
}

export class UIWedge extends UIElement {
    private arc: Arc;

    private _highlighted: boolean;
    private _selected: boolean;

    color: UIColor;

    id: string;

    constructor(arc: Arc, color: UIColor) {
        super();

        this.arc = arc;

        this._highlighted = false;
        this._selected = false;

        this.color = color;
    }

    public get highlighted() {
        return this._highlighted;
    }

    public set highlighted(b: boolean) {
        this._highlighted = b;
    }

    get selected() {
        return this._selected;
    }

    set selected(s: boolean) {
        this._selected = s;
    }

    bounds() {
        return this.arc;
    }

    draw(p5: P5) {

        if (!this.active) return;

        const arc = this.arc;
        const o = arc.o;
        const start = arc.t1;
        const end = arc.t2;

        let dx = 0;
        let dy = 0;
        if (this.selected) {
            const t = util.angleBetween(arc.t1, arc.t2);
            dx = 10 * Math.cos(t);
            dy = 10 * Math.sin(t);
        }

        let scale = this.highlighted ? 1.08 : 1;
        scale = this.selected ? 1.12 : scale;

        const d = arc.r * 2 * scale; 

        p5.fill(p5.color(this.color));
        p5.arc(o.x + dx, o.y + dy, d, d, start, end, p5.PIE);
    }
}

export class UIWheelWedge extends UIWedge {
    
    private label: UIWedgeLabel;

    constructor(data: Wheel, wedge_id: string, circle: Circle) {
    
        const i = data.wedges.findIndex(w => w.id === wedge_id);
        const j = mod(i + 1, data.wedges.length);
        
        const start = data.wedges[i].angle;
        const end = data.wedges[j].angle;

        const arc: Arc = {
            o: circle.o,
            r: circle.r,
            t1: start,
            t2: end,
            kind: 'arc'
        }
        
        super(arc, data.wedges[i].color);

        this.id = wedge_id;

        this.label = new UIWedgeLabel(arc, data.wedges[i].name);
    }

    set highlighted(b: boolean) {
        super.highlighted = b;
        this.label.highlighted = b;
    }

    get highlighted() {
        return super.highlighted;
    }


    set selected(b: boolean) {
        super.selected = b;
        this.label.selected = b;
    }

    get selected() {
        return super.selected;
    }


    draw(p5: P5) {
        super.draw(p5);

        this.label.draw(p5);
    }
}

export class UIWheel extends UIElement {
    private circle: Circle;
    private strokeWeight: number;
    private strokeColor: UIColor;

    private wedges: Array<UIWheelWedge>;

    private _dragging: boolean;
    private _dragLast: Point;
    private _dragId: string;
    private _dragOffset: number;
    private _dragUI: UIWedge;

    constructor(circle: Circle) {
        super();
        this.circle = circle;
        this.strokeColor = [240,240,240];
        this.strokeWeight = 4;
    }

    refresh(data: Wheel) {
        this.wedges = [];

        const len = data.wedges.length;
        for (let i = 0; i < len; i++) {
            const wedge = data.wedges[i];
            const wedge_ui = new UIWheelWedge(data, wedge.id, this.circle);
            this.wedges.push(wedge_ui);
        }
    }

    bounds() {
        return this.circle;
    }

    draw(p5 : P5) {
        p5.ellipseMode(p5.CENTER);

        p5.push();

        p5.translate(this.circle.o.x, this.circle.o.y);

        p5.stroke(p5.color(this.strokeColor));
        p5.strokeWeight(this.strokeWeight);

        const len = this.wedges.length;
        for (let i = 0; i < len; i++) {

            //Check UI State: Highlighted | Selected
            this.wedges[i].draw(p5);
        }

        if (this._dragging && this._dragUI) {
            p5.push();
            p5.strokeWeight(0);
            this._dragUI.draw(p5);
            p5.pop();
        }

        p5.pop();
    }

    select(pointer: Point): UIWedge {
        
        let h;
        for (let w of this.wedges) {
            w.selected = w.contains(pointer);
            if (w.selected) {
                h = w;   
            }
        }

        return h;
    }

    highlight(pointer: Point): UIWedge {
        
        let h;
        for (let w of this.wedges) {
            w.highlighted = w.contains(pointer);
            if (w.highlighted) {
                h = w;   
            }
        }

        return h;
    }

    startDrag(p: Point) {
        this._dragging = true;
        this._dragLast = p;

        for (let wedge_ui of this.wedges) {
            if (wedge_ui.contains(p)) {
                this._dragId = wedge_ui.id;
                wedge_ui.active = false;

                this._dragUI = new UIWedge(wedge_ui.bounds(), [...wedge_ui.color,200]);
                this._dragUI.selected = true;
                
                const mid = util.angleBetween(wedge_ui.bounds().t1, wedge_ui.bounds().t2);
                this._dragOffset = mid - util.angleFromPoint(p, this.circle);
            }
        }
    }

    drag(current: Point, cb: (id: string, dir: 'cw' | 'ccw') => void) {
        if (!this._dragging) return;

        const last = this._dragLast;
        const curr = current;

        const curr_i = this.wedges.findIndex(w => w.id === this._dragId);
        
        const a = this._dragOffset + util.angleFromPoint(last, this.circle);
        const b = this._dragOffset + util.angleFromPoint(curr, this.circle);
        
        let delta = b - a;
        if (delta === 0) return;
        const dir = Math.sign(delta) >= 0 ? 'cw' : 'ccw';

        // Calculating angles for the floating wedge
        const og_wedge = this.wedges[curr_i];
        const og_arc = og_wedge.bounds();

        const drag_arc = {...og_arc};
        const drag_len = util.arcLength(og_arc.t1, og_arc.t2);
        drag_arc.t1 = mod(b - drag_len * 0.5, TWO_PI);
        drag_arc.t2 = mod(b + drag_len * 0.5, TWO_PI);

        this._dragUI = new UIWedge(drag_arc, [...og_wedge.color, 200]);
        this._dragUI.selected = true;

        // Check if crossed next or previous wedge's midpoint
        const l = this.wedges.length;
        const next_i = mod(curr_i + Math.sign(delta), l);
        const next_arc = this.wedges[next_i].bounds();

        const next_mid = util.angleBetween(next_arc.t1, next_arc.t2);

        //const comp = angleBetween(Math.min(a,b), Math.max(a,b));
        const comp = dir == 'cw' ? drag_arc.t2 : drag_arc.t1;
        console.log(dir, comp, next_mid);

        //TODO: make more precise by writing function that actually checks if an angle
        //is between two other angles.
        const near = Math.abs(next_mid - comp) <= 0.1; 

        if (near) {
            cb(this._dragId, dir);
        }

        og_wedge.active = false;
        this._dragLast = curr;
    }

    stopDrag() {
        if (!this._dragging) return;

        this._dragging = false;
        const og_wedge = this.wedges.find(w => w.id === this._dragId);

        og_wedge.active = true;
    }
}
