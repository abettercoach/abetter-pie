
import { TWO_PI, mod } from "./util";
import * as util from "./util";

import { UIColor } from "./ui";


export class Wedge {
    id: string;
    name: string;
    color: UIColor;
    angle: number;
}

export class Wheel {
    wedges: Array<Wedge>;

    // TODO: Construct from JSON?
    constructor(data: Array<Wedge>) {
        this.wedges = data;
    }

    wedgeArcLengths(): number[] {
        const lens = this.wedges.map((wedge, index, array) => {
            const nextIndex = mod((index + 1), array.length);
            const next = array[nextIndex];

            return util.arcLength(wedge.angle, next.angle);
        });

        return lens;
    }

    addWedge() {
        const arc_lens = this.wedgeArcLengths(); //Get all arc lens in radians
        const arc_pcts = arc_lens.map(v => v / TWO_PI); //Arc lens as percent of circle
    
        const avg_arc_pct = util.average(arc_pcts); //Avg lens as percent of circle -> Length of new wedge
        
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
    
        //Insert equivalent wedges for each existing, but shifted and squeezed (displaced)
        const rest_len = TWO_PI - new_len;
        let current_a = new_len * 0.5; //Start at end of new wedge
        for (let i = 0; i < arc_pcts.length; i ++) {
            const old_wedge = this.wedges[i];
            const wedge: Wedge = {
                id: old_wedge.id,
                name: old_wedge.name,
                color: old_wedge.color,
                angle: current_a
            }
            new_wedges.push(wedge);
    
            current_a += arc_pcts[i] * rest_len; //Move a proportional to the remainder of the wheel
        }
    
        this.wedges = new_wedges;
    }
    
    removeWedge(id: string) {
    
        //ix = index to remove
        const ix = this.wedges.findIndex(wedge => wedge.id === id);
    
        const arc_lens = this.wedgeArcLengths(); //Get all arc lens in radians
        const removed_len = arc_lens[ix]; 
        const remainder_total = TWO_PI - removed_len; 
         
        const arc_pcts = arc_lens.map(v => v / remainder_total); //Arc lens as percent of remaining circle
    
        const new_wedges: Array<Wedge> = [];
    
        //Actually start looping after the index to remove and wrap around
        let current_t = this.wedges[ix].angle;
        for (let a = 1; a < arc_pcts.length; a ++) {
            const i = mod((ix + a), arc_pcts.length); 
    
            const old_wedge = this.wedges[i];
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
        this.wedges = new_wedges;
    }
    
    moveWedgeFwd(id: string) {
    
        const i = this.wedges.findIndex(w => w.id === id);
        const j = (i + 1) % this.wedges.length;
        const k = (j + 1) % this.wedges.length;
    
        const current = this.wedges[i];
        const next = this.wedges[j];
        const following = this.wedges[k];
    
        const next_len = util.arcLength(next.angle, following.angle);
    
        const next_angle = current.angle;
        const curr_angle = mod(current.angle + next_len, TWO_PI);
    
        const new_wedges = [];
        
        for (let w of this.wedges) {
            let newWedge: Wedge = structuredClone(w);
            new_wedges.push(newWedge);
        }
        new_wedges[i].angle = curr_angle;
        new_wedges[j].angle = next_angle;
    
        [new_wedges[i], new_wedges[j]] = [new_wedges[j], new_wedges[i]];
        
        this.wedges = new_wedges;
    }
    
    moveWedgeBwd(id: string) {
    
        const i = this.wedges.findIndex(w => w.id === id);
        const h = mod(i - 1, this.wedges.length);
    
        this.moveWedgeFwd(this.wedges[h].id);
    }
    
}
