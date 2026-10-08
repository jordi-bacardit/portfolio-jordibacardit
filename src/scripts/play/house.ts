// Builds timber-framed houses and a stone tower from MegaKit pieces. In a building's own frame the
// ridge runs along z, the width (x) is 4, 6 or 8 m and the length (z) a multiple of 2 m; walls are
// 2 m modules, one storey is 3 m. Each facade lists its modules per storey, ground floor first.
// Doors sit in a matching frame (wood in plaster walls, a stone arch in stone walls). Buildings
// with an interior get their front door open, a wooden floor and a ceiling one storey up, and
// walls you collide with one by one (so you can walk in), plus the room (interiors.ts furnishes it).
import * as THREE from 'three';
import type { Box } from './collisions';
import { Kit, at } from './kit';

export const STOREY = 3;

/** One 2 m module of a facade ('grid' is an open wooden lattice, e.g. for a barn loft). */
export type Slot = 'wall' | 'door' | 'window' | 'narrow' | 'grid';

export interface HouseSpec {
  x: number;
  z: number;
  /** Rotation of the whole house around Y. */
  rot: number;
  width: 4 | 6 | 8;
  length: number;
  storeys: 1 | 2 | 3;
  /** Ground-floor walls: rough stone, or plaster on a stone base. */
  base?: 'brick' | 'plaster';
  /** Facades, each a list of storeys (ground first) of `width/2` or `length/2` slots. */
  front?: Slot[][];
  back?: Slot[][];
  left?: Slot[][];
  right?: Slot[][];
  /** A chimney on the roof: true for the usual spot on its right slope, or [x, z] in the house's frame. */
  chimney?: boolean | [number, number];
  /**
   * A balcony on the first floor of the front gable, in front of that floor's door (give it one:
   * otherwise it stands at the middle module). Keep it off the module beside the ground floor's
   * door where the door sign hangs (places.ts). The windows beside it and the one under it get no
   * shutters, which would open into it.
   */
  balcony?: boolean;
  shutters?: boolean;
  /** The room's name: the house can be entered through the first door of its front. */
  interior?: string;
}

const pieces = {
  plaster: {
    wall: 'Wall_Plaster_Straight',
    grid: 'Wall_Plaster_WoodGrid',
    door: 'Wall_Plaster_Door_Round',
    window: 'Wall_Plaster_Window_Wide_Round',
    narrow: 'Wall_Plaster_Window_Thin_Round',
    base: 'Wall_Plaster_Straight_Base',
    frame: 'DoorFrame_Round_WoodDark',
  },
  brick: {
    wall: 'Wall_UnevenBrick_Straight',
    grid: 'Wall_UnevenBrick_Straight',
    door: 'Wall_UnevenBrick_Door_Round',
    window: 'Wall_UnevenBrick_Window_Wide_Round',
    narrow: 'Wall_UnevenBrick_Window_Thin_Round',
    base: 'Wall_UnevenBrick_Straight',
    frame: 'DoorFrame_Round_Brick',
  },
};

/** A room you can walk into. */
export interface Room {
  name: string;
  /** The building's transform: interiors place their furniture in its frame. */
  frame: THREE.Matrix4;
  /** World to the building's frame. */
  inverse: THREE.Matrix4;
  /** The building's rotation around Y. */
  rot: number;
  /** Inside, in world space (for the camera and the place name). */
  box: THREE.Box3;
  /** Inside, in the building's frame: half sizes and the ceiling height. */
  halfW: number;
  halfL: number;
  height: number;
  /** The door's centre along the front, in the building's frame. */
  doorX: number;
  /** How many storeys the building has. */
  storeys: number;
}

/** What the world needs back from a building. */
export interface Built {
  colliders: Box[];
  /** A box that can block the camera. */
  occluder: THREE.Box3;
  /** Where smoke rises from, if it has a chimney. */
  chimneys: THREE.Vector3[];
  room?: Room;
}

