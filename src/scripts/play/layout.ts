// The village map. Units are metres; north is -z. The old road comes out of the forest in the south,
// passes the gate and becomes the High Street, which climbs north to the Market Square: a lane of
// market stalls straight ahead, the old tree by the tavern and the stone tower. Houses face the
// street with their gable ends, slightly staggered and turned so the row doesn't look stamped out.
// The forest closes in on every side (nature.ts).
import type { Area } from './collisions';
import type { Look } from './characters';
import type { HouseSpec, TowerSpec } from './house';

export const STREET_HALF = 3;
/** The paved street runs from here (south) ... */
export const STREET_START = 33;
/** ... to the plaza. */
export const PLAZA = { minX: -11, maxX: 11, minZ: -27, maxZ: -11 };
/** The cleared, flat ground the village stands on; the forest starts beyond it. */
export const CLEARING = { minX: -24, maxX: 24, minZ: -40, maxZ: 36 };
/** The old road runs south from the gate through the forest. */
export const ROAD = { halfWidth: 3, endZ: 140 };

export const spawn = { x: 0, z: 44, rot: Math.PI };

/** Where the adventurer can walk: the clearing and the first stretch of the old road. */
export const areas: Area[] = [
  { minX: CLEARING.minX + 1.5, maxX: CLEARING.maxX - 1.5, minZ: CLEARING.minZ + 1.5, maxZ: STREET_START + 1 },
  { minX: -3.4, maxX: 3.4, minZ: STREET_START, maxZ: 48 },
];

/** Named places, shown as a banner when the adventurer walks in. */
export const regions: { name: string; area: Area }[] = [
  { name: 'The Old Road', area: { minX: -30, maxX: 30, minZ: STREET_START + 1, maxZ: 200 } },
  { name: 'Market Square', area: { minX: -24, maxX: 24, minZ: -60, maxZ: PLAZA.maxZ } },
  { name: 'High Street', area: { minX: -24, maxX: 24, minZ: PLAZA.maxZ, maxZ: STREET_START + 1 } },
];

// Left-hand houses face the street (+x) with their front gable: rot = π/2 turns +z to +x.
const L = Math.PI / 2;
const R = -Math.PI / 2;

