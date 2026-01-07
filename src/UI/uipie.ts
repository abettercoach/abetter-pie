import * as P5 from "p5";

import { TWO_PI, mod, dist } from "../util";
import { Circle, Arc, Rect, Line, Point } from "../util";
import * as util from "../util";

import { UIElement, UIColor, buildCursorSVG } from "../ui";
import { Pie } from "../pie";

class UISliceHandle extends UIElement {
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

export class UISliceLabel {
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

export class UISlice extends UIElement {
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

        let bounds = this.arc;
        if (this.selected) {
            bounds = util.selectedArc(bounds);
        } else if (this.hovering) {
            bounds = util.hoveredArc(bounds);
        }

        return bounds;
    }

    mouseClicked({ x, y }: Point): void {
        super.mouseClicked({x,y});
    }

    mousePressed({ x, y }: Point): void {
        if (!this.active) return;
        this.selected = this.contains({x,y});
    }

    draw(p5: P5) {

        if (!this.active) return;

        p5.fill(p5.color(this.color));
        this.drawSlice(p5, this.arc);
    }

    protected drawSlice(p5: P5, arc: Arc, mode?: P5.ARC_MODE, selected?: boolean, hovering?: boolean) {

        let a = arc;
        if (selected || this.selected) {
            a = util.selectedArc(arc);
        } else if (hovering || this.hovering) {
            a = util.hoveredArc(arc);
        }

        p5.arc(a.o.x, a.o.y, a.r*2, a.r*2, a.t1, a.t2, mode || p5.PIE);
    }
}

export class UIPieSlice extends UISlice {
    
    private label: UISliceLabel;
    private handle: UISliceHandle;

    private slice_val: number;
    private og_arc: Arc;

    private _onScale: (factor: number) => void;

    private _scaleStart: Point;
    _scaling: boolean;
    _displacing: boolean;

    constructor(data: Pie, slice_id: string, circle: Circle) {
    
        const i = data.slices.findIndex(w => w.id === slice_id);
        const j = mod(i + 1, data.slices.length);
        
        const start = data.slices[i].angle;
        const end = data.slices[j].angle;

        const bg_arc: Arc = {
            o: circle.o,
            r: circle.r,
            t1: start,
            t2: end,
            kind: 'arc'
        };

        
        const bg_color = [...data.slices[i].color, 125];
        super(bg_arc, bg_color); // TODO: Make this class not inherit from UISlice?

        this.og_arc = bg_arc;

        this.id = slice_id;
        this.slice_val = data.slices[i].value;

        const label_text = `${data.slices[i].name} | ${data.slices[i].order}`;
        this.label = new UISliceLabel(bg_arc, label_text);

        this.handle = new UISliceHandle(bg_arc, [0,0,0]);

        this.color = data.slices[i].color;
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

    // set scaling(b: boolean) {
    //     this._scaling = b;
    // }

    // get scaling(): boolean {
    //     return this._scaling;
    // }

    private get bg_arc(): Arc {
        return this.arc;
    }

    private get fg_arc(): Arc {
        const val_pct = (this.slice_val * 10) / 100;
        const fg_arc: Arc = {
            ...this.arc,
            r: this.arc.r * val_pct,
        };
        return fg_arc;
    }

    get ogBounds(): Arc {
        return this.og_arc;
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

        // Cursor

        if (this.hovering) {
            if (this.selected) {
                const a = util.selectedArc(this.fg_arc);

                const dist = util.dist({x,y}, a.o);
                const diff = Math.abs(dist - a.r);
                if (diff < 5) {
                    const radians = util.angleFromPoint({x,y}, a) + TWO_PI / 4;
                    const degrees = radians / TWO_PI * 360;
                    
                    document.body.style.cursor = buildCursorSVG(degrees);
                } else {
                    document.body.style.cursor = `auto`;
                }
            } else {
                document.body.style.cursor = `auto`;
            }
        }
    }

    mousePressed({ x, y }: Point): void {
        super.mousePressed({x,y});

        if (!this.active) return;

        if (this.handle.contains({x,y})) {
            this.startDrag({x,y});
        } else if (this.contains({x,y})) {
            this._displacing = true;
        }
    }

    mouseClicked({ x, y }: Point): void {
        super.mouseClicked({x,y});

        this._scaling = false;
        this._scaleStart = null;
    }

    draw(p5: P5) {
        //super.draw(p5);

        if (!this.active) return;

        // Draw Background Arc
        p5.push();
        p5.stroke("white");
        p5.strokeWeight(3);

        p5.fill([...this.color]);
        // this.drawSlice(p5, this.bg_arc);
        
        p5.pop();

        // Draw Foreground Arc

        p5.push();
        p5.stroke([255,255,255,0]);
        p5.strokeWeight(3);
        
        p5.fill([...this.color]);
        this.drawSlice(p5, this.fg_arc);

        p5.pop();

        // Draw Hatch Marks

        p5.push()
        p5.stroke([255,255,255,0]);
        p5.strokeWeight(3);

        for (let i = 0; i < 10; i++) {
            const hatch_r = this.bg_arc.r * (i * 10 / 100);
            const c = hatch_r < this.fg_arc.r ? [255,255,255] : [100,100,100];


            p5.fill([...c,25]);

            const hatch_slice = {
                ...this.bg_arc,
                t1: this.bg_arc.t1,
                r: hatch_r,
            };

            this.drawSlice(p5, hatch_slice);
        }

        p5.pop()

        // Draw Borders
        p5.push();

        p5.stroke([255,255,255]);
        p5.strokeWeight(3);
        p5.noFill();

        // p5.fill([...this.color]);
        this.drawSlice(p5, this.bg_arc);
        
        p5.pop();

        // Draw Labels and Handle
        this.label.draw(p5);

        if (this.selected) {
            this.handle.draw(p5);
        }
    }

    startDrag(p: Point) {
        console.log("Slice Start Drag");
        this._scaleStart = p;
        this._scaling = true;
    }

    mouseDragged(p: Point) {
        if (!this._scaling || !this._scaleStart) return;
        console.log("Scaling");

        const p0 = this._scaleStart;
        const p1 = p;

        const r = dist(p0, this.bounds().o);
        const d = dist(p1, this.bounds().o);

        const f = (d / r);
        this._onScale(f);
    }
}

export class UIPie extends UIElement {
    private circle: Circle;
    private strokeWeight: number;
    private strokeColor: UIColor;

