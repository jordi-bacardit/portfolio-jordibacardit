// What's inside the buildings you can walk into: furniture from the Fantasy Props MegaKit (CC0),
// open fires, candles and the people there. Everything is given in the building's own frame
// (x across the front, z towards the door, which is at +z), then placed in the world.
// Props face +z, so a piece against the back wall needs no turn, one against the left wall
// (x < 0) turns L and one against the right wall turns R. Inner walls stand 0.31 m inside the
// building's outline.
import * as THREE from 'three';
import type { Look } from './characters';
import type { Box } from './collisions';
import type { Room } from './house';
import { Kit, at } from './kit';
import type { NpcSpec } from './layout';
import type { LightSource } from './lights';
import { palette } from './palette';

const L = Math.PI / 2;
const R = -Math.PI / 2;
const UP = new THREE.Vector3(0, 1, 0);

interface Interior {
  /** [piece, x, y, z, rotation, scale (or x, y, z scales)]: props first, then the house kit (bricks). */
  pieces: [string, number, number, number, number?, (number | [number, number, number])?][];
  /** Furniture you bump into: [x, z, halfX, halfZ]. */
  solid: [number, number, number, number][];
  /** Open fires: [x, z, size, height of what they burn on (the floor if left out)]. */
  fires: [number, number, number, number?][];
  /** Candles and chandeliers: [x, y, z, intensity, reach]. */
  candles: [number, number, number, number, number][];
  /** Torches in wall brackets: [x, y, z, rotation] (the bracket against the wall, facing out). */
  torches?: [number, number, number, number][];
  people: NpcSpec[];
}

/** A ring of stones around an open fire. */
function hearth(x: number, z: number, radius: number): Interior['pieces'] {
  const stones = ['Prop_Brick1', 'Prop_Brick2', 'Prop_Brick3', 'Prop_Brick4'];
  return Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2;
    return [stones[i % 4], x + Math.cos(a) * radius, 0.1, z + Math.sin(a) * radius, -a + Math.PI / 2, 0.9];
  });
}

/**
 * A smith's forge against the back wall (its inner face at `z`): a raised bed 2.4 m wide, 1.2 m
 * deep and 0.94 m high (the kit's brick wall at 0.3 scale, a stone top) and a brick chimney breast
 * 1.2 m wide and 0.7 m deep rising from its back half to the ceiling (the same wall, stretched).
 * The fire burns on the front half, 0.95 m from the wall. The wall piece is 2 × 3.12 m and its
 * brick face is 0.09 m out from its origin (the other face is plaster).
 */
function forge(z: number): Interior['pieces'] {
  const wall = 'Wall_UnevenBrick_Straight';
  const bed = { scale: 0.3, height: 0.94 };
  const face = 0.09 * bed.scale;
  const pieces: Interior['pieces'] = [];
  for (const x of [-0.9, -0.3, 0.3, 0.9]) pieces.push([wall, x, 0, z + 1.2 - face, 0, bed.scale]);
  for (const side of [-1, 1]) {
    for (const dz of [0.3, 0.9]) pieces.push([wall, side * (1.2 - face), 0, z + dz, side * L, bed.scale]);
  }
  for (const x of [-0.6, 0.6]) pieces.push(['Floor_UnevenBrick', x, bed.height, z + 0.6, 0, 0.6]);
  // The breast: from the bed up to (and just through) the ceiling, 3 m up.
  const breast = { width: 1.2, depth: 0.7, height: 2.1, thickness: 0.5 };
  const up = breast.height / 3.12;
  pieces.push([wall, 0, bed.height, z + breast.depth - 0.09 * breast.thickness, 0, [breast.width / 2, up, breast.thickness]]);
  for (const side of [-1, 1]) {
    const x = side * (breast.width / 2 - 0.09 * breast.thickness);
    pieces.push([wall, x, bed.height, z + breast.depth / 2, side * L, [breast.depth / 2, up, breast.thickness]]);
  }
  return pieces;
}

