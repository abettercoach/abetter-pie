
import { TWO_PI, mod } from "./util";
import * as util from "./util";

import { UIColor } from "./ui";


export class Slice {
    id: string;
    name: string;
    color: UIColor;
    angle: number;
}

export class Pie {
    slices: Array<Slice>;

    // TODO: Construct from JSON?
    constructor(data: Array<Slice>) {
        this.slices = data;
    }

    sliceArcLengths(): number[] {
        const lens = this.slices.map((slice, index, array) => {
            const nextIndex = mod((index + 1), array.length);
            const next = array[nextIndex];

            return util.arcLength(slice.angle, next.angle);
        });

        return lens;
    }

    addSlice() {
        console.log("addSlice");
        const arc_lens = this.sliceArcLengths(); //Get all arc lens in radians
        const arc_pcts = arc_lens.map(v => v / TWO_PI); //Arc lens as percent of circle
        console.log(`arc pcts: ${arc_pcts}`);
    
        const avg_arc_pct = util.average(arc_pcts); //Avg lens as percent of circle -> Length of new slice
        const new_pct = (avg_arc_pct) / (1 + avg_arc_pct);

        const new_len = new_pct * TWO_PI; 
    
        //Construct new slice, to insert at end of pie after shifting all other slices
        const new_angle = 0 - (new_len * 0.5) + TWO_PI; 
        const new_id = crypto.randomUUID().toString();
        const new_gray = 255;
        const new_slice = {
            id: new_id,
            name: `Slice: ${new_id}`,
            color: [new_gray, new_gray, new_gray],
            angle: new_angle
        }
    
        const new_slices: Array<Slice> = [new_slice];
    
        //Insert equivalent slices for each existing, but shifted and squeezed (displaced)
        const rest_len = TWO_PI - new_len;
        let current_a = new_len * 0.5; //Start at end of new slice
        for (let i = 0; i < arc_pcts.length; i ++) {
            const old_slice = this.slices[i];
            const slice: Slice = {
                id: old_slice.id,
                name: old_slice.name,
                color: old_slice.color,
                angle: current_a
            }
            new_slices.push(slice);
    
            current_a += arc_pcts[i] * rest_len; //Move a proportional to the remainder of the pie
        }
    
        this.slices = new_slices;
    }
    
    removeSlice(id: string) {
    
        //ix = index to remove
        const ix = this.slices.findIndex(slice => slice.id === id);
    
        const arc_lens = this.sliceArcLengths(); //Get all arc lens in radians
        const removed_len = arc_lens[ix]; 
        const remainder_total = TWO_PI - removed_len; 
         
        const arc_pcts = arc_lens.map(v => v / remainder_total); //Arc lens as percent of remaining circle
    
        const new_slices: Array<Slice> = [];
    
        //Actually start looping after the index to remove and wrap around
        let current_t = this.slices[ix].angle;
        for (let a = 1; a < arc_pcts.length; a ++) {
            const i = mod((ix + a), arc_pcts.length); 
    
            const old_slice = this.slices[i];
            const slice: Slice = {
                id: old_slice.id,
                name: old_slice.name,
                color: old_slice.color,
                angle: current_t
            }
            new_slices.push(slice);
    
            current_t += (arc_pcts[i] * TWO_PI); //Move proportional to the entire pie
            current_t = mod(current_t, TWO_PI);
        }
        this.slices = new_slices;
    }
    
    moveSliceFwd(id: string) {
    
        const i = this.slices.findIndex(w => w.id === id);
        const j = (i + 1) % this.slices.length;
        const k = (j + 1) % this.slices.length;
    
        const current = this.slices[i];
        const next = this.slices[j];
        const following = this.slices[k];
    
        const next_len = util.arcLength(next.angle, following.angle);
    
        const next_angle = current.angle;
        const curr_angle = mod(current.angle + next_len, TWO_PI);
    
        const new_slices = [];
        
        for (let w of this.slices) {
            let newSlice: Slice = structuredClone(w);
            new_slices.push(newSlice);
        }
        new_slices[i].angle = curr_angle;
        new_slices[j].angle = next_angle;
    
        [new_slices[i], new_slices[j]] = [new_slices[j], new_slices[i]];
        
        this.slices = new_slices;
    }
    
    moveSliceBwd(id: string) {
    
        const i = this.slices.findIndex(w => w.id === id);
        const h = mod(i - 1, this.slices.length);
    
        this.moveSliceFwd(this.slices[h].id);
    }

    scaleSlice(id: string, size: number) {

        const lens = this.sliceArcLengths();
        // console.log(lens);
        // console.log(this.slices[0], this.slices[1]);

        let i = this.slices.findIndex(w => w.id === id);

        let arc_len = lens[i];

        const og_rest_len = TWO_PI - arc_len;
        const rest_len = TWO_PI - size;

        const mid = mod(this.slices[i].angle + arc_len * 0.5, TWO_PI);
        console.log(`mid: ${mid}, size: ${size}`);

        this.slices[i].angle = mod(mid - size * 0.5, TWO_PI);

        let last = mod(mid + size * 0.5, TWO_PI);

        console.log(`a: ${this.slices[i].angle}, b: ${last}`);

        for (let c = 1 ; c < this.slices.length; c++) {
            let j = mod(i + c, this.slices.length);
            this.slices[j].angle = mod(last, TWO_PI);     
            // last = last + lens[j];       
            last = last + (lens[j] / og_rest_len) * rest_len;
        }
        console.log(this.sliceArcLengths());
    }
    
}