export const houses: HouseSpec[] = [
  // West side, south to north.
  {
    x: -8.2, z: 25, rot: L + 0.04, width: 6, length: 8, storeys: 2, base: 'brick', chimney: true, shutters: true,
    front: [['window', 'door', 'window'], ['narrow', 'window', 'narrow']],
    right: [['wall', 'window', 'wall', 'wall'], ['wall', 'window', 'window', 'wall']],
  },
  {
    x: -7.1, z: 17, rot: L - 0.03, width: 4, length: 6, storeys: 2, base: 'brick',
    front: [['door', 'window'], ['window', 'window']],
  },
  {
    x: -9.3, z: 7, rot: L + 0.02, width: 8, length: 10, storeys: 3, base: 'brick', chimney: true, balcony: true, shutters: true,
    front: [['window', 'door', 'window', 'window'], ['window', 'narrow', 'door', 'window'], ['narrow', 'window', 'window', 'narrow']],
    right: [['wall', 'window', 'wall', 'window', 'wall'], ['wall', 'window', 'wall', 'window', 'wall'], ['wall', 'narrow', 'wall', 'narrow', 'wall']],
    interior: 'The Old Library',
  },
  {
    x: -7.4, z: -3.5, rot: L - 0.05, width: 6, length: 6, storeys: 1, base: 'brick', chimney: true,
    front: [['window', 'door', 'window']],
    right: [['window', 'wall', 'window']],
    interior: "The Herbalist's Cottage",
  },
  // East side, south to north.
  {
    x: 8.1, z: 26, rot: R - 0.03, width: 4, length: 8, storeys: 2, base: 'plaster', shutters: true, chimney: true,
    front: [['window', 'door'], ['narrow', 'window']],
  },
  {
    x: 8.4, z: 17.5, rot: R + 0.04, width: 6, length: 8, storeys: 2, base: 'brick', chimney: true,
    front: [['door', 'window', 'window'], ['window', 'window', 'narrow']],
    left: [['wall', 'window', 'wall', 'wall'], ['wall', 'narrow', 'window', 'wall']],
  },
  {
    // The chimney stands over the forge (interiors.ts), on the slope like every chimney (on the
    // ridge the roof would bury it).
    x: 9.2, z: 7.5, rot: R - 0.02, width: 6, length: 10, storeys: 1, base: 'brick', chimney: [1.35, -4.36], shutters: true,
    front: [['window', 'door', 'window']],
    left: [['wall', 'window', 'wall', 'window', 'wall']],
    interior: 'The Smithy',
  },
  {
    x: 8.3, z: -3, rot: R + 0.03, width: 8, length: 8, storeys: 3, base: 'brick', balcony: true, shutters: true, chimney: true,
    front: [['window', 'window', 'door', 'window'], ['narrow', 'door', 'window', 'narrow'], ['wall', 'window', 'window', 'wall']],
    left: [['wall', 'window', 'window', 'wall'], ['window', 'narrow', 'narrow', 'window'], ['wall', 'narrow', 'narrow', 'wall']],
    interior: 'The Hall of Works',
  },

  // Around the plaza: the north side faces south (rot 0), the west and east sides face in.
  {
    x: -6, z: -32, rot: 0.03, width: 8, length: 8, storeys: 3, base: 'brick', chimney: true, shutters: true, balcony: true,
    front: [['window', 'door', 'window', 'window'], ['window', 'narrow', 'door', 'window'], ['narrow', 'window', 'window', 'narrow']],
    interior: 'The Rusty Tankard',
  },
  {
    x: 3.6, z: -31.5, rot: -0.04, width: 6, length: 8, storeys: 2, base: 'brick', balcony: true, chimney: true,
    front: [['window', 'door', 'window'], ['narrow', 'door', 'narrow']],
  },
  {
    x: -16, z: -19.5, rot: L + 0.02, width: 8, length: 8, storeys: 2, base: 'plaster', shutters: true, chimney: true,
    front: [['window', 'window', 'door', 'window'], ['window', 'narrow', 'narrow', 'window']],
  },
  {
    x: 16.6, z: -18, rot: R - 0.03, width: 6, length: 8, storeys: 2, base: 'brick', chimney: true,
    front: [['window', 'door', 'window'], ['window', 'window', 'window']],
  },
];

/** A second row behind the street, seen over and between the front houses, so the village has depth. */
export const backHouses: HouseSpec[] = [
  { x: -19.5, z: 27, rot: L + 0.3, width: 6, length: 8, storeys: 2, base: 'brick', chimney: true, front: [['window', 'wall', 'window'], ['window', 'window', 'window']] },
  { x: -18.5, z: 14, rot: L - 0.2, width: 6, length: 6, storeys: 1, base: 'brick', chimney: true, front: [['window', 'door', 'window']] },
  { x: -20.5, z: 2, rot: L + 0.15, width: 8, length: 8, storeys: 2, base: 'brick', front: [['window', 'window', 'window', 'window'], ['narrow', 'window', 'window', 'narrow']] },
  { x: 19.5, z: 25, rot: R - 0.25, width: 6, length: 8, storeys: 2, base: 'brick', chimney: true, front: [['window', 'door', 'window'], ['window', 'window', 'window']] },
  { x: 20, z: 12, rot: R + 0.2, width: 4, length: 8, storeys: 2, base: 'plaster', front: [['window', 'window'], ['narrow', 'window']] },
  { x: 20.5, z: -1, rot: R - 0.1, width: 8, length: 8, storeys: 1, base: 'brick', chimney: true, front: [['window', 'window', 'door', 'window']] },
];

/** The stone tower on the north-east corner of the plaza. */
export const tower: TowerSpec = {
  x: 12, z: -30.5, rot: -0.12, storeys: 3,
  front: [['door'], ['narrow'], ['narrow']],
  back: [[], ['narrow'], ['narrow']],
  right: [[], [], ['narrow']],
  left: [[], ['narrow'], ['narrow']],
};

/** The old tree in the square's corner by the tavern. */
export const plazaTree = { x: -7.6, z: -22.6, scale: 1.45 };

/** The vegetable field west of the square, between the houses and the forest. */
export const FIELD = { minX: -21.5, maxX: -14.5, minZ: -13, maxZ: -5 };

