import * as P5 from "p5";

const TWO_PI = Math.PI * 2;

type Color = number[];

interface Wedge {
    id: string;
    name: string;
    color: Color;
    angle: number;
}

interface Wheel {
    wedges: Array<Wedge>;
}

/* Math */
type Point = { x: number, y: number };
type Line = { a: Point, b: Point };

type Shape = Circle | Rect | Arc;
type Circle = {o: Point, r: number, kind: 'circle'};
type Rect = {o: Point, w: number, h: number, kind: 'rect' };
type Arc = {o: Point, r: number, t1: number, t2: number, kind: 'arc'}

function mod(a: number, n: number) {
  return ((a % n) + n) % n;
}

function average(ns: number[]): number {
    console.assert(ns.length > 0, "Attempted to get average of zero length list.");

    const total = ns.reduce((acc, val) => {
        return acc + val;
    }, 0);
    return total / ns.length;
}

function arcLength(alpha: number, beta: number) {
    const delta = beta - alpha;
    const length = delta >= 0 ? delta : delta + TWO_PI;
    return length;
}

function angleBetween(alpha: number, beta: number) {
    let length = arcLength(alpha, beta);
    const mid = alpha + (length / 2);
    const norm = mod(mid, TWO_PI);

    return norm;
}

function angleFromPoint(p: Point, s?: Shape) {
    let p_t = Math.atan2(p.y - s.o.y, p.x - s.o.x);
    if (p_t < 0) {
        p_t += TWO_PI;
    }
    return p_t;
}

function distSq(a: Point, b: Point) {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

function pointIntersects(p: Point, s: Shape): boolean {
    switch (s.kind) {
        case 'circle':
            return distSq(p, s.o) <= s.r ** 2;
        case 'rect':
            const min_x = s.o.x - s.w * 0.5;
            const max_x = s.o.x + s.w * 0.5;
            const min_y = s.o.y - s.h * 0.5;
            const max_y = s.o.y + s.h * 0.5;

            return p.x >= min_x && p.x <= max_x && p.y >= min_y && p.y <= max_y;
        case 'arc':
            const p_d = distSq(p, s.o);
            let p_t = angleFromPoint(p, s);

            let between_angles;
            if (s.t1 > s.t2) {
                between_angles = p_t >= s.t1 || p_t <= s.t2;
            } else {
                between_angles = p_t >= s.t1 && p_t <= s.t2;
            }

            const within_radius = p_d <= s.r ** 2;

            return within_radius && between_angles;
        default:
            return false;
    }
}

/* Data */
//#region

//Placeholder

function createWheel(): Wheel {
    const test_wedges = [
        {
            id: "1",
            name: "wedge 1",
            color: [0,0,0],
            angle: TWO_PI * 0.7
        },
        {
            id: "2",
            name: "wedge 2",
            color: [100,100,100],
            angle: TWO_PI * 0.25
        },
        {
            id: "3",
            name: "wedge 3",
            color: [50,50,50],
            angle: TWO_PI * 0.45
        }
    ];
    const wheel = {
        wedges: test_wedges.slice(0,3)
    }
    return wheel;
}

function getWheel(): Wheel {
    return createWheel();
}

function wedgeArcLengths(wheel: Wheel): number[] {
    const lens = wheel.wedges.map((wedge, index, array) => {
        const nextIndex = mod((index + 1), array.length);
        const next = array[nextIndex];

        return arcLength(wedge.angle, next.angle);
    });

    // Test - Assert
    const sum = lens.reduce((acc, val) =>{
        return acc + val;
    }, 0);
    console.assert(sum == TWO_PI, "Sum of all arc lens not equal to two pi!");

    return lens;
}

//#endregion

/* Actions */
function addWedge(wheel: Wheel): Wheel {
    const arc_lens = wedgeArcLengths(wheel); //Get all arc lens in radians
    const arc_pcts = arc_lens.map(v => v / TWO_PI); //Arc lens as percent of circle

    const avg_arc_pct = average(arc_pcts); //Avg lens as percent of circle -> Length of new wedge
    
    const new_len = avg_arc_pct * TWO_PI; 

    //Construct new wedge, to insert at end of wheel after shifting all other wedges
    const new_angle = 0 - (new_len * 0.5) + TWO_PI; 
    const new_id = crypto.randomUUID().toString();
    const new_gray = 255;
    const new_wedge = {
        id: new_id,
        name: `Wedge: ${new_id}`,
        color: [new_gray, new_gray, new_gray],
        angle: new_angle
    }

    const new_wedges: Array<Wedge> = [new_wedge];

    //Insert equivalent wedges for each existing, but shifted and squeezed
    const rest_len = TWO_PI - new_len;
    let current_a = new_len * 0.5; //Start at end of new wedge
    for (let i = 0; i < arc_pcts.length; i ++) {
        const old_wedge = wheel.wedges[i];
        const wedge: Wedge = {
            id: old_wedge.id,
            name: old_wedge.name,
            color: old_wedge.color,
            angle: current_a
        }
        new_wedges.push(wedge);

        current_a += arc_pcts[i] * rest_len; //Move a proportional to the remainder of the wheel
    }

    return {
        wedges: new_wedges
    }
}

function removeWedge(wheel: Wheel, id: string): Wheel {

    //ix = index to remove
    const ix = wheel.wedges.findIndex(wedge => wedge.id === id);

    const arc_lens = wedgeArcLengths(wheel); //Get all arc lens in radians
    const removed_len = arc_lens[ix]; 
    const remainder_total = TWO_PI - removed_len; 
     
    const arc_pcts = arc_lens.map(v => v / remainder_total); //Arc lens as percent of remaining circle

    const new_wedges: Array<Wedge> = [];

    //Actually start looping after the index to remove and wrap around
    let current_t = wheel.wedges[ix].angle;
    for (let a = 1; a < arc_pcts.length; a ++) {
        const i = mod((ix + a), arc_pcts.length); 

        const old_wedge = wheel.wedges[i];
        const wedge: Wedge = {
            id: old_wedge.id,
            name: old_wedge.name,
            color: old_wedge.color,
            angle: current_t
        }
        new_wedges.push(wedge);

        current_t += (arc_pcts[i] * TWO_PI); //Move proportional to the entire wheel
        current_t = mod(current_t, TWO_PI);
    }

    return {
        wedges: new_wedges
    };
}

function moveWedgeFwd(wheel: Wheel, id: string): Wheel {

    const i = wheel.wedges.findIndex(w => w.id === id);
    const j = (i + 1) % wheel.wedges.length;
    const k = (j + 1) % wheel.wedges.length;

    const current = wheel.wedges[i];
    const next = wheel.wedges[j];
    const following = wheel.wedges[k];

    const next_len = arcLength(next.angle, following.angle);

    next.angle = current.angle;
    current.angle = mod(current.angle + next_len, TWO_PI);

    const newWedges = [...wheel.wedges];
    [newWedges[i], newWedges[j]] = [newWedges[j], newWedges[i]];
    console.log(wheel.wedges, newWedges);
    return {
        wedges: newWedges
    };
}


function moveWedgeBwd(wheel: Wheel, id: string): Wheel {

    const i = wheel.wedges.findIndex(w => w.id === id);
    const h = mod(i - 1, wheel.wedges.length);
    console.log(h);

    return moveWedgeFwd(wheel, wheel.wedges[h].id);
}

/* UI Elements */
abstract class UIElement {

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
      return pointIntersects(mouse, this.bounds());
    }

    abstract draw(p5: P5): void;

    // abstract clicking(): boolean;
}