/** A bookcase (1.46 m wide) with books on its shelves; `seed` varies which books go where. */
function bookcase(x: number, z: number, rot: number, seed: number): Interior['pieces'] {
  const shelves = [0.765, 1.15, 1.535, 1.92];
  const pieces: Interior['pieces'] = [['Bookcase_2', x, 0, z, rot]];
  // Along the bookcase, in the room's frame.
  const along = (offset: number): [number, number] => [x + Math.cos(rot) * offset, z - Math.sin(rot) * offset];
  shelves.forEach((y, row) => {
    const pick = (seed + row) % 3;
    if (pick === 2) {
      for (const offset of [-0.38, 0.32]) {
        const [bx, bz] = along(offset);
        pieces.push(['BookGroup_Small_1', bx, y, bz, rot]);
      }
    } else {
      pieces.push([pick === 0 ? 'BookGroup_Medium_1' : 'BookGroup_Medium_2', x, y, z, rot]);
    }
  });
  return pieces;
}

const tavernFolk: Record<string, Look> = {
  barkeep: { outfit: 'Male_Peasant', head: 'Male_Head', extras: ['Hair_SimpleParted', 'Hair_Beard', 'Eyebrows_Regular'], hair: 0x5a3a22, tint: 0xb8a890 },
  patron: { outfit: 'Male_Peasant', head: 'Male_Head', extras: ['Hair_Buzzed', 'Hair_Beard', 'Eyebrows_Regular'], hair: 0x2a1d14, variant: true },
  friend: { outfit: 'Male_Ranger', head: 'Male_Head', extras: ['Hair_Long', 'Eyebrows_Regular'], hair: 0x3c2a1c, tint: 0x9a9080 },
  singer: { outfit: 'Female_Peasant', head: 'Female_Head', extras: ['Hair_Long', 'Eyebrows_Female'], hair: 0x8a4a26, variant: true },
  drinker: { outfit: 'Male_Peasant', head: 'Male_Head', extras: ['Hair_SimpleParted', 'Eyebrows_Regular'], hair: 0x1e1610, tint: 0x8a8070 },
  traveller: { outfit: 'Female_Ranger', head: 'Female_Head', extras: ['Hair_Buns', 'Eyebrows_Female'], hair: 0x241810 },
};

