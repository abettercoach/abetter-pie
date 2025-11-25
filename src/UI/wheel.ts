import * as P5 from "p5";

import { TWO_PI, mod, dist } from "../util";
import { Circle, Arc, Rect, Line, Point } from "../util";
import * as util from "../util";

import { UIElement, UIColor } from "../ui";
import { Wheel } from "../wheel";

class UIWedgeHandle extends UIElement {
    _arc: Arc;
    _rect: Rect;
    _color: UIColor;

    constructor(arc: Arc, color: UIColor) {
        super();

        this._color = color;

        this.refresh(arc);
    }

    bounds(): util.Rect {
        return this._rect;
    }

    refresh(arc: Arc) {
        this._arc = arc;

        let d_x, d_y;

        const a = util.angleBetween(this._arc.t1, this._arc.t2);
        if (a >= 0) {
            d_x = (((this._arc.r * 1.15) + 15)) * Math.cos(a);
            d_y = (((this._arc.r * 1.15) + 15)) * Math.sin(a);
        }

        this._rect = {
            o: {x: d_x, y: d_y},
            w: 30,
            h: 30,
            kind: 'rect'
        };
    }

    draw(p5 : P5) {

        p5.push();

        let c = p5.color(this._color[0], this._color[1], this._color[2], 255);
        p5.stroke(c);
        p5.strokeWeight(1.5);

        const a = util.angleBetween(this._arc.t1, this._arc.t2);
        let s = this.hovering ? 3.5 : 2.5;

        p5.translate(this._rect.o.x, this._rect.o.y);
        p5.rotate(a);
        p5.scale(s);

        p5.point(0, -3);
        p5.point(0,0);
        p5.point(0, 3);

        p5.point(3, -3);
        p5.point(3, 0);
        p5.point(3, 3);

        p5.pop();
    }
}

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

        let s_a = 1.05; // Scale factor, to calculate point start of first line (pointing line)
        s_a = this.highlighted ? 1.1 : s_a;
        s_a = this.selected ? 1.3 : s_a;

        let s_b = 1.15; // Scale factor, to calculate point start of second line (text underline)
        s_b = this.highlighted ? 1.15 : s_b;
        s_b = this.selected ? 1.3 : s_b;

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

    refresh(arc: Arc) {
        this.arc = arc;
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
    protected arc: Arc;

    private _selected: boolean;

    color: UIColor;

    id: string;

    constructor(arc: Arc, color: UIColor) {
        super();

        this.arc = arc;

        this._selected = false;

        this.color = color;
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

    mouseClicked({ x, y }: Point): void {
        super.mouseClicked({x,y});
        this.selected = this.contains({x,y});
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
            dx = 15 * Math.cos(t);
            dy = 15 * Math.sin(t);
        }

        let scale = this.hovering ? 1.08 : 1;
        scale = this.selected ? 1.12 : scale;

        const d = arc.r * 2 * scale; 

        p5.fill(p5.color(this.color));
        p5.arc(o.x + dx, o.y + dy, d, d, start, end, p5.PIE);
    }
}

export class UIWheelWedge extends UIWedge {
    
    private label: UIWedgeLabel;
    private handle: UIWedgeHandle;
    private og_arc: Arc;

    private _onScale: (factor: number) => void;

    private _scaleStart: Point;
    _scaling: boolean;

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

        this.og_arc = arc;

        this.id = wedge_id;

