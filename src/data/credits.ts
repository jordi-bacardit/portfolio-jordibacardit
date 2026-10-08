// Third-party assets used by the 3D village (/play), shown in its Credits panel.
// Every pack's licence was checked before use (CC0 needs no credit, but they get one anyway).

export interface Credit {
  name: string;
  author: string;
  licence: string;
  /** What the village uses from it. */
  used: string;
  url: string;
}

export const playCredits: Credit[] = [
  {
    name: 'Medieval Village MegaKit',
    author: 'Quaternius',
    licence: 'CC0 1.0',
    used: 'The houses, the tower, the paving, the props',
    url: 'https://quaternius.com/packs/medievalvillagemegakit.html',
  },
  {
    name: 'Fantasy Props MegaKit',
    author: 'Quaternius',
    licence: 'CC0 1.0',
    used: 'The furniture indoors, the market stalls, the barrels, mugs and tools',
    url: 'https://quaternius.com/packs/fantasypropsmegakit.html',
  },
  {
    name: 'Stylized Nature MegaKit',
    author: 'Quaternius',
    licence: 'CC0 1.0',
    used: 'The forest, the old tree, the bushes, crops and rocks',
    url: 'https://quaternius.com/packs/stylizednaturemegakit.html',
  },
  {
    name: 'Modular Character Outfits - Fantasy and Universal Base Characters',
    author: 'Quaternius',
    licence: 'CC0 1.0',
    used: 'The adventurer and the villagers',
    url: 'https://quaternius.com/packs/modularcharacteroutfitsfantasy.html',
  },
  {
    name: 'Universal Animation Library and Universal Animation Library 2',
    author: 'Quaternius',
    licence: 'CC0 1.0',
    used: 'Every animation',
    url: 'https://quaternius.com/packs/universalanimationlibrary.html',
  },
  {
    name: 'Brown Mud Leaves 01 and Aerial Grass Rock',
    author: 'Rob Tuytel, Poly Haven',
    licence: 'CC0 1.0',
    used: 'The ground textures',
    url: 'https://polyhaven.com/textures',
  },
  {
    name: "Medieval: The Bard's Tale and Medieval: The Old Tower Inn",
    author: 'RandomMind, OpenGameArt',
    licence: 'CC0 1.0',
    used: 'The music outdoors and in the tavern',
    url: 'https://opengameart.org/content/medieval-the-bards-tale',
  },
  {
    name: 'RPG Audio and Impact Sounds',
    author: 'Kenney',
    licence: 'CC0 1.0',
    used: 'Footsteps, pages turning, the axe',
    url: 'https://kenney.nl/assets/rpg-audio',
  },
  {
    name: 'Crickets Ambient Noise, Fireplace Sound Loop, Wind Woosh Loop, Crowd Shouting/Speaking Ambience',
    author: 'Wolfgang_, PagDev, SketchMan3 and StarNinjas, OpenGameArt',
    licence: 'CC0 1.0',
    used: 'The night, the fires, the wind and the crowd in the tavern',
    url: 'https://opengameart.org/content/crickets-ambient-noise-loopable',
  },
  {
    name: "Blacksmith's Hammer, Dog Barking and Bird, Cricket, Frog and Mosquito Sounds",
    author: 'VishwaJai, HaelDB and Aj_, OpenGameArt',
    licence: 'CC0 1.0',
    used: "The smith's hammer, a dog and a night bird",
    url: 'https://opengameart.org/content/blacksmiths-hammer',
  },
  {
    name: 'three.js',
    author: 'three.js authors',
    licence: 'MIT',
    used: 'The 3D engine',
    url: 'https://threejs.org',
  },
];