export const interiors: Record<string, Interior> = {
  // The tavern on the north side of the square: 8 × 8 m, door at x = -1.
  'The Rusty Tankard': {
    pieces: [
      // The bar: a counter of cabinets, the barrels and bottles behind it.
      ['Cabinet', 1.0, 0, -1.7],
      ['Cabinet', 2.36, 0, -1.7],
      ['Mug', 0.7, 1.0, -1.65, 0.4],
      ['Mug', 1.9, 1.0, -1.72, 2.1],
      ['Bottle_1', 2.6, 1.0, -1.75],
      ['Coin_Pile', 1.4, 1.0, -1.62],
      ['Candle_2', 2.95, 1.0, -1.68],
      // The note with Jordi's contact details, at the near end of the counter.
      ['Scroll_1', 0.5, 1.0, -1.62, 0.4],
      ['Scroll_2', 0.62, 1.0, -1.78, 1.3],
      ['Candle_1', 0.38, 1.0, -1.82],
      ['Barrel_Holder', 2.4, 0, -3.3],
      ['Shelf_Small_Bottles', 0.75, 1.3, -3.68],
      ['Shelf_Simple', 0.75, 2.15, -3.72],
      ['Bottle_1', 0.4, 2.26, -3.52],
      ['Mug', 0.8, 2.26, -3.52, 1.2],
      ['Mug', 1.1, 2.26, -3.5, 2.6],
      // The long table, its benches and the chandelier above it.
      ['Table_Large', 1.6, 0, 1.5],
      ['Bench', 1.6, 0, 0.62],
      ['Bench', 1.6, 0, 2.38],
      ['Table_Plate', 1.0, 0.81, 1.25],
      ['Table_Plate', 2.2, 0.81, 1.8],
      ['Mug', 1.25, 0.81, 1.3, 0.8],
      ['Mug', 2.45, 0.81, 1.72, 3.6],
      ['Mug', 0.55, 0.81, 1.78, 5.2],
      ['CandleStick_Triple', 1.65, 0.81, 1.55, 0.1],
      ['Bottle_1', 2.75, 0.81, 1.3],
      ['Chandelier', 1.6, 2.98, 1.5, 0, 0.8],
      // The hearth, and a barrel for a table by the fire.
      ...hearth(-2.1, -1.2, 0.5),
      ['Barrel', -2.6, 0, 1.4],
      ['Mug', -2.65, 0.9, 1.3, 1.9],
      ['Candle_1', -2.45, 0.9, 1.5],
      ['Stool', -2.6, 0, 2.15],
      ['Stool', -1.85, 0, 1.3],
      // Stores in the corner, a banner and a shield on the walls.
      ['Barrel', -3.25, 0, -3.25],
      ['Barrel', -2.5, 0, -3.3],
      ['Crate_Wooden', -3.2, 0, -2.4, 0.3, 0.8],
      ['Banner_2_Cloth', -3.65, 2.75, -0.4, L],
      ['Shield_Wooden', 3.68, 1.8, 0.4, R],
    ],
    solid: [
      [1.68, -1.7, 1.38, 0.25],
      [2.4, -3.3, 0.7, 0.4],
      [1.6, 1.5, 1.45, 1.15],
      [-2.1, -1.2, 0.6, 0.6],
      [-2.6, 1.4, 0.4, 0.4],
      [-2.6, 2.15, 0.25, 0.25],
      [-1.85, 1.3, 0.25, 0.25],
      [-2.9, -3.0, 0.8, 0.7],
    ],
    fires: [[-2.1, -1.2, 1]],
    torches: [[-3.68, 1.9, 3.0, L]],
    candles: [
      [1.6, 2.0, 1.5, 7, 8],
      [2.95, 1.3, -1.68, 1.5, 3],
      [0.38, 1.3, -1.82, 1.5, 3],
    ],
    people: [
      {
        // Standing behind the counter, chatting with the man drinking at it (the rail clip leans
        // on something 1.3 m high: the counter is 1 m).
        name: 'The barkeep', look: tavernFolk.barkeep, clip: 'Idle_Talking_Loop', x: 1.9, z: -2.2, rot: 0,
        lines: [
          'Ale, stew or a bed for the night? Only the first two today.',
          'Want to reach Jordi? The note at the end of the counter says how.',
          'Wipe your boots. The road is all mud this time of year.',
        ],
      },
      {
        name: 'A farmer', look: tavernFolk.patron, clip: 'Sitting_Talking_Loop', x: 1.0, z: 0.62, rot: 0,
        lines: ['The barley came in late, but it came in. That calls for another round.'],
      },
      { look: tavernFolk.friend, clip: 'Sitting_Idle_Loop', x: 2.3, z: 0.62, rot: 0 },
      {
        name: 'A minstrel', look: tavernFolk.singer, clip: 'Sitting_Talking_Loop', x: 1.9, z: 2.38, rot: Math.PI,
        lines: ['I know a song about this village. It is very short. Nothing ever happens here.'],
      },
      {
        name: 'A thirsty man', look: tavernFolk.drinker, clip: 'Consume', x: 2.1, z: -1.05, rot: Math.PI, hold: 'mug',
        lines: ['Mm. Best ale this side of the forest. Also the only ale this side of the forest.'],
      },
      {
        name: 'A traveller', look: tavernFolk.traveller, clip: 'Idle_Loop', x: -1.35, z: -0.4, rot: -2.36,
        lines: ['Three days on the old road and not a single bandit. I am almost disappointed.'],
      },
    ],
  },

  // The smithy on the east side of the High Street: 6 × 10 m, door at x = 0.
  'The Smithy': {
    pieces: [
      ...forge(-4.69),
      ['Anvil_Log', 0.3, 0, -1.7],
      ['Whetstone', -1.8, 0, -3.7],
      ['Barrel', 1.75, 0, -4.0],
      ['Bucket_Metal', 1.9, 0, -3.1],
      ['Workbench', -2.18, 0, 0.6, L],
      ['Pouch_Large', -2.2, 0.89, 0.15, 0.4],
      ['Rope_2', -2.15, 0.89, 1.15, 0, 0.6],
      ['CandleStick', -2.25, 0.89, 1.55, L],
      ['WeaponStand', 2.2, 0, -0.8, R],
      ['Peg_Rack', 2.68, 1.7, 1.3, R],
      ['Shield_Wooden', 2.68, 1.5, 2.6, R],
      ['Shield_Wooden', 2.68, 1.5, 3.4, R],
      ['Crate_Wooden', -2.1, 0, 3.85, 0.2],
      ['Bag', -1.25, 0, 4.1, 0.6],
      ['Dummy', 1.6, 0, 3.0, -2.4],
    ],
    solid: [
      [0, -4.09, 1.25, 0.65],
      [0.3, -1.7, 0.5, 0.42],
      [-1.8, -3.7, 0.6, 0.5],
      [1.75, -4.0, 0.4, 0.4],
      [1.9, -3.1, 0.25, 0.25],
      [-2.18, 0.6, 0.55, 1.05],
      [2.2, -0.8, 0.5, 0.7],
      [-1.8, 3.9, 0.8, 0.5],
      [1.6, 3.0, 0.4, 0.4],
    ],
    fires: [[0, -3.74, 0.7, 0.94]],
    torches: [[2.68, 1.9, 1.7, R], [-2.68, 1.9, -2.2, L]],
    candles: [[-2.25, 1.15, 1.55, 2, 4]],
    people: [
      {
        name: 'The smith', clip: 'Interact', x: 0.3, z: -0.95, rot: Math.PI, beat: { sound: 'hammer', at: 0.45 },
        look: { outfit: 'Male_Peasant', head: 'Male_Head', extras: ['Hair_Buzzed', 'Hair_Beard', 'Eyebrows_Regular'], hair: 0x1a120c, tint: 0x7a7068 },
        lines: [
          'Every craft needs its tools. Jordi\'s are on the board above the workbench.',
          'Mind the sparks. And the anvil. And the hammer.',
        ],
      },
    ],
  },

  // The library on the west side of the High Street: 8 × 10 m, door at x = -1.
  'The Old Library': {
    pieces: [
      ...bookcase(-2.9, -4.47, 0, 0),
      ...bookcase(-1.4, -4.47, 0, 1),
      ...bookcase(1.4, -4.47, 0, 2),
      ...bookcase(2.9, -4.47, 0, 1),
      // Between the two middle bookcases (the cloth hangs down from its origin).
      ['Banner_1_Cloth', 0, 2.8, -4.65],
      ...bookcase(-3.47, -2.6, L, 2),
      ...bookcase(-3.47, -1.1, L, 0),
      ...bookcase(3.47, -2.6, R, 1),
      ['Cabinet', 3.51, 0, -0.6, R],
      ['Book_Stack_2', 3.5, 1.0, -0.95, 0.4],
      ['CandleStick', 3.5, 1.0, -0.2, R],
      // The reading table.
      ['Table_Large', 0.4, 0, -1.2],
      ['Chair_1', -0.3, 0, -2.05],
      ['Chair_1', 1.1, 0, -0.3, Math.PI],
      ['Book_7', 0.0, 0.84, -1.3, 0.3],
      ['Book_Stack_1', 1.3, 0.81, -1.45, 0.2],
      ['Scroll_1', 0.75, 0.81, -1.0, 0.5],
      ['Scroll_2', 0.85, 0.81, -1.5, 1.2],
      ['CandleStick_Triple', 0.4, 0.81, -1.4],
      ['Candle_2', -0.65, 0.81, -1.5],
      ['BookGroup_Small_1', 1.65, 0.81, -0.95, 3.0],
      ['Chandelier', 0.4, 2.98, -1.2, 0, 0.8],
      // A lectern by the portrait (see places.ts), a chest and a stack waiting to be shelved.
      ['BookStand', -2.5, 0, 2.5, 1.1],
      ['Chest_Wood', 3.1, 0.25, 3.3, R, 0.7],
      ['Book_Stack_2', -3.2, 0, 3.6, 1.1],
      ['Book_Stack_1', -3.15, 0.2, 3.62, 2.3],
      ['Vase_2', 2.9, 0, 0.9, 0, 0.8],
    ],
    solid: [
      [0, -4.4, 3.7, 0.3],
      [-3.45, -1.85, 0.3, 1.5],
      [3.45, -1.65, 0.3, 1.8],
      [0.4, -1.2, 1.5, 1.1],
      [-2.5, 2.5, 0.35, 0.35],
      [3.1, 3.3, 0.5, 0.75],
      [-3.2, 3.6, 0.3, 0.3],
      [2.9, 0.9, 0.3, 0.3],
    ],
    fires: [],
    candles: [
      [0.4, 2.0, -1.2, 7, 9],
      [0.4, 1.25, -1.4, 2.5, 4],
    ],
    people: [
      {
        name: 'A scholar', clip: 'Sitting_Idle_Loop', x: -0.3, z: -2.05, rot: 0,
        look: { outfit: 'Female_Peasant', head: 'Female_Head', extras: ['Hair_Buns', 'Eyebrows_Female'], hair: 0x9a9088, tint: 0x8a8aa0 },
        lines: ['Shh. Some of these books are older than the village. Some are older than the forest.'],
      },
      {
        name: 'The librarian', clip: 'Interact', x: 1.9, z: -3.55, rot: Math.PI,
        look: { outfit: 'Male_Peasant', head: 'Male_Head', extras: ['Hair_SimpleParted', 'Eyebrows_Regular'], hair: 0xb8b2a8, tint: 0x8a8aa0 },
        lines: [
          'The book on the lectern is about Jordi. Have a read.',
          'Every book here was written by hand. Please do not lick your fingers to turn the pages.',
        ],
      },
    ],
  },

  // The hall on the east side of the High Street, where Jordi's projects hang (see places.ts):
  // 8 × 8 m, door at x = 1. The left wall has windows in the middle; the right and back walls
  // are free for the frames.
  'The Hall of Works': {
    pieces: [
      ['Bench', 0, 0, 0.6],
      // Over the bench, so it doesn't hang in front of the frames.
      ['Chandelier', 0, 2.98, 1.1, 0, 0.8],
      ['Cabinet', -3.51, 0, -2.9, L],
      ['CandleStick_Triple', -3.5, 1.0, -2.9, L],
      ['Cabinet', -3.51, 0, 2.7, L],
      ['Book_Stack_1', -3.5, 1.0, 2.4, 0.5],
      ['Vase_4', -3.48, 1.0, 3.0],
      ['Vase_2', 3.1, 0, 3.15, 0, 0.8],
    ],
    solid: [
      [0, 0.6, 1.4, 0.3],
      [-3.5, -2.9, 0.2, 0.7],
      [-3.5, 2.7, 0.2, 0.7],
      [3.1, 3.15, 0.3, 0.3],
    ],
    fires: [],
    candles: [
      [0, 2.0, 1.1, 8, 10],
      [-3.45, 1.45, -2.9, 2.5, 5],
    ],
    people: [
      {
        name: 'A visitor', clip: 'Sitting_Idle_Loop', x: 0.7, z: 0.6, rot: Math.PI,
        look: { outfit: 'Female_Ranger', head: 'Female_Head', extras: ['Hair_Long', 'Eyebrows_Female'], hair: 0x6b3f22, tint: 0xa09080 },
        lines: ['Every frame on these walls is one of Jordi\'s projects. Walk up to one and have a look.'],
      },
    ],
  },

  // A cottage on the west side, just south of the square: 6 × 6 m, door at x = 0.
  "The Herbalist's Cottage": {
    pieces: [
      ['Bed_Twin1', -1.75, 0, -1.48],
      ['Nightstand_Shelf', -0.4, 0, -2.49],
      ['Candle_1', -0.4, 1.21, -2.5],
      ...hearth(1.5, -1.5, 0.6),
      ['Cauldron', 1.5, 0.05, -1.5],
      ['Cabinet', 2.51, 0, 0.9, R],
      ['Potion_2', 2.5, 1.0, 0.5],
      ['Potion_2', 2.45, 1.0, 1.25, 0, 0.9],
      ['Vase_4', 2.48, 1.0, 0.85, 0, 0.6],
      ['Shelf_Small_Bottles', 2.68, 1.55, 0.9, R],
      ['Pot_1_Lid', -2.2, 0, 1.4],
      ['Bag', -2.2, 0, 2.2, 0.8],
      ['Bucket_Wooden_1', 0.6, 0, -0.4],
      ['Chair_1', -1.1, 0, 1.0, 2.0],
    ],
    solid: [
      [-1.75, -1.48, 0.95, 1.22],
      [-0.4, -2.49, 0.36, 0.2],
      [1.5, -1.5, 0.65, 0.65],
      [2.51, 0.9, 0.2, 0.7],
      [-2.2, 1.8, 0.35, 0.75],
      [0.6, -0.4, 0.22, 0.22],
      [-1.1, 1.0, 0.3, 0.3],
    ],
    fires: [[1.5, -1.5, 0.6]],
    candles: [[-0.4, 1.45, -2.5, 2, 4]],
    people: [
      {
        name: 'The herbalist', clip: 'Interact', x: 1.5, z: -0.6, rot: Math.PI,
        look: { outfit: 'Female_Peasant', head: 'Female_Head', extras: ['Hair_Long', 'Eyebrows_Female'], hair: 0x3a2a1c, variant: true },
        lines: [
          'Nettle, sage and a pinch of something I will not name. Good for coughs.',
          'Do not drink from the green bottles. Do not drink from the blue ones either.',
        ],
      },
    ],
  },
};