        this.label = new UIWedgeLabel(arc, data.wedges[i].name);
        this.handle = new UIWedgeHandle(arc, [0,0,0]);
    }

    set selected(b: boolean) {
        super.selected = b;
        this.label.selected = b;
    }

    get selected() {
        return super.selected;
    }

    set onScale(cb: (factor: number) => void){
        this._onScale = cb;
    }

    set scaling(b: boolean) {
        this._scaling = b;
    }

    get scaling(): boolean {
        return this._scaling;
    }

    refresh(arc: Arc) {
        this.arc = arc;
        this.label.refresh(arc);
        this.handle.refresh(arc);
    }

    reset() {
        this.refresh(this.og_arc);
    }

    mouseMoved({x,y}: Point): void {
        super.mouseMoved({x,y});
        this.handle.mouseMoved({x,y});
    }

    mousePressed({ x, y }: Point): void {
        if (!this.active) return;

        if (this.handle.contains({x,y})) {
            console.log("start drag handle");
            this.startDrag({x,y});
        }
    }

    mouseClicked({ x, y }: Point): void {
        super.mouseClicked({x,y});

        this._scaling = false;
        this._scaleStart = null;
    }

    draw(p5: P5) {
        super.draw(p5);

        if (!this.active) return;

        this.label.draw(p5);

        if (this.selected) {
            this.handle.draw(p5);
        }
    }

    startDrag(p: Point) {
        console.log("scale start: ", p);
        this._scaleStart = p;
        this._scaling = true;
    }

    mouseDragged(p: Point) {
        if (!this._scaling || !this._scaleStart) return;
        const p0 = this._scaleStart;
        const p1 = p;

        console.log(p0, p1, this.bounds());

        const r = dist(p0, this.bounds().o);
        const d = dist(p1, this.bounds().o);

        const f = (d / r);
        this._onScale(f);
    }
}

export class UIWheel extends UIElement {
    private circle: Circle;
    private strokeWeight: number;
    private strokeColor: UIColor;

    private wedges: Array<UIWheelWedge>;

    private _onSelect: (selected: boolean) => void;
    private _onScale: (id: string, factor: number) => void;

    private _onWedgeDrag: (id: string, dri: 'cw' | 'ccw') => void;

    private _dragging: boolean;
    private _dragLast: Point;
    private _dragOffset: number;
    private _dragUI: UIWheelWedge;

    private _scaling: boolean;
    private _scalingId: string;
    private _scalingStartPoint: Point;
    private _scalingStartLen: number;

    constructor(circle: Circle) {
        super();
        this.circle = circle;
        this.strokeColor = [240,240,240];
        this.strokeWeight = 3;
    }

    set onSelect(cb: (s: boolean) => void) {
        this._onSelect = cb;
    }

    set onScale(cb: (id: string, factor: number) => void){
        this._onScale = cb;
    }

    set onWedgeDrag(cb: (id: string, dir: 'cw' | 'ccw') => void){
        this._onWedgeDrag = cb;
    }

    refresh(data: Wheel) {
        this.wedges = [];

        const len = data.wedges.length;
        for (let i = 0; i < len; i++) {
            const wedge = data.wedges[i];
            const wedge_ui = new UIWheelWedge(data, wedge.id, this.circle);

            wedge_ui.onScale = (factor: number) => {
                this._scalingId = wedge_ui.id;
                this._onScale(wedge_ui.id, this._scalingStartLen * factor);
            }

            if (this._scaling && this._scalingId === wedge.id) {
                wedge_ui.startDrag(this._scalingStartPoint);
                wedge_ui.selected = true;
            }

            if (this._dragging && this._dragUI.id === wedge.id) {
                // We don't want to duplicate the dragged wedge during drag n drop
                this._dragUI = wedge_ui;
            } 
            
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
            this.wedges[i].draw(p5);
        }

        if (this._dragging && this._dragUI) {
            this._dragUI.draw(p5);
        }

        p5.pop();
    }

    mouseClicked({ x, y }: Point): void {

        if (this._scaling) {
            this._scaling = false;
            this._scalingId = null;
            this._scalingStartPoint = null;
            this._scalingStartLen = null;
        }

        if (this._dragging) {
            this.stopDrag();
            return;
        }

        for (let w of this.wedges) {
            w.mouseClicked({x,y});
            if (w.selected) this._onSelect(true);
        }
        this._onSelect(false);
    }