// UI - Buttons
//#region
abstract class UIButton extends UIElement {
    private _bounds: Rect;

    constructor(b: Rect) {
        super();
        this._bounds = b;
    }

    bounds() {
        return this._bounds;
    }
}

class UIAddButton extends UIButton {
    readonly color: Color;
    readonly hoverColor: Color;
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

        let mouse = centeredMouseCoords(p5);
        const c = this.contains(mouse) ? this.hoverColor : this.color;
        p5.stroke(c);
        
        p5.strokeWeight(this.strokeWeight);

        for (const l of this.lines) {
            p5.line(l.a.x, l.a.y, l.b.x, l.b.y);
        }
    }
}

class UIRemoveButton extends UIButton {

    readonly color: Color;
    readonly hoverColor: Color;
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

        let mouse = centeredMouseCoords(p5);
        const c = this.contains(mouse) ? this.hoverColor : this.color;
        p5.stroke(c);
        
        p5.strokeWeight(this.strokeWeight);

        p5.line(this.line.a.x, this.line.a.y, this.line.b.x, this.line.b.y);
    }
}

//#endregion

// UI - Wheel
//#region

class UIWedgeLabel {
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

        const a = angleBetween(this.arc.t1, this.arc.t2);
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

class UIWedge extends UIElement {
    private arc: Arc;
    private label: UIWedgeLabel;
    private color: Color;

    private _highlighted: boolean;
    private _selected: boolean;

    private _dragging: boolean;
    private _dragStart: Point;
    private _dragArc: Arc;

    id: string;

    constructor(arc: Arc, label: string, color: Color, id: string) {
        super();
        this.arc = arc;
        this._dragArc = { ...arc };

        this._highlighted = false;
        this._selected = false;
        this._dragging = false;

        this.label = new UIWedgeLabel(arc, label);
        this.color = color;
        this.id = id;
    }

    get highlighted() {
        return this._highlighted;
    }

    set highlighted(h: boolean) {
        this._highlighted = h;
        this.label.highlighted = h;
    }

    get selected() {
        return this._selected;
    }

    set selected(s: boolean) {
        this._selected = s;
        this.label.selected = s;
    }

    bounds() {
        return this.arc;
    }

    draw(p5: P5) {

        const arc = this._dragging ? this._dragArc : this.arc;
        const o = arc.o;
        const start = arc.t1;
        const end = arc.t2;

        let dx = 0;
        let dy = 0;
        if (this.selected) {
            const t = angleBetween(arc.t1, arc.t2);
            dx = 10 * Math.cos(t);
            dy = 10 * Math.sin(t);
        }

        let scale = this.highlighted ? 1.08 : 1;
        scale = this.selected ? 1.12 : scale;

        const d = arc.r * 2 * scale; 

        p5.fill(p5.color(this.color));
        p5.arc(o.x + dx, o.y + dy, d, d, start, end, p5.PIE);

        this.label.draw(p5);
    }

