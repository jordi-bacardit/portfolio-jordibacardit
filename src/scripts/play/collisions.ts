// Simple, physics-free collisions on the ground plane: the player is a circle, buildings and props
// are rotated boxes, and the walkable ground is a union of rectangles (the street, the plaza...).

export interface Box {
  x: number;
  z: number;
  halfX: number;
  halfZ: number;
  /** Rotation around Y, as in three.js (object.rotation.y). */
  rot: number;
}

/** An axis-aligned walkable rectangle. */
export interface Area {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface Point {
  x: number;
  z: number;
}

/** True when (x, z) is inside the box grown by `margin` on every side. */
export function resolveInside(x: number, z: number, box: Box, margin = 0) {
  const cos = Math.cos(box.rot);
  const sin = Math.sin(box.rot);
  const dx = x - box.x;
  const dz = z - box.z;
  const lx = dx * cos - dz * sin;
  const lz = dx * sin + dz * cos;
  return Math.abs(lx) <= box.halfX + margin && Math.abs(lz) <= box.halfZ + margin;
}

/** Pushes the point (radius r) out of every box and back onto the walkable areas. Mutates `p`. */
export function resolve(p: Point, r: number, boxes: Box[], areas: Area[]) {
  for (const box of boxes) {
    const cos = Math.cos(box.rot);
    const sin = Math.sin(box.rot);
    const dx = p.x - box.x;
    const dz = p.z - box.z;
    // World to box space (inverse of three.js' Y rotation).
    const lx = dx * cos - dz * sin;
    const lz = dx * sin + dz * cos;
    const cx = Math.max(-box.halfX, Math.min(box.halfX, lx));
    const cz = Math.max(-box.halfZ, Math.min(box.halfZ, lz));
    let px = lx - cx;
    let pz = lz - cz;
    const distance = Math.hypot(px, pz);
    if (distance >= r) continue;
    if (distance > 1e-6) {
      const push = (r - distance) / distance;
      px *= push;
      pz *= push;
    } else {
      // Centre inside the box: leave by the nearest side.
      const outX = box.halfX - Math.abs(lx) + r;
      const outZ = box.halfZ - Math.abs(lz) + r;
      if (outX < outZ) {
        px = Math.sign(lx || 1) * outX;
        pz = 0;
      } else {
        px = 0;
        pz = Math.sign(lz || 1) * outZ;
      }
    }
    // Box space back to world.
    p.x += px * cos + pz * sin;
    p.z += -px * sin + pz * cos;
  }

  // Stay on the walkable ground: if outside every area, step back to the nearest one.
  if (areas.some((a) => p.x >= a.minX && p.x <= a.maxX && p.z >= a.minZ && p.z <= a.maxZ)) return;
  let best: Point | null = null;
  let bestDistance = Infinity;
  for (const a of areas) {
    const q = { x: Math.max(a.minX, Math.min(a.maxX, p.x)), z: Math.max(a.minZ, Math.min(a.maxZ, p.z)) };
    const d = Math.hypot(q.x - p.x, q.z - p.z);
    if (d < bestDistance) {
      bestDistance = d;
      best = q;
    }
  }
  if (best) {
    p.x = best.x;
    p.z = best.z;
  }
}