/** Props from the house kit: [piece, x, z, rotation]. */
export const props: [string, number, number, number][] = [
  // Parked along the east side of the High Street, in front of the gap past the smithy (its body
  // reaches 3 m north of its shafts).
  ['Prop_Wagon', 3.6, 14.2, 0],
  ['Prop_Wagon', -8.5, -14.5, 1.9],
  // The market's supply wagon on the east side of the square, crates waiting beside it.
  ['Prop_Wagon', 9.3, -18, 0.05],
  ['Prop_Crate', 11.1, -22.1, 0.4],
  ['Prop_Crate', 10.7, -23.3, -0.2],
  ['Prop_Crate', -4.6, 20.6, 0.3],
  ['Prop_Crate', -4.9, 21.8, 1.1],
  ['Prop_Crate', 4.8, 22.2, -0.4],
  ['Prop_Crate', 9.4, -24.2, 0.6],
  ['Prop_Crate', 8.6, -25.4, 0.1],
  ['Prop_Crate', -9.6, -26.4, -0.3],
  ['Prop_WoodenFence_Single', -5.2, 12.4, Math.PI / 2],
  ['Prop_WoodenFence_Extension1', -5.2, 0.9, Math.PI / 2],
  ['Prop_WoodenFence_Single', 5.3, 1.4, Math.PI / 2],
  // Around the field, with a way in at the south-east corner.
  ['Prop_WoodenFence_Single', -20.5, -13.5, 0.02],
  ['Prop_WoodenFence_Extension1', -18.5, -13.5, -0.02],
  ['Prop_WoodenFence_Single', -16.5, -13.5, 0.01],
  ['Prop_WoodenFence_Extension2', -14.5, -13.5, 0],
  ['Prop_WoodenFence_Single', -13.9, -11.5, Math.PI / 2],
  ['Prop_WoodenFence_Extension1', -13.9, -9.5, Math.PI / 2 + 0.03],
  ['Prop_WoodenFence_Single', -13.9, -7.5, Math.PI / 2],
  ['Prop_WoodenFence_Single', -20.5, -4.5, -0.03],
  ['Prop_WoodenFence_Extension2', -18.5, -4.5, 0.02],
  ['Prop_WoodenFence_Single', -16.5, -4.5, 0],
];

type Prop = [string, number, number, number, number];

/**
 * A market stall (or the cart) at x, z facing `rot`, with its goods given in its own frame:
 * [piece, x along the counter, y, z towards the buyers, turn]. The counters are 0.83 m high,
 * 1.78 m long and 0.84 m deep; the seller stands 0.9 m behind the middle.
 */
function stall(piece: string, x: number, z: number, rot: number, goods: [string, number, number, number, number?][]): Prop[] {
  const items: [string, number, number, number, number?][] = [[piece, 0, 0, 0], ...goods];
  return items.map(([name, lx, y, lz, turn = 0]): Prop => [
    name,
    x + Math.cos(rot) * lx + Math.sin(rot) * lz,
    y,
    z - Math.sin(rot) * lx + Math.cos(rot) * lz,
    rot + turn,
  ]);
}

/** The market lane: two stalls on each side of the High Street's line, facing each other. */
const MARKET = { x: 2.4, south: -16.8, north: -21.2 };