export interface Furnished {
  colliders: Box[];
  fires: { position: THREE.Vector3; size: number; room: Room }[];
  /** The flames of the wall torches (drawn like the fires, without embers, and silent). */
  torchFlames: { position: THREE.Vector3; size: number }[];
  lights: LightSource[];
  people: (NpcSpec & { room: Room })[];
}

/** Embers under a fire: a low glowing mound, bright enough for the bloom. */
const emberGeometry = new THREE.SphereGeometry(0.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.3, 1);
const emberMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(palette.fire).multiplyScalar(1.6), toneMapped: false });
/** Two charred logs crossed over the embers. */
const logGeometry = new THREE.CylinderGeometry(0.06, 0.07, 0.62, 7).rotateZ(Math.PI / 2);
const logMaterial = new THREE.MeshStandardMaterial({ color: 0x24170f, roughness: 0.95 });

/** Furnishes a room. */
export function furnish(room: Room, kit: Kit, props: Kit, parent: THREE.Object3D): Furnished {
  const result: Furnished = { colliders: [], fires: [], torchFlames: [], lights: [], people: [] };
  const inside = interiors[room.name];
  if (!inside) return result;
  const toWorld = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).applyMatrix4(room.frame);

  for (const [name, x, y, z, rot = 0, scale = 1] of inside.pieces) {
    const local =
      typeof scale === 'number'
        ? at(x, y, z, rot, scale)
        : new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(UP, rot), new THREE.Vector3(...scale));
    const matrix = new THREE.Matrix4().multiplyMatrices(room.frame, local);
    (props.has(name) ? props : kit).place(name, matrix);
  }
  for (const [x, z, halfX, halfZ] of inside.solid) {
    const centre = toWorld(x, 0, z);
    result.colliders.push({ x: centre.x, z: centre.z, halfX, halfZ, rot: room.rot });
  }
  for (const [x, z, size, base = 0] of inside.fires) {
    const position = toWorld(x, base + 0.1, z);
    result.fires.push({ position, size, room });
    const fire = new THREE.Group();
    fire.position.copy(position).y = base + 0.04;
    fire.scale.setScalar(size);
    const embers = new THREE.Mesh(emberGeometry, emberMaterial);
    fire.add(embers);
    for (const turn of [0.5, -0.6]) {
      const log = new THREE.Mesh(logGeometry, logMaterial);
      log.position.y = 0.08;
      log.rotation.y = turn;
      log.castShadow = true;
      fire.add(log);
    }
    parent.add(fire);
    result.lights.push({ position: position.clone().setY(base + 1.1), color: palette.fire, intensity: 11 * size, distance: 9, room, flicker: 0.7 });
  }
  for (const [x, y, z, intensity, distance] of inside.candles) {
    result.lights.push({ position: toWorld(x, y, z), color: palette.fire, intensity, distance, room, flicker: 0.25 });
  }
  for (const [x, y, z, rot] of inside.torches ?? []) {
    props.place('Torch_Metal', new THREE.Matrix4().multiplyMatrices(room.frame, at(x, y, z, rot)));
    // The torch's head sits 0.3 m out from the wall and 0.35 m above the bracket.
    const flame = toWorld(x + Math.sin(rot) * 0.3, y + 0.42, z + Math.cos(rot) * 0.3);
    result.torchFlames.push({ position: flame, size: 0.24 });
    result.lights.push({ position: flame, color: palette.fire, intensity: 5, distance: 7, room, flicker: 0.6 });
  }
  for (const person of inside.people) {
    const position = toWorld(person.x, 0, person.z);
    result.people.push({ ...person, x: position.x, z: position.z, rot: person.rot + room.rot, room });
  }
  return result;
}