    startDrag(p: Point) {
        this._dragging = true;
        this._dragStart = p;
    }

    drag(current: Point) {
        if (!this._dragging) return;

        let init_t = angleFromPoint(this._dragStart, this.arc);
        let curr_t = angleFromPoint(current, this.arc);
        let delta = curr_t - init_t;

        this._dragArc.t1 = this.arc.t1 + delta;
        this._dragArc.t2 = this.arc.t2 + delta;
    }

    stopDrag() {
        this._dragging = false;
    }

}

class UIWheel extends UIElement {
    private circle: Circle;
    private strokeWeight: number;
    private strokeColor: Color;
    wedges: Array<UIWedge>;

    data: Wheel;

    constructor(circle: Circle) {
        super();
        this.circle = circle;
        this.strokeColor = [240,240,240];
        this.strokeWeight = 4;
    }

    private refresh(data: Wheel) {
        this.wedges = [];

        const len = data.wedges.length;
        for (let i = 0; i < len; i++) {
            const wedge = data.wedges[i];
            const next = data.wedges[(i + 1) % len];

            const start = wedge.angle;
            const end = next.angle;
            
            const wedge_ui = new UIWedge({
                o: this.circle.o,
                r: this.circle.r,
                t1: start,
                t2: end,
                kind: 'arc'
            }, wedge.name, wedge.color, wedge.id);
            this.wedges.push(wedge_ui);
        }
    }

    update(data: Wheel) {
        this.data = data;
        this.refresh(this.data);
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

        p5.pop();
    }
}
//#endregion

/* UI - Helper Functions */
function centeredMouseCoords(p5: P5) {
    return {
        x: p5.mouseX - p5.width * 0.5,
        y: p5.mouseY - p5.height * 0.5
    }
}


/* P5 Setup */
const sketch = ( p: P5 ) => {
    let add_ui: UIButton;
    let remove_ui: UIButton;
    let wheel_ui: UIWheel;

    let data: Wheel;
    let selected: UIWedge;
    let dragging: UIWedge;

    function setupUI() {
        
        const corner_button_bounds: Rect = {
            o: { x: (p.width * 0.5) * 0.8, y: (p.height * 0.5) * 0.8 },
            w: 40,
            h: 40,
            kind: 'rect'
        }
        add_ui = new UIAddButton(corner_button_bounds);
        remove_ui = new UIRemoveButton(corner_button_bounds);
        remove_ui.active = false;

        const wheel_circle: Circle = {o: {x: 0, y: 0}, r: p.height * 0.4, kind: 'circle'};
        wheel_ui = new UIWheel(wheel_circle);
        updateData(data);
    }

    function updateData(d: Wheel) {
        data = d;
        wheel_ui.update(d);
    }

    p.windowResized = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);

        setupUI();
    }

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);

        // Data
        data = createWheel();
        
        // UI
        setupUI();
    }

    p.draw = () => {
        p.background(220);

        p.push();

        //(0,0) Center of Window
        p.translate( p.width * 0.5, p.height * 0.5);
        
        add_ui.draw(p);
        remove_ui.draw(p);

        wheel_ui.draw(p);

        p.pop();
    }

    p.mouseClicked = () => {
        let pointer = centeredMouseCoords(p);

        if (add_ui.active && add_ui.contains(pointer)) {
            updateData(addWedge(data));
        }

        if (remove_ui.active && remove_ui.contains(pointer)) {
           updateData(removeWedge(data, selected.id));
        }

        for (let wedge_ui of wheel_ui.wedges) {
            wedge_ui.selected = wedge_ui.contains(pointer);
            if (wedge_ui.selected) {
                add_ui.active = false;
                remove_ui.active = true;
                selected = wedge_ui;

                //Testing
                updateData(moveWedgeBwd(data, selected.id));
            }
        }

        if (!wheel_ui.contains(pointer)) {
            add_ui.active = true;
            remove_ui.active = false;
        }
    }

    p.mouseMoved = () => {
        let pointer = centeredMouseCoords(p);
        for (let wedge_ui of wheel_ui.wedges) {
            wedge_ui.highlighted = wedge_ui.contains(pointer);
        }
    }

    p.mousePressed = () => {
        const pointer = centeredMouseCoords(p);
        if (wheel_ui.contains(pointer)) {
            for (let wedge_ui of wheel_ui.wedges) {
                if (wedge_ui.contains(pointer)) {
                    wedge_ui.startDrag(pointer);
                    dragging = wedge_ui;
                }
            }
        }
    }

    p.mouseDragged = () => {
        const pointer = centeredMouseCoords(p);
        if (dragging) {
            dragging.drag(pointer);
        }
    }

    p.mouseReleased = () => {
        dragging = null;
        setupUI(); //Temporary crude refresh
    }
}

export const myp5 = new P5(sketch, document.body);