/** The four facades in the building's frame: [centre x, centre z, rotation so +z faces out, span]. */
function facadeLines(width: number, length: number): [number, number, number, number][] {
  const halfW = width / 2;
  const halfL = length / 2;
  return [
    [0, halfL, 0, width],
    [0, -halfL, Math.PI, width],
    [halfW, 0, Math.PI / 2, length],
    [-halfW, 0, -Math.PI / 2, length],
  ];
}

const facadeIndex = { front: 0, back: 1, right: 2, left: 3 };

/**
 * A transform on the outside of a house's facade: `offset` metres along it (left to right as seen
 * from outside), `y` up, `out` metres out from the wall's outer face (which is 0.09 m out).
 */
export function onFacade(spec: HouseSpec, facade: keyof typeof facadeIndex, offset: number, y: number, out = 0.05) {
  const [cx, cz, rot] = facadeLines(spec.width, spec.length)[facadeIndex[facade]];
  const away = 0.09 + out;
  const x = cx + Math.cos(rot) * offset + Math.sin(rot) * away;
  const z = cz - Math.sin(rot) * offset + Math.cos(rot) * away;
  return new THREE.Matrix4().multiplyMatrices(at(spec.x, 0, spec.z, spec.rot), at(x, y, z, rot));
}

/** Places the facades of a box of walls (shared by houses and the tower). */
function buildWalls(
  put: (name: string, local: THREE.Matrix4) => void,
  width: number,
  length: number,
  storeys: number,
  facadesSlots: (Slot[][] | undefined)[],
  styleOf: (storey: number) => 'brick' | 'plaster',
  shutters: boolean,
  openDoorX: number | null,
  balconyModule: number | null = null,
) {
  const halfW = width / 2;
  const halfL = length / 2;
  facadeLines(width, length).forEach(([cx, cz, rot, span], index) => {
    const modules = span / 2;
    for (let storey = 0; storey < storeys; storey++) {
      const style = styleOf(storey);
      const set = pieces[style];
      const slots = facadesSlots[index]?.[storey] ?? [];
      for (let i = 0; i < modules; i++) {
        // Along the facade, left to right as seen from outside.
        const offset = -span / 2 + 1 + i * 2;
        const x = cx + Math.cos(rot) * offset;
        const z = cz - Math.sin(rot) * offset;
        const y = storey * STOREY;
        const slot = slots[i] ?? 'wall';
        const piece = slot === 'wall' && storey === 0 && style === 'plaster' ? set.base : set[slot];
        put(piece, at(x, y, z, rot));
        if (slot === 'door') {
          put(set.frame, at(x, y, z, rot));
          // The leaf hangs from its left hinge, centred in the frame; an open door swings inwards.
          const hingeX = x - Math.cos(rot) * 0.52;
          const hingeZ = z + Math.sin(rot) * 0.52;
          const open = index === 0 && storey === 0 && openDoorX !== null && Math.abs(offset - openDoorX) < 0.1;
          put('Door_8_Round', at(hingeX, y, hingeZ, open ? rot + Math.PI / 2 : rot));
        }
        if (slot === 'window' || slot === 'narrow') {
          put(slot === 'window' ? 'Window_Wide_Round1' : 'Window_Thin_Round1', at(x, y, z, rot));
          // Open shutters would poke into the balcony (beside it) or its braces (under it).
          const nearBalcony =
            index === 0 &&
            balconyModule !== null &&
            ((storey === 1 && Math.abs(i - balconyModule) === 1) || (storey === 0 && i === balconyModule));
          if (shutters && !nearBalcony) {
            put(slot === 'window' ? 'WindowShutters_Wide_Round_Open' : 'WindowShutters_Thin_Round_Open', at(x, y, z, rot));
          }
        }
      }
    }
  });
  // Timber posts on the corners, one per storey.
  for (const [x, z] of [[halfW, halfL], [-halfW, halfL], [halfW, -halfL], [-halfW, -halfL]]) {
    for (let storey = 0; storey < storeys; storey++) put('Corner_Exterior_Wood', at(x, storey * STOREY, z));
  }
}

/** A box in the building's frame, as a collider in the world. */
function worldBox(frame: THREE.Matrix4, rot: number, x: number, z: number, halfX: number, halfZ: number): Box {
  const centre = new THREE.Vector3(x, 0, z).applyMatrix4(frame);
  return { x: centre.x, z: centre.z, halfX, halfZ, rot };
}