    private slices: Array<UIPieSlice>;

    private _onSelect: (slice: UISlice) => void;
    private _onRelease: () => void;

    private _onScale: (id: string, factor: number) => void;
    private _onDisplace: (id: string, dri: 'cw' | 'ccw') => void;
    private _onAppraise: (id: string, value: number) => void;

    private _displacing: boolean;
    private _dragLast: Point;

    private _dragOffset: number; // <- Angle offset for Displace 
    private _displaceOverlay: UIPieSlice;

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

    set onSelect(cb: (slice: UISlice) => void) {
        this._onSelect = cb;
    }

    set onRelease(cb: () => void) {
        this._onRelease = cb;
    }

    set onScale(cb: (id: string, factor: number) => void){
        this._onScale = cb;
    }

    set onDisplace(cb: (id: string, dir: 'cw' | 'ccw') => void){
        this._onDisplace = cb;
    }

    refresh(data: Pie) {
        this.slices = [];

        const was_draggingUI = this._displaceOverlay;
        this._displaceOverlay = null;

        const len = data.slices.length;
        for (let i = 0; i < len; i++) {
            const slice = data.slices[i];
            const slice_ui = new UIPieSlice(data, slice.id, this.circle);

            // v Here we're running into some of that logic to check
            // if we're still in the middle of a displace or not
            if (this._displacing && was_draggingUI.id === slice.id) {
                // We don't want to duplicate the dragged slice during drag n drop
                slice_ui.refresh(was_draggingUI.ogBounds);
                slice_ui.selected = true;
                this._displaceOverlay = slice_ui;
            } 

            // v We found the scale handler!
            slice_ui.onScale = (factor: number) => {
                this._scalingId = slice_ui.id;
                this._onScale(slice_ui.id, this._scalingStartLen * factor);
            }

            // v ...What is this FOR?!?!?! To continue scaling at each refresh moment?
            // v Are we calling refresh per frame during Scale?!
            if (this._scaling && this._scalingId === slice.id) {
                slice_ui.startDrag(this._scalingStartPoint);
                slice_ui.selected = true;
            }

            
            this.slices.push(slice_ui);
        }
    }

    bounds() {
        return this.circle;
    }

    draw(p5 : P5) {
        p5.ellipseMode(p5.CENTER);

        p5.push();

        p5.translate(this.circle.o.x, this.circle.o.y);//

        p5.stroke(p5.color(this.strokeColor));
        p5.strokeWeight(this.strokeWeight);

        // Draw logic changes when displacing. Does it change with other actions?
        // Move into the slices? Maybe not possible. Displacement sometimes seems
        // like a Pie-level action.

        const len = this.slices.length;
        for (let i = 0; i < len; i++) {
            // But maybe each slice knows not to draw if being displaced?
            // No.  BUT we could simplify this logic check I think.
            if (this._displacing && this._displaceOverlay.id == this.slices[i].id) continue;
            this.slices[i].draw(p5);
        }

        // And we could try to encapsulate this in some method (within slice?)
        if (this._displacing && this._displaceOverlay) {
            let c = this._displaceOverlay.color;
            this._displaceOverlay.color = [...c, 200];
            this._displaceOverlay.draw(p5); // Nvm because we do draw it here.
            this._displaceOverlay.color = c;
        }

        p5.pop();
    }

    mouseClicked({ x, y }: Point): void {
        console.log("Pie clicked");
        this.stopDrag();

        let selected = false;
        for (let slice of this.slices) {
            slice.mouseClicked({x,y});

            selected = selected || slice.selected;
            if (slice.selected) this.startSelect(slice);
        }

        if (!selected) this.stopSelect();

    }

