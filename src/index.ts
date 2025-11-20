import * as P5 from "p5";

const TWO_PI = Math.PI * 2;

type Color = number[];

interface Spoke {
    id: string;
    name: string;
    color: Color;
    angle: number;
}

interface Wheel {
    spokes: Array<Spoke>;
}

/* Math */
type Point = { x: number, y: number };
type Line = { a: Point, b: Point };
type Circle = {o: Point, r: number, kind: 'circle'};
type Size = { w: number, h: number };
type Rect = {o: Point, w: number, h: number, kind: 'rect' };
type Shape = Circle | Rect;

function average(ns: number[]): number {
    console.assert(ns.length > 0, "Attempted to get average of zero length list.");

    const total = ns.reduce((acc, val) => {
        return acc + val;
    }, 0);
    return total / ns.length;
}

function angleBetween(alpha: number, beta: number) {
    let delta = beta - alpha;
    if (delta < 0) {
        delta += TWO_PI;
    }

    const mid = alpha + (delta / 2);
    const norm = (mid % TWO_PI + TWO_PI) % TWO_PI;

    return norm;
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
        default:
            return false;
    }
}

/* Data */
//#region

//Placeholder

function createWheel(): Wheel {
    const test_spokes = [
        {
            id: "1",
            name: "spoke 1",
            color: [0,0,0],
            angle: TWO_PI * 0.7
        },
        {
            id: "2",
            name: "spoke 2",
            color: [100,100,100],
            angle: TWO_PI * 0.25
        },
        {
            id: "3",
            name: "spoke 3",
            color: [50,50,50],
            angle: TWO_PI * 0.45
        }
    ];
    const wheel = {
        spokes: test_spokes.slice(0,3)
    }
    return wheel;
}

function getWheel(): Wheel {
    return createWheel();
}

function spokeArcLengths(wheel: Wheel): number[] {
    const lens = wheel.spokes.map((spoke, index, array) => {
        const nextIndex = (index + 1) % array.length;
        const next = array[nextIndex];

        let len = next.angle - spoke.angle;
        if (len < 0) {
            len += TWO_PI;
        }
        return len;
    });

    // Test - Assert
    const sum = lens.reduce((acc, val) =>{
        return acc + val;
    }, 0);
    console.log(sum, TWO_PI - sum);
    console.assert(sum == TWO_PI, "Sum of all arc lens not equal to two pi!");

    return lens;
}

//#endregion

/* Actions */
function addSpoke(wheel: Wheel): Wheel {
    const arc_lens = spokeArcLengths(wheel); //Get all arc lens in radians
    const arc_pcts = arc_lens.map(v => v / TWO_PI); //Arc lens as percent of circle

    const avg_arc_pct = average(arc_pcts); //Avg lens as percent of circle -> Length of new spoke
    
    const new_len = avg_arc_pct * TWO_PI; 

    //Construct new spoke, to insert at end of wheel after shifting all other spokes
    const new_angle = 0 - (new_len * 0.5) + TWO_PI; 
    const new_id = crypto.randomUUID().toString();
    const new_gray = 255;
    const new_spoke = {
        id: new_id,
        name: `Spoke: ${new_id}`,
        color: [new_gray, new_gray, new_gray],
        angle: new_angle
    }

    const new_spokes: Array<Spoke> = [new_spoke];

    //Insert equivalent spokes for each existing, but shifted and squeezed
    const rest_len = TWO_PI - new_len;
    let current_a = new_len * 0.5; //Start at end of new spoke
    for (let i = 0; i < arc_pcts.length; i ++) {
        const old_spoke = wheel.spokes[i];
        const spoke: Spoke = {
            id: old_spoke.id,
            name: old_spoke.name,
            color: old_spoke.color,
            angle: current_a
        }
        new_spokes.push(spoke);

        current_a += arc_pcts[i] * rest_len; //Move a proportional to the remainder of the wheel
    }

    return {
        spokes: new_spokes
    }
}


/* UI Elements */
abstract class UIElement {

    private _active: boolean;

    constructor() {
        this._active = true;
    }

    abstract bounds(): Shape;

    active(): boolean {
        return this._active;
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


class UIWheel {
    p5: P5;
    circle: Circle;
    readonly strokeWeight: number;
    readonly strokeColor: Color;

    data: Wheel;

    constructor(c: Circle) {
        this.circle = c;
        this.strokeColor = [240,240,240];
        this.strokeWeight = 4;
    }

    update(data: Wheel) {
        this.data = data;
    }

    draw(p5 : P5) {
        p5.ellipseMode(p5.CENTER);

        p5.push();

        p5.stroke(p5.color(this.strokeColor));
        p5.strokeWeight(this.strokeWeight);

        p5.translate(this.circle.o.x, this.circle.o.y);

        const d = this.circle.r * 2; 
        const len = this.data.spokes.length;
        for (let i = 0; i < len; i++) {
            const spoke = this.data.spokes[i];
            const next = this.data.spokes[(i + 1) % len];
            const start = spoke.angle;
            const end = next.angle;

            p5.fill(p5.color(spoke.color));
            p5.arc(0, 0, d, d, start, end, p5.PIE);


            p5.push();
            p5.stroke(0);
            p5.strokeWeight(1);

            const a = angleBetween(start, end);
            const label_ln1 = {
                a: {x: Math.cos(a) * this.circle.r * 1.05, y: Math.sin(a) * this.circle.r * 1.05},
                b: {x: Math.cos(a) * this.circle.r * 1.15, y: Math.sin(a) * this.circle.r * 1.15}
            };

            const d_x = label_ln1.b.x < 0 ? -140 : 140;
            const label_ln2 = {
                a: label_ln1.b,
                b: {x: label_ln1.b.x + d_x, y:label_ln1.b.y}
            };

            p5.line(label_ln1.a.x, label_ln1.a.y, label_ln1.b.x, label_ln1.b.y)
            p5.line(label_ln2.a.x, label_ln2.a.y, label_ln2.b.x, label_ln2.b.y)

            p5.pop();
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
    let wheel_ui: UIWheel;

    let data: Wheel;

    function setupUI() {
        
        const add_button_bounds: Rect = {
            o: { x: (p.width * 0.5) * 0.8, y: (p.height * 0.5) * 0.8 },
            w: 40,
            h: 40,
            kind: 'rect'
        }
        add_ui = new UIAddButton(add_button_bounds);

        const wheel_circle: Circle = {o: {x: 0, y: 0}, r: p.height * 0.4, kind: 'circle'};
        wheel_ui = new UIWheel(wheel_circle);
        wheel_ui.update(data);
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
        wheel_ui.draw(p);

        p.pop();
    }

    p.mouseClicked = () => {
        let mouse = centeredMouseCoords(p);
        if (add_ui.active() && add_ui.contains(mouse)) {
            const old_wheel = data;
            const new_wheel = addSpoke(old_wheel);
            data = new_wheel;
            wheel_ui.update(new_wheel);
        }
    }
}

export const myp5 = new P5(sketch, document.body);

