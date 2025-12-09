import * as P5 from "p5";

import { TWO_PI } from "./util";
import { Circle, Rect } from "./util";
import * as util from "./util";

import { Pie } from "./pie";

import { UIPie, UISlice, UIButton, UIAddButton, UIRemoveButton } from "./ui";
import { buildCursorSVG } from "./UI/uicursor";


const test_c = [100,100,100];
function createPie(): Pie {
    const test_slices = [
        {
            id: "1",
            name: "coaching",
            value: 5,
            order: 0,
            color: test_c,
            angle: TWO_PI * 0
        },
        {
            id: "2",
            name: "coding",
            value: 5,
            order: 1,
            color: test_c,
            angle: TWO_PI / 9
        },
        {
            id: "3",
            name: "art",
            value: 3,
            order: 2,
            color: test_c,
            angle: TWO_PI / 9 * 2
        },
        {
            id: "4",
            name: "home",
            value: 6,
            order: 3,
            color: test_c,
            angle: TWO_PI / 9 * 3
        },
        {
            id: "5",
            name: "bodess",
            value: 6,
            order: 4,
            color: test_c,
            angle: TWO_PI / 9 * 4
        },
        {
            id: "6",
            name: "fun",
            value: 3,
            order: 5,
            color: test_c,
            angle: TWO_PI / 9 * 5
        },
        {
            id: "7",
            name: "spirit",
            value: 3,
            order: 6,
            color: test_c,
            angle: TWO_PI / 9 * 6
        },
        {
            id: "8",
            name: "love",
            value: 9,
            order: 7,
            color: test_c,
            angle: TWO_PI / 9 * 7
        },
        {
            id: "9",
            name: "giving",
            value: 2,
            order: 8,
            color: test_c,
            angle: TWO_PI / 9 * 8
        },
    ];
    return new Pie(test_slices);
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

            selected = null;
            add_ui.active = true;
            remove_ui.active = false;

            pie_ui.refresh(data);
        };

        const pie_circle: Circle = {o: {x: 0, y: 0}, r: p.height * 0.4, kind: 'circle'};
        pie_ui = new UIPie(pie_circle);
        pie_ui.onSelect = (slice: UISlice) => {
            add_ui.active = false;
            remove_ui.active = true;
            selected = slice;
        };
        pie_ui.onRelease = () => {
            selected = null;
            add_ui.active = true;
            remove_ui.active = false;
        }

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