    mouseMoved({ x, y }: Point) {
        if (!this.active) return;

        document.body.style.cursor = `auto`;    
        
        for (let w of this.slices) {
            w.mouseMoved({x,y});
        }
    }

    mousePressed({ x, y }: Point): void {
        for (let slice of this.slices) {
            slice.mousePressed({x,y});

            if (slice._scaling) {
                this.startDrag({x,y});
                this.startScale(slice);
            }

            if (slice._displacing) {
                this.startDrag({x,y});
                this.startDisplace(slice);
            }
        }
    }

    mouseDragged({x,y}: Point) {

        const curr = {x,y};

        for (let slice of this.slices) {
            slice.mouseDragged(curr);
        }

        if (this._scaling) {
            this.dragScale(curr);
        }

        if (this._displacing) {
            this.dragDisplace(curr);
        }

        this._dragLast = curr;
    }

    startSelect(slice: UIPieSlice) {
        this._onSelect(slice);
    }

    stopSelect() {
        this._onRelease();
    }

    startDrag(p: Point) {
        this._dragLast = p;
    }

    stopDrag() {
        if (this._scaling) this.stopScale();

        if (this._displacing) this.stopDisplace();

        this._dragLast = null;
    }

    startScale(slice: UISlice) {
        this._scaling = true;

        let arc_len = util.arcLength(slice.bounds().t1, slice.bounds().t2);
        this._scalingStartLen = arc_len;
        this._scalingId = slice.id;
    }

    dragScale(curr: Point) {
        for (let w of this.slices) {
            if (this._scalingId) {
                w._scaling = w.id === this._scalingId;
            }
            w.mouseDragged(curr);
        }
    }

    stopScale() {
        this._scaling = false;
        this._scalingId = null;
        this._scalingStartPoint = null;
        this._scalingStartLen = null;
    }

    startDisplace(slice: UIPieSlice) {
        this._displacing = true;
        this._displaceOverlay = slice;   

        const mid = util.angleBetween(slice.bounds().t1, slice.bounds().t2);
        this._dragOffset = mid - util.angleFromPoint(this._dragLast, this.circle);
    }

    dragDisplace(curr: Point) {
        // Calculating angles for the floating slice
        // TODO: ??? Move this logic inside UISlice's own drag hanlder ???
        const theta = this._dragOffset + util.angleFromPoint(curr, this.circle);

        const drag_arc = {...this._displaceOverlay.ogBounds}; //Copy to keep original bounds intact for snap-back
        const drag_len = util.arcLength(drag_arc.t1, drag_arc.t2);
        drag_arc.t1 = mod(theta - drag_len * 0.5, TWO_PI);
        drag_arc.t2 = mod(theta + drag_len * 0.5, TWO_PI);

        this._displaceOverlay.refresh(drag_arc);
        this._displaceOverlay.active = true;
        this._displaceOverlay.selected = true;

        // Check if we crossed next or previous slice's midpoint.
        // 1. Get handed direction 
        const last = this._dragLast;
        
        const a = util.angleFromPoint(last, this.circle);
        const b = util.angleFromPoint(curr, this.circle);
        
        let sign = Math.sign(b - a);
        const dir = sign >= 0 ? 'cw' : 'ccw';

        if (sign === 0) return;

        // 2. Next slice depends on clockwise or counterclockwise direction
        const l = this.slices.length;
        const curr_i = this.slices.findIndex(w => w.id === this._displaceOverlay.id);
        const next_i = mod(curr_i + sign, l);

        // 3. Will compare against start or end edge of floating slice, depending on direction
        const floating_edge = dir == 'cw' ? drag_arc.t2 : drag_arc.t1;

        // 4. If floating edge is near threshold from middle of the next slice, callback
        const next_arc = this.slices[next_i].bounds();
        const next_mid = util.angleBetween(next_arc.t1, next_arc.t2);
        const opp_mid = mod(next_mid + Math.PI, TWO_PI);
        let perp_mid = sign > 0 ? util.angleBetween(next_mid, opp_mid) : util.angleBetween(opp_mid, next_mid);

        // The case we need to handle is if perpendicular_mid wraps around the 0 theta
        // It's easiest to compare distance between angles if they don't wrap around
        // So this is one of the few times we want angles to be < 0 or > TWO_PI
        if (sign > 0 && floating_edge > perp_mid) {
            perp_mid += TWO_PI;
        } else if (sign < 0 && floating_edge < perp_mid) {
            perp_mid -= TWO_PI;
        }

        const diff = Math.abs(perp_mid - floating_edge);
        const near = diff <= TWO_PI / 4; // <- near as in close enough to the threshold (perp_mid)

        if (near) this._onDisplace(this._displaceOverlay.id, dir);

    }

    stopDisplace() {
        if (!this._displacing) return;
        if (!this._displaceOverlay) return;

        this._displacing = false;
        const og_slice = this.slices.find(w => w.id === this._displaceOverlay.id);
        og_slice.reset();

        this._displaceOverlay = null;
    }
}