/** Props from the Fantasy Props MegaKit outdoors: [piece, x, y, z, rotation]. */
export const outdoorProps: Prop[] = [
  // The market: fruit and vegetables, pots, remedies and odds and ends, and a cart closing the
  // lane at the north end.
  ...stall('Stall_Empty', -MARKET.x, MARKET.south, L, [
    ['FarmCrate_Apple', -0.45, 0.83, 0.02, 0.05],
    ['FarmCrate_Carrot', 0.42, 0.83, 0.08, -0.1],
    ['Barrel_Apples', 1.3, 0, 0.05, 0.4],
    ['FarmCrate_Empty', -1.25, 0, 0.15, 0.3],
  ]),
  ...stall('Stall_Empty', -MARKET.x, MARKET.north, L, [
    ['Vase_4', -0.55, 0.83, 0],
    ['Pot_1', 0.1, 0.83, 0.05, 0.6],
    ['Bottle_1', 0.55, 0.83, -0.12],
    ['Bottle_1', 0.7, 0.83, 0.14],
    ['Vase_2', 1.35, 0, 0.1, 0.3],
    ['Pot_1_Lid', -1.25, 0, 0.2],
  ]),
  ...stall('Stall_Empty', MARKET.x, MARKET.south, R, [
    ['Potion_2', -0.6, 0.83, 0.05],
    ['Potion_1', -0.42, 0.83, -0.1],
    ['Potion_4', -0.2, 0.83, 0.12],
    ['SmallBottles_1', 0.25, 0.83, 0],
    ['Potion_2', 0.55, 0.83, -0.05, 1],
    ['Bag', 1.3, 0, 0.1, 0.5],
  ]),
  ...stall('Stall_Empty', MARKET.x, MARKET.north, R, [
    ['Rope_1', -0.45, 0.83, 0, 0.4],
    ['Pouch_Large', 0.15, 0.83, 0.1, 0.3],
    ['Coin_Pile', 0.45, 0.83, -0.15],
    ['Chain_Coil', -1.45, 0, 0.1],
    ['Bucket_Metal', 1.3, 0, 0.1],
  ]),
  ...stall('Stall_Cart_Empty', 0.9, -25.2, 0, [
    ['FarmCrate_Empty', -0.4, 0.83, 0.05, 0.1],
    ['Bag', 0.4, 0.83, 0, 0.5],
    ['FarmCrate_Carrot', 1.5, 0, 0.55, 0.2],
    ['Rope_2', 2.1, 0, 0.1, 1.2],
  ]),
  // Two benches by the old tree, facing the square; another against the tavern, barrels by its door.
  ['Bench', -5.4, 0, -22.6, L],
  ['Bench', -7.6, 0, -20.4, 0],
  ['Bench', -3.8, 0, -27.45, 0],
  ['Mug', -2.9, 0.53, -27.4, 0.6],
  ['Barrel', -10.6, 0, -25.4, 0],
  ['Barrel', -10.5, 0, -27.3, 0.8],
  // Crates and a bucket by the field.
  ['FarmCrate_Empty', -13.2, 0, -5.4, 1.4],
  ['FarmCrate_Carrot', -13.3, 0, -6.25, 1.5],
  ['Bucket_Wooden_1', -14.6, 0, -4.0, 0.3],
];

/** Colliders for the props above: [x, z, halfX, halfZ, rotation]. */
export const outdoorSolid: [number, number, number, number, number][] = [
  // The stalls, the barrel and the vase beside them, the cart and the crate beside it.
  [-MARKET.x, MARKET.south, 0.5, 0.95, 0],
  [-MARKET.x, MARKET.north, 0.5, 0.95, 0],
  [MARKET.x, MARKET.south, 0.5, 0.95, 0],
  [MARKET.x, MARKET.north, 0.5, 0.95, 0],
  [-MARKET.x + 0.05, MARKET.south - 1.3, 0.36, 0.36, 0],
  [-MARKET.x + 0.1, MARKET.north - 1.35, 0.36, 0.36, 0],
  // The cart reaches 2.11 m along -x from its origin (to the end of its shafts) and 0.91 m along +x.
  [0.3, -25.2, 1.55, 0.55, 0],
  [2.4, -24.65, 0.36, 0.3, 0.2],
  [-5.4, -22.6, 1.4, 0.28, L],
  [-7.6, -20.4, 1.4, 0.28, 0],
  [-3.8, -27.45, 1.4, 0.28, 0],
  [-10.6, -25.4, 0.36, 0.36, 0],
  [-10.5, -27.3, 0.36, 0.36, 0],
  [-13.25, -5.8, 0.4, 0.8, 0],
];

/** Bunting across the High Street, tied to the facades between the floors: [from, to] as [x, y, z]. */
export const bunting: [[number, number, number], [number, number, number]][] = [
  [[-4.15, 3.75, 23.2], [4.33, 3.75, 20.0]],
  // Clear of the library's sign, which hangs beside its door, and of its balcony.
  [[-4.25, 3.75, 4.3], [4.15, 3.75, 6.4]],
];

/** The quest board on the square, facing people coming up the High Street. */
export const questBoard = { x: 4.6, z: -12.4, rot: -0.5 };

/**
 * Signposts: where they stand and which places their arms point to. Each arm points at the
 * place's door (`interior` names) or at a spot ([x, z] with a label).
 */