/** World-space bounds of a box given in the building's frame. */
function worldBounds(frame: THREE.Matrix4, min: THREE.Vector3, max: THREE.Vector3) {
  const box = new THREE.Box3();
  for (const x of [min.x, max.x]) {
    for (const y of [min.y, max.y]) {
      for (const z of [min.z, max.z]) box.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(frame));
    }
  }
  return box;
}

/** Walls you collide with one by one, with a gap for the front door, plus the room. */
function enterable(
  put: (name: string, local: THREE.Matrix4) => void,
  frame: THREE.Matrix4,
  rot: number,
  name: string,
  width: number,
  length: number,
  doorX: number,
  storeys: number,
): { colliders: Box[]; room: Room } {
  const halfW = width / 2;
  const halfL = length / 2;
  const t = 0.2;
  const gap = 0.75;
  const colliders = [
    worldBox(frame, rot, (-halfW + doorX - gap) / 2, halfL - 0.1, (doorX - gap + halfW) / 2, t),
    worldBox(frame, rot, (halfW + doorX + gap) / 2, halfL - 0.1, (halfW - doorX - gap) / 2, t),
    worldBox(frame, rot, 0, -halfL + 0.1, halfW, t),
    worldBox(frame, rot, halfW - 0.1, 0, t, halfL),
    worldBox(frame, rot, -halfW + 0.1, 0, t, halfL),
    // The open door leaf, against the wall on the hinge side.
    worldBox(frame, rot, doorX - 0.52, halfL - 0.6, 0.08, 0.55),
  ];
  // Wooden floor, and boards upside down as the ceiling (one storey high, even under a roof).
  const flip = new THREE.Matrix4().makeRotationX(Math.PI);
  for (let x = -halfW + 1; x < halfW; x += 2) {
    for (let z = -halfL + 1; z < halfL; z += 2) {
      put('Floor_WoodDark', at(x, 0.03, z));
      put('Floor_WoodDark', at(x, STOREY - 0.02, z).multiply(flip));
    }
  }
  const height = STOREY - 0.1;
  const inner = 0.35;
  const box = worldBounds(frame, new THREE.Vector3(-halfW + inner, 0, -halfL + inner), new THREE.Vector3(halfW - inner, height, halfL - inner));
  const inverse = frame.clone().invert();
  return { colliders, room: { name, frame, inverse, rot, box, halfW, halfL, height, doorX, storeys } };
}

const local = new THREE.Vector3();

/** True when a world point is inside the room (at least `margin` from its walls). */
export function inRoom(room: Room, point: THREE.Vector3, margin = 0.25) {
  local.copy(point).applyMatrix4(room.inverse);
  return Math.abs(local.x) < room.halfW - margin && Math.abs(local.z) < room.halfL - margin;
}

/** The first door of the ground floor's front, if any (its centre along the front). */
function frontDoor(front: Slot[][] | undefined, width: number) {
  const index = front?.[0]?.indexOf('door') ?? -1;
  return index < 0 ? null : -width / 2 + 1 + index * 2;
}