    mouseMoved({ x, y }: Point) {
        if (!this.active) return;
        
        for (let w of this.wedges) {
            w.mouseMoved({x,y});
        }

    }

    mousePressed({ x, y }: Point): void {
        for (let w of this.wedges) {
            w.mousePressed({x,y});
            this._scaling = true;
            this._scalingStartPoint = {x,y};

            if (w._scaling) {
                let arc_len = util.arcLength(w.bounds().t1, w.bounds().t2);
                this._scalingStartLen = arc_len;
                this._scalingId = w.id;
            }
        }

        if (!this.contains({x,y}) || !this.active) return;

        this.startDrag({x,y});
    }

    startDrag(p: Point) {

        for (let wedge_ui of this.wedges) {
            wedge_ui.selected = false;
            if (wedge_ui.contains(p)) {
                this._dragLast = p;
                this._dragUI = wedge_ui;
                // this._dragging = true; 
                
                const mid = util.angleBetween(wedge_ui.bounds().t1, wedge_ui.bounds().t2);
                this._dragOffset = mid - util.angleFromPoint(p, this.circle);
            }
        }
    }

    mouseDragged({x,y}: Point) {
        if (this._scaling) {
            for (let w of this.wedges) {
                if (this._scalingId) {
                    w.scaling = w.id === this._scalingId;
                }
                w.mouseDragged({x,y});
            }
        }

        // TODO: Fix UIWedge contains to accurately reflect bounds when selected
        // TODO: Also check against having started dragging inside of the wedge!
        if (!this._dragUI) return;
        this._dragging = true; // <- we only mark this here so that we return on line 457 when clicked is called at drag release

        // Calculating angles for the floating wedge
        // TODO: ??? Move this logic inside UIWedge's own drag hanlder ???

        const theta = this._dragOffset + util.angleFromPoint({x,y}, this.circle);

        const drag_arc = {...this._dragUI.bounds()}; //Copy to keep origianl bounds intact for snap-back
        const drag_len = util.arcLength(drag_arc.t1, drag_arc.t2);
        drag_arc.t1 = mod(theta - drag_len * 0.5, TWO_PI);
        drag_arc.t2 = mod(theta + drag_len * 0.5, TWO_PI);

        this._dragUI.refresh(drag_arc);
        this._dragUI.active = true;
        this._dragUI.selected = true;


        // Check if we crossed next or previous wedge's midpoint.
        // 1. Get handed direction 
        const last = this._dragLast;
        const curr = {x,y};
        
        const a = util.angleFromPoint(last, this.circle);
        const b = util.angleFromPoint(curr, this.circle);
        
        let sign = Math.sign(b - a);
        const dir = sign >= 0 ? 'cw' : 'ccw';

        // 2. Next wedge depends on clockwise or counterclockwise direction
        const l = this.wedges.length;
        const curr_i = this.wedges.findIndex(w => w.id === this._dragUI.id);
        const next_i = mod(curr_i + sign, l);

        // 3. Will compare against start or end edge of floating wedge, depending on direction
        const comp = dir == 'cw' ? drag_arc.t2 : drag_arc.t1;

        // 4. If floating edge is near threshold from middle of the next wedge, callback
        const next_arc = this.wedges[next_i].bounds();
        const next_mid = util.angleBetween(next_arc.t1, next_arc.t2);
        const near = Math.abs(next_mid - comp) <= 0.1; 

        if (near) this._onWedgeDrag(this._dragUI.id, dir);

        // Keep track of last point in drag for next call
        this._dragLast = curr;
    }

    stopDrag() {
        this._scaling = false;

        if (!this._dragging) return;
        if (!this._dragUI) return;

        this._dragging = false;
        this._dragLast = null;

        const og_wedge = this.wedges.find(w => w.id === this._dragUI.id);
        og_wedge.reset();

        this._dragUI = null;
    }
}