export const signposts: { x: number; z: number; to: (string | [string, number, number])[] }[] = [
  {
    x: -4.4, z: 30.8,
    to: ['The Hall of Works', 'The Old Library', 'The Smithy', ['Market Square', 0, -19], 'The Rusty Tankard'],
  },
  {
    x: -4.1, z: -10.3,
    to: ['The Rusty Tankard', ['Quest board', 4.6, -12.4], "The Herbalist's Cottage", 'The Hall of Works'],
  },
];

/** The village boundary: a fence across the clearing with the gate on the road. */
export const gate = { z: STREET_START + 1.5, gap: 3.6, reach: 22 };

/**
 * Vines on the plain stretches of some side walls: [piece, house (index in `houses`), facade,
 * offset along it, height of the vine's top hook]. The vines hang down from their origin.
 */
export const vines: [string, number, 'front' | 'back' | 'left' | 'right', number, number][] = [
  ['Prop_Vine2', 0, 'right', 1, 2.7],
  ['Prop_Vine1', 2, 'right', 0, 2.7],
  ['Prop_Vine4', 2, 'right', 4, 1.6],
  ['Prop_Vine2', 6, 'left', -4, 2.7],
  ['Prop_Vine1', 5, 'left', 3, 2.7],
];

/** Lantern posts: [x, z]. */
export const lanterns: [number, number][] = [
  [-5.8, 36.4],
  [5.8, 36.4],
  [3.7, 21],
  [-3.7, 12],
  [3.7, 3],
  [-3.7, -6],
  [6, -16],
  // Away from the old tree, whose leaves look flat lit from below.
  [-11.6, -17.4],
];

/** People in the village. Walkers loop through their points. */
export interface NpcSpec {
  look: Look;
  clip: string;
  /** Where they stand; for a sitting clip, the middle of their seat (see npcs.ts). */
  x: number;
  z: number;
  rot: number;
  /** Who they are, shown when you talk to them. Only people with lines can be talked to. */
  name?: string;
  /** What they say, one line each time you talk to them, in turn. */
  lines?: string[];
  /** Something in their hands. */
  hold?: 'torch' | 'mug' | 'axe' | 'crate' | 'bucket';
  /** Walks these points in a loop instead of standing. */
  path?: [number, number][];
  /** Walking speed in m/s. */
  speed?: number;
  /** A sound on each loop of their clip, at this point of it (0..1): the smith's hammer, an axe. */
  beat?: { sound: 'hammer' | 'chop'; at: number };
}

const muted = 0x9c9488;
const guard = 0x8a8a7e;