export function buildHouse(kit: Kit, spec: HouseSpec): Built {
  const frame = at(spec.x, 0, spec.z, spec.rot);
  const put = (name: string, local: THREE.Matrix4) => kit.place(name, new THREE.Matrix4().multiplyMatrices(frame, local));
  const halfW = spec.width / 2;
  const halfL = spec.length / 2;
  const height = spec.storeys * STOREY;
  const doorX = spec.interior ? frontDoor(spec.front, spec.width) : null;
  // The balcony's module on the first floor: its door, else the middle one.
  let balconyModule: number | null = null;
  if (spec.balcony && spec.storeys >= 2) {
    const door = spec.front?.[1]?.indexOf('door') ?? -1;
    balconyModule = door >= 0 ? door : Math.floor((spec.width / 2 - 1) / 2);
  }

  buildWalls(
    put,
    spec.width,
    spec.length,
    spec.storeys,
    [spec.front, spec.back, spec.right, spec.left],
    (storey) => (storey === 0 ? (spec.base ?? 'plaster') : 'plaster'),
    Boolean(spec.shutters),
    doorX,
    balconyModule,
  );

  // Roof along z, gable triangles at both ends, maybe a chimney and a balcony.
  const roof = `Roof_RoundTiles_${spec.width}x${spec.length}`;
  put(kit.has(roof) ? roof : `Roof_RoundTiles_${spec.width}x8`, at(0, height, 0));
  put(`Roof_Front_Brick${spec.width}`, at(0, height, halfL));
  put(`Roof_Front_Brick${spec.width}`, at(0, height, -halfL, Math.PI));
  const chimneys: THREE.Vector3[] = [];
  if (spec.chimney) {
    const [x, z] = spec.chimney === true ? [halfW * 0.45, -halfL * 0.4] : spec.chimney;
    put('Prop_Chimney', at(x, height + 0.4, z));
    chimneys.push(new THREE.Vector3(x, height + 3.7, z).applyMatrix4(frame));
  }
  if (balconyModule !== null) {
    // The railing piece stands 1 m out from its origin: give it a floor, short side railings and
    // two braces down to the wall, so it doesn't hang in the air.
    const x = -halfW + 1 + balconyModule * 2;
    put('Balcony_Cross_Straight', at(x, STOREY, halfL));
    put('Floor_WoodDark_Half3', at(x, STOREY, halfL + 1));
    const half = new THREE.Matrix4().makeScale(0.5, 1, 1);
    put('Balcony_Cross_Straight', at(x, STOREY, halfL + 0.5, -Math.PI / 2).multiply(half));
    put('Balcony_Cross_Straight', at(x, STOREY, halfL + 0.5, Math.PI / 2).multiply(half));
    for (const side of [-0.85, 0.85]) put('Prop_Support', at(x + side, STOREY - 1.52, halfL, 0, 0.52));
  }

  const occluder = worldBounds(frame, new THREE.Vector3(-halfW, 0, -halfL), new THREE.Vector3(halfW, height + 4, halfL));
  if (spec.interior && doorX !== null) {
    const inside = enterable(put, frame, spec.rot, spec.interior, spec.width, spec.length, doorX, spec.storeys);
    return { colliders: inside.colliders, occluder, chimneys, room: inside.room };
  }
  const solid: Box = { x: spec.x, z: spec.z, halfX: halfW + 0.2, halfZ: halfL + 0.2, rot: spec.rot };
  return { colliders: [solid], occluder, chimneys };
}

export interface TowerSpec {
  x: number;
  z: number;
  rot: number;
  storeys: number;
  /** Facades as for houses: front, back, right, left. */
  front?: Slot[][];
  back?: Slot[][];
  right?: Slot[][];
  left?: Slot[][];
  interior?: string;
}

/** A 4 × 4 m stone tower with a pointed tiled roof: the village's landmark. */
export function buildTower(kit: Kit, spec: TowerSpec): Built {
  const frame = at(spec.x, 0, spec.z, spec.rot);
  const put = (name: string, local: THREE.Matrix4) => kit.place(name, new THREE.Matrix4().multiplyMatrices(frame, local));
  const height = spec.storeys * STOREY;
  const doorX = spec.interior ? frontDoor(spec.front, 4) : null;
  buildWalls(put, 4, 4, spec.storeys, [spec.front, spec.back, spec.right, spec.left], () => 'brick', false, doorX);
  put('Roof_Tower_RoundTiles', at(0, height + 0.15, 0));
  const occluder = worldBounds(frame, new THREE.Vector3(-2, 0, -2), new THREE.Vector3(2, height + 7, 2));
  if (spec.interior && doorX !== null) {
    const inside = enterable(put, frame, spec.rot, spec.interior, 4, 4, doorX, spec.storeys);
    return { colliders: inside.colliders, occluder, chimneys: [], room: inside.room };
  }
  return { colliders: [{ x: spec.x, z: spec.z, halfX: 2.2, halfZ: 2.2, rot: spec.rot }], occluder, chimneys: [] };
}
