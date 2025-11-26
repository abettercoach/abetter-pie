
export const TWO_PI = Math.PI * 2;

export type Point = { x: number, y: number };
export type Line = { a: Point, b: Point };

export type Shape = Circle | Rect | Arc;

export type Circle = {o: Point, r: number, kind: 'circle'};
export type Rect = {o: Point, w: number, h: number, kind: 'rect' };
export type Arc = {o: Point, r: number, t1: number, t2: number, kind: 'arc'}

export function mod(a: number, n: number) {
  return ((a % n) + n) % n;
}

export function average(ns: number[]): number {
    console.assert(ns.length > 0, "Attempted to get average of zero length list.");

    const total = ns.reduce((acc, val) => {
        return acc + val;
    }, 0);
    return total / ns.length;
}

export function arcLength(alpha: number, beta: number) {
    // Assume clockwise movement from alpha to beta
    const delta = beta - alpha;
    const length = delta > 0 ? delta : delta + TWO_PI;
    return length;
}

export function angleBetween(alpha: number, beta: number) {
    let length = arcLength(alpha, beta);
    const mid = alpha + (length / 2);
    const norm = mod(mid, TWO_PI);

    return norm;
}

export function angleFromPoint(p: Point, s?: Shape) {
    let p_t = Math.atan2(p.y - s.o.y, p.x - s.o.x);
    if (p_t < 0) {
        p_t += TWO_PI;
    }
    return p_t;
}

export function dist(a: Point, b: Point) {
    return Math.sqrt(distSq(a, b));
}

export function distSq(a: Point, b: Point) {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

export function pointIntersects(p: Point, s: Shape): boolean {
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