export const npcs: NpcSpec[] = [
  // At the gate a watchman with a torch; a guard walks the High Street.
  {
    name: 'The watchman', clip: 'Idle_Torch_Loop', x: 4.4, z: 32.4, rot: 0.2, hold: 'torch',
    look: { outfit: 'Male_Ranger', head: 'Male_Head', extras: ['Hair_Buzzed', 'Hair_Beard', 'Eyebrows_Regular'], tint: guard, hair: 0x2a2018 },
    lines: [
      'Evening, traveller. Jordi\'s games hang in the Hall of Works, up the street on your right.',
      'The library tells Jordi\'s story and the smithy shows the tools. The quest board on the square lists it all.',
      'Keep to the road after dark. The forest has opinions about strangers.',
    ],
  },
  {
    name: 'A guard', clip: 'Walk_Loop', x: -2.6, z: 30, rot: Math.PI, speed: 1.05,
    path: [[-2.6, 30], [-2.6, -9]],
    look: { outfit: 'Male_Ranger', head: 'Male_Head', extras: ['Hair_SimpleParted', 'Eyebrows_Regular'], tint: guard, hair: 0x3a2a1a },
    lines: ['All quiet. As usual. As always.'],
  },
  // Two pairs of neighbours: one by the old tree, one on the High Street.
  {
    name: 'A neighbour', clip: 'Idle_Talking_Loop', x: -10.2, z: -19.6, rot: -2.61,
    look: { outfit: 'Male_Peasant', head: 'Male_Head', extras: ['Hair_SimpleParted', 'Hair_Beard', 'Eyebrows_Regular'], hair: 0x4a3828 },
    lines: ['...and then the goat ate the whole cart of turnips. Oh. Hello there.'],
  },
  {
    name: 'A neighbour', clip: 'Idle_Loop', x: -10.9, z: -20.8, rot: 0.53,
    look: { outfit: 'Female_Peasant', head: 'Female_Head', extras: ['Hair_Buns', 'Eyebrows_Female'], hair: 0x6b3f22, tint: muted },
    lines: ['Don\'t mind him. He tells that goat story to everyone.'],
  },
  {
    name: 'A villager', clip: 'Idle_Talking_Loop', x: 4.0, z: 18.6, rot: -2.45,
    look: { outfit: 'Female_Peasant', head: 'Female_Head', extras: ['Hair_Long', 'Eyebrows_Female'], hair: 0x1e1610, variant: true },
    lines: ['Have you heard? A stranger came up the old road this evening.'],
  },
  {
    name: 'A villager', clip: 'Idle_FoldArms_Loop', x: 3.0, z: 17.4, rot: 0.69,
    look: { outfit: 'Male_Peasant', head: 'Male_Head', extras: ['Hair_Buzzed', 'Eyebrows_Regular'], hair: 0x5a4030, tint: 0xa89a88 },
    lines: ['A stranger? Looks like they\'re standing right behind you.'],
  },
  // Someone fixing the wagon on the High Street.
  {
    name: 'A carter', clip: 'Fixing_Kneeling', x: 2.1, z: 12.4, rot: 1.6,
    look: { outfit: 'Male_Peasant', head: 'Male_Head', extras: ['Hair_Buzzed', 'Eyebrows_Regular'], hair: 0x241a12, variant: true },
    lines: ['This wheel has been broken since spring. Any day now.'],
  },
  // A guard at the tower door.
  {
    name: 'A guard', clip: 'Sword_Idle', x: 10.4, z: -26.6, rot: 0.3,
    look: { outfit: 'Female_Ranger', head: 'Female_Head', extras: ['Eyebrows_Female'], tint: guard, hair: 0x2b2018 },
    lines: ['The watchtower? Nothing to watch but trees. A great many trees.'],
  },
  // A woman walking up and down the street.
  {
    name: 'A baker', clip: 'Walk_Loop', x: 1.6, z: 26, rot: Math.PI,
    // Past the carter and the wagon at z 11-14.
    path: [[1.6, 26], [1.0, 16], [1.0, 10], [1.6, -8], [-2, -13], [-1.8, 4], [-1.8, 26], [0, 29]],
    look: { outfit: 'Female_Peasant', head: 'Female_Head', extras: ['Hair_Long', 'Eyebrows_Female'], hair: 0x3b2618 },
    lines: ['Can\'t stop, the bread won\'t bake itself.'],
  },
  // An old man doing slow rounds of the market.
  {
    name: 'An old man', clip: 'Walk_Formal_Loop', x: 5, z: -14, rot: 0, speed: 0.85,
    path: [[5, -14], [5.6, -23.5], [-4.3, -23.6], [-4.3, -15.5], [0, -12.5]],
    look: { outfit: 'Male_Peasant', head: 'Male_Head', extras: ['Hair_SimpleParted', 'Hair_Beard', 'Eyebrows_Regular'], hair: 0xb8b2a8, variant: true },
    lines: ['Forty years I\'ve walked around this square every evening. Good for the knees.'],
  },
  // The market: a seller behind each stall, a customer in the lane, a porter carrying crates from
  // the supply wagon to the cart.
  {
    name: 'A fruit seller', clip: 'Idle_FoldArms_Loop', x: -MARKET.x - 0.9, z: MARKET.south, rot: L,
    look: { outfit: 'Male_Peasant', head: 'Male_Head', extras: ['Hair_Beard', 'Eyebrows_Regular'], hair: 0x6a4a30, tint: 0xb0a080 },
    lines: ['Apples! Fresh from the orchard. Well, fresh from this week.'],
  },
  {
    name: 'A potter', clip: 'Idle_Loop', x: -MARKET.x - 0.9, z: MARKET.north, rot: L,
    look: { outfit: 'Male_Peasant', head: 'Male_Head', extras: ['Hair_Long', 'Hair_Beard', 'Eyebrows_Regular'], hair: 0x8a6a4a, tint: 0xa89480 },
    lines: ['Every pot here is round. Some of them on purpose.'],
  },
  {
    name: 'An apothecary', clip: 'Idle_Talking_Loop', x: MARKET.x + 0.9, z: MARKET.south, rot: R,
    look: { outfit: 'Female_Peasant', head: 'Female_Head', extras: ['Hair_Long', 'Eyebrows_Female'], hair: 0x7a3a1c, tint: 0x9aa0b0 },
    lines: ['Remedies for every ailment. Results may vary.'],
  },
  {
    name: 'A merchant', clip: 'Idle_Talking_Loop', x: MARKET.x + 0.9, z: MARKET.north, rot: R,
    look: { outfit: 'Female_Ranger', head: 'Female_Head', extras: ['Hair_Long', 'Eyebrows_Female'], hair: 0x5a3020, tint: 0xa08a70 },
    lines: ['Rope, sacks, buckets. Everything a hero needs and nobody remembers to buy.'],
  },
  {
    name: 'A customer', clip: 'Idle_Loop', x: -0.9, z: MARKET.south, rot: R,
    look: { outfit: 'Female_Peasant', head: 'Female_Head', extras: ['Hair_Buns', 'Eyebrows_Female'], hair: 0x2a1d14, variant: true },
    lines: ['I\'m just looking. I\'m always just looking.'],
  },
  {
    name: 'A porter', clip: 'Walk_Carry_Loop', x: 8.2, z: -22.2, rot: -2, hold: 'crate', speed: 1,
    path: [[8.2, -22.2], [3.2, -23.9]],
    look: { outfit: 'Male_Peasant', head: 'Male_Head', extras: ['Hair_Buzzed', 'Hair_Beard', 'Eyebrows_Regular'], hair: 0x3a2818, tint: muted },
    lines: ['Heavy crate, coming through!'],
  },
  // Outside the tavern: one drinking, one resting on the bench under the tree.
  {
    name: 'A drinker', clip: 'Consume', x: -5.4, z: -26.3, rot: 0.5, hold: 'mug',
    look: { outfit: 'Male_Ranger', head: 'Male_Head', extras: ['Hair_Long', 'Hair_Beard', 'Eyebrows_Regular'], hair: 0x241810, tint: 0x9a8a78 },
    lines: ['Too loud in there for me. The ale\'s worth the noise, though.'],
  },
  {
    name: 'An old woman', clip: 'Sitting_Idle_Loop', x: -5.4, z: -22.1, rot: L,
    look: { outfit: 'Female_Peasant', head: 'Female_Head', extras: ['Hair_Buns', 'Eyebrows_Female'], hair: 0xa8a29a, tint: 0x8a8070 },
    lines: ['Sit a while. That tree has been here longer than any of us.'],
  },
  // The field: three people working the rows.
  {
    name: 'A farmer', clip: 'Farm_Harvest', x: -18.9, z: -9, rot: 0.5,
    look: { outfit: 'Male_Peasant', head: 'Male_Head', extras: ['Hair_SimpleParted', 'Eyebrows_Regular'], hair: 0x4a3020, variant: true },
    lines: ['Good soil this side of the forest. Stubborn, but good.'],
  },
  {
    name: 'A farmer', clip: 'Farm_Watering', x: -16.1, z: -7, rot: -1.2, hold: 'bucket',
    look: { outfit: 'Female_Peasant', head: 'Female_Head', extras: ['Hair_Buns', 'Eyebrows_Female'], hair: 0x3a2618, tint: 0xb0a088 },
    lines: ['The well is a long walk. These carrots had better be grateful.'],
  },
  {
    name: 'A farmer', clip: 'Farm_PlantSeed', x: -20.3, z: -11.5, rot: 2.8,
    look: { outfit: 'Male_Peasant', head: 'Male_Head', extras: ['Hair_Buzzed', 'Hair_Beard', 'Eyebrows_Regular'], hair: 0x8a7a68 },
    lines: ['Every seed is a promise. Some of them lie.'],
  },
  // A woodcutter at the edge of the trees, east of the street, placed so the axe meets the
  // trunk's bark (the trunk is 0.4 m off the tree's origin at chest height).
  {
    name: 'A woodcutter', clip: 'TreeChopping_Loop', x: 15.82, z: -9.01, rot: -Math.PI / 2, hold: 'axe', beat: { sound: 'chop', at: 0.19 },
    look: { outfit: 'Male_Ranger', head: 'Male_Head', extras: ['Hair_Buzzed', 'Hair_Beard', 'Eyebrows_Regular'], hair: 0x5a2a18, variant: true },
    lines: ['Stand back, unless you want to be firewood.'],
  },
];
