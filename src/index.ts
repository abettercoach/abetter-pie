import * as P5 from "p5";

import { TWO_PI } from "./util";
import { Circle, Rect } from "./util";
import * as util from "./util";

import { Pie } from "./pie";

import { UIPie, UISlice, UIButton, UIAddButton, UIRemoveButton } from "./ui";


function createPie(): Pie {
    const test_slices = [
        {
            id: "1",
            name: "slice 1",
            color: [0,0,0],
            angle: TWO_PI * 0.7
        },
        {
            id: "2",
            name: "slice 2",
            color: [100,100,100],
            angle: TWO_PI * 0.25
        },
        {
            id: "3",
            name: "slice 3",
            color: [50,50,50],
            angle: TWO_PI * 0.45
        }
    ];
    return new Pie(test_slices.slice(0,3));
}

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
    let pie_ui: UIPie;

    let data: Pie;
    let selected: UISlice;

    function setupUI() {
        
        const corner_button_bounds: Rect = {
            o: { x: (p.width * 0.5) * 0.8, y: (p.height * 0.5) * 0.8 },
            w: 40,
            h: 40,
            kind: 'rect'
        };

        add_ui = new UIAddButton(corner_button_bounds);
        add_ui.onClick = () => {
            data.addSlice();
            pie_ui.refresh(data);
        };

        remove_ui = new UIRemoveButton(corner_button_bounds);
        remove_ui.active = false;
        remove_ui.onClick = () => {
            data.removeSlice(selected.id);
            pie_ui.refresh(data);
        };

        const pie_circle: Circle = {o: {x: 0, y: 0}, r: p.height * 0.4, kind: 'circle'};
        pie_ui = new UIPie(pie_circle);
        pie_ui.onSelect = (selected: boolean) => {
            if (selected) {
                add_ui.active = false;
                remove_ui.active = true;
            } else {
                add_ui.active = true;
                remove_ui.active = false;
            }
        };

        pie_ui.onSliceDrag = (id: string, dir: 'cw' | 'ccw') => {
            switch (dir) {
                case 'cw':
                    data.moveSliceFwd(id);
                   break;
                default:
                    data.moveSliceBwd(id);
                   break;
            }

            pie_ui.refresh(data);
        };

        pie_ui.onScale = (id: string, size: number) => {
            data.scaleSlice(id, size);
            pie_ui.refresh(data);
        };


        pie_ui.refresh(data);

    }

    p.windowResized = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);

        setupUI();
    }

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);

        // Data
        data = createPie();
        
        // UI
        setupUI();

        //Testing
        let circle: Circle = {o: {x: 0, y:0}, r: 100, kind:`circle`};
        let p1 = {x: 50, y:-50};
        let p2 = {x: 50, y:50};
        let t1 = util.angleFromPoint(p1, circle);
        let t2 = util.angleFromPoint(p2, circle);
        console.log(`Point: ${p1}, Angle: ${(t1/TWO_PI)*360}`);
        console.log(`Point: ${p2}, Angle: ${(t2/TWO_PI)*360}`);
    }

    p.draw = () => {
        p.background(220);

        p.push();

        //(0,0) Center of Window
        p.translate( p.width * 0.5, p.height * 0.5);
        
        add_ui.draw(p);
        remove_ui.draw(p);

        pie_ui.draw(p);

        p.pop();
    }

    p.mouseClicked = () => {
        let pointer = centeredMouseCoords(p);

        add_ui.mouseClicked(pointer);
        remove_ui.mouseClicked(pointer);
        pie_ui.mouseClicked(pointer);

    }

    p.mouseMoved = () => {
        let pointer = centeredMouseCoords(p);

        pie_ui.mouseMoved(pointer);
        add_ui.mouseMoved(pointer);
        remove_ui.mouseMoved(pointer);
    }

    p.mousePressed = () => {
        const pointer = centeredMouseCoords(p);

        pie_ui.mousePressed(pointer);
    }

    p.mouseDragged = () => {
        const pointer = centeredMouseCoords(p);

        pie_ui.mouseDragged(pointer);
    }

    p.mouseReleased = () => {
    }
}

export const myp5 = new P5(sketch, document.body);

