// Colours of the 3D village: the world's own palette (a late dusk: warm sun low on the horizon,
// violet sky, firelight in the windows). The site's UI colours stay in src/styles/tokens.css.

export const palette = {
  /** Sky straight up. */
  zenith: 0x1a2140,
  /** Sky at the horizon away from the sun; also the fog, so the forest melts into it. */
  horizon: 0x5c5470,
  /** Sky at the horizon behind the sun. */
  sunset: 0xf09a5a,
  sun: 0xffb26b,
  stars: 0xdfe6ff,
  hemiSky: 0x8a90c0,
  hemiGround: 0x2a1d14,
  fire: 0xffa04a,
  /** Light behind lit windows. */
  window: 0xff9440,
  wood: 0x2e2118,
  iron: 0x26262a,
  firefly: 0xd8ff8a,
  smoke: 0x8c8a92,
  /** The rising moon and the low mist. */
  moon: 0xe8e4d8,
  mist: 0x8f88a6,
  /** Cloth bunting over the street: madder red, ochre, woad blue, undyed. */
  bunting: [0x8a2f22, 0xb8862f, 0x3f5a6e, 0xd9cdb0],
  /** Signs, boards and frames: weathered wood, cream paint, parchment and ink. */
  signWood: '#4a3424',
  signGrain: '#3a281b',
  signPaint: '#eadcbf',
  frameWood: 0x3b2a1d,
  parchment: '#d8c49c',
  parchmentEdge: '#a88c5c',
  ink: '#2a1f16',
};

/**
 * Colour grading for the asset packs: multiplies each material's colour so the bright, toy-like
 * textures read as an old, weathered village at dusk.
 */
export const grading: Record<string, number> = {
  // Medieval Village MegaKit
  MI_RoundTiles: 0x645250,
  MI_Plaster: 0xc4b59c,
  MI_WoodTrim: 0x7f6a5a,
  MI_WoodTrim_Wear: 0x7f6a5a,
  MI_UnevenBrick: 0xa69d93,
  MI_Brick: 0xa69d93,
  MI_RockTrim: 0xa39a90,
  MI_RedBrick: 0x9a8a80,
  MI_MetalOrnaments: 0x8a8a8a,
  MI_Vine: 0x6f7d55,
  // Stylized Nature MegaKit
  Leaves_Pine: 0x6c7f5c,
  Leaves_NormalTree: 0x7d8a58,
  Leaves_TwistedTree: 0xd0a878,
  Leaves: 0x75835a,
  Grass: 0x707c50,
  Bark_NormalTree: 0x8a7f74,
  Bark_TwistedTree: 0x8a7f74,
  Bark_DeadTree: 0x8a7f74,
  Rocks: 0x9a9690,
  PathRocks: 0x9a9690,
  Flowers: 0xb0a090,
};

/** A colour token from tokens.css (e.g. "--color-accent"), or the fallback if it isn't set. */
export function cssColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}
