// The land around the village: the terrain (a flat clearing in a valley of wooded hills, with the
// old road running south) and everything that grows on it: trees, bushes and rocks from the
// Stylized Nature MegaKit (CC0), and tufts of grass drawn here. Placement is random but seeded, so
// the forest is the same on every visit.
import * as THREE from 'three';
import { resolveInside, type Box } from './collisions';
import { Kit, at } from './kit';
import { CLEARING, FIELD, PLAZA, ROAD, STREET_START, plazaTree } from './layout';

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Cheap smooth noise from a few sines, roughly -1..1. */
const wave = (x: number, z: number) =>
  (Math.sin(x * 0.11 + Math.cos(z * 0.07)) + Math.sin(z * 0.09 - x * 0.05) + 0.5 * Math.sin((x + z) * 0.23)) / 2.5;

/** How far a point is from the flat ground people use (the clearing and the road). */
export function distanceFromClearing(x: number, z: number) {
  const dx = Math.max(CLEARING.minX - x, 0, x - CLEARING.maxX);
  const dz = Math.max(CLEARING.minZ - z, 0, z - CLEARING.maxZ);
  let d = Math.hypot(dx, dz);
  if (z > CLEARING.maxZ - 4 && z < ROAD.endZ) d = Math.min(d, Math.max(Math.abs(x) - ROAD.halfWidth - 2, 0));
  return d;
}

/** Ground height: flat where people live, wooded hills rising around the valley. */
export function heightAt(x: number, z: number) {
  const d = distanceFromClearing(x, z);
  return smoothstep(2, 48, d) * (16 + 8 * wave(x, z)) + smoothstep(1, 12, d) * 0.7 * wave(x * 3, z * 3);
}

/** 0 on beaten earth (street, square, road, the field), 1 on grass. */
export function grassAt(x: number, z: number) {
  const street = Math.abs(x) < 5.5 && z > PLAZA.maxZ - 1 && z < STREET_START + 2 ? 1 : 0;
  const square = x > PLAZA.minX - 1.5 && x < PLAZA.maxX + 1.5 && z > PLAZA.minZ - 1.5 && z < PLAZA.maxZ + 1 ? 1 : 0;
  const road = z > STREET_START - 2 ? 1 - smoothstep(ROAD.halfWidth, ROAD.halfWidth + 2.5, Math.abs(x)) : 0;
  const field = x > FIELD.minX - 0.5 && x < FIELD.maxX + 0.5 && z > FIELD.minZ - 0.5 && z < FIELD.maxZ + 0.5 ? 0.9 : 0;
  const earth = Math.max(street, square, road, field);
  const patches = 0.25 * Math.max(0, wave(x * 4, z * 4));
  return Math.min(1, Math.max(0, 1 - earth + patches));
}

/** A small seeded random generator (mulberry32). */
function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shared wind clock for every swaying material. */
export const wind = { value: 0 };

/** Makes a material sway with the wind: stronger higher up the model. */
export function addWind(material: THREE.Material, strength: number) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = wind;
    shader.uniforms.uWindStrength = { value: strength };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWindTime;\nuniform float uWindStrength;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec4 windWorld = modelMatrix * instanceMatrix * vec4( transformed, 1.0 );
        #else
          vec4 windWorld = modelMatrix * vec4( transformed, 1.0 );
        #endif
        float windHeight = max( transformed.y, 0.0 );
        transformed.x += sin( uWindTime * 1.3 + windWorld.x * 0.35 + windWorld.z * 0.2 ) * uWindStrength * windHeight;
        transformed.z += cos( uWindTime * 1.05 + windWorld.z * 0.3 + windWorld.x * 0.1 ) * uWindStrength * 0.6 * windHeight;`,
      );
  };
  material.customProgramCacheKey = () => `wind-${strength}`;
}

export interface Nature {
  colliders: Box[];
}

/** Ground cover for the road's verges and around the village, at the scale that makes each the right size. */
const coverScale: Record<string, number> = {
  Fern_1: 0.45,
  Bush_Common: 0.55,
  Bush_Common_Flowers: 0.5,
  Grass_Wispy_Tall: 0.45,
  Grass_Common_Tall: 0.4,
  Flower_3_Group: 0.35,
  Flower_4_Group: 0.3,
  Clover_1: 0.35,
  Plant_7: 0.8,
  Rock_Medium_2: 0.3,
};
const verge = ['Fern_1', 'Bush_Common', 'Grass_Wispy_Tall', 'Grass_Wispy_Tall', 'Grass_Common_Tall', 'Flower_3_Group', 'Clover_1', 'Plant_7', 'Rock_Medium_2'];
const meadow = ['Bush_Common', 'Bush_Common_Flowers', 'Flower_3_Group', 'Flower_4_Group', 'Grass_Wispy_Tall', 'Grass_Common_Tall', 'Clover_1', 'Fern_1'];

/** The trees (the pieces worth splitting by cells: they hold most of the triangles). */
const isTree = (name: string) => /Tree|Pine/.test(name);

/**
 * A tuft of grass: a few thin tapering blades fanned out and leaning, dark at the root and
 * lighter at the tip. Normals point up so every blade catches the same light.
 */
function tuftGeometry(rand: () => number) {
  const positions: number[] = [];
  const colors: number[] = [];
  const root = new THREE.Color(0x26331a);
  const tip = new THREE.Color(0xa8b070);
  const blades = 14;
  for (let i = 0; i < blades; i++) {
    const angle = (i / blades) * Math.PI * 2 + rand() * 0.8;
    const height = 0.16 + rand() * 0.22;
    const width = 0.012 + rand() * 0.01;
    const lean = 0.05 + rand() * 0.12;
    const spread = 0.03 + rand() * 0.09;
    const ox = Math.cos(angle) * spread;
    const oz = Math.sin(angle) * spread;
    // The blade's flat side faces sideways to its lean.
    const sx = -Math.sin(angle) * width;
    const sz = Math.cos(angle) * width;
    const tx = ox + Math.cos(angle) * lean;
    const tz = oz + Math.sin(angle) * lean;
    positions.push(ox - sx, 0, oz - sz, ox + sx, 0, oz + sz, tx, height, tz);
    colors.push(root.r, root.g, root.b, root.r, root.g, root.b, tip.r, tip.g, tip.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(positions.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  return geometry;
}

/** Grass over the grassy ground of an area, as one instanced mesh that sways in the wind. */
function grass(
  rand: () => number,
  blocked: (x: number, z: number, margin: number) => boolean,
  area: { minX: number; maxX: number; minZ: number; maxZ: number },
  count: number,
) {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 });
  addWind(material, 0.22);
  const mesh = new THREE.InstancedMesh(tuftGeometry(rand), material, count);
  const matrix = new THREE.Matrix4();
  const colour = new THREE.Color();
  let planted = 0;
  for (let tries = 0; tries < count * 4 && planted < count; tries++) {
    const x = area.minX + rand() * (area.maxX - area.minX);
    const z = area.minZ + rand() * (area.maxZ - area.minZ);
    const cover = grassAt(x, z);
    if (cover < 0.6 || rand() > cover || blocked(x, z, 0.3)) continue;
    const scale = 0.7 + rand() * 0.6;
    matrix.copy(at(x, heightAt(x, z) - 0.03, z, rand() * Math.PI * 2, scale));
    mesh.setMatrixAt(planted, matrix);
    // Some tufts greener, some drier.
    mesh.setColorAt(planted, colour.setHSL(0.16 + rand() * 0.09, 0.3 + rand() * 0.25, 0.55 + rand() * 0.25));
    planted++;
  }
  mesh.count = planted;
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  return mesh;
}

/**
 * Plants the forest and the ground cover. `nearKit` is built with shadows (the trees around the
 * village), `farKit` without (the forest further out, mostly seen through the fog).
 */
export function plantNature(scene: THREE.Scene, nearKit: Kit, farKit: Kit, buildings: Box[]): Nature {
  const colliders: Box[] = [];
  const rand = random(7);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  // Is (x, z) inside a building or too close to one?
  const blocked = (x: number, z: number, margin: number) =>
    buildings.some((box) => resolveInside(x, z, box, margin));

  // The forest: a jittered grid around the clearing, denser further in.
  // Far trees use the lightest models: the fog hides their detail anyway.
  const cell = 8;
  for (let gx = -96; gx <= 96; gx += cell) {
    for (let gz = -104; gz <= 128; gz += cell) {
      const x = gx + (rand() - 0.5) * cell * 0.9;
      const z = gz + (rand() - 0.5) * cell * 0.9;
      const d = distanceFromClearing(x, z);
      if (d < 2.5 || Math.hypot(x, z - 10) > 92) continue;
      const near = d < 16 && Math.hypot(x, z) < 70;
      if (rand() > (near ? 0.65 : 0.7)) continue;
      const roll = rand();
      const model =
        roll < (near ? 0.05 : 0.02)
          ? 'DeadTree_3'
          : roll < 0.64
            ? pick(near ? ['Pine_1', 'Pine_2', 'Pine_3', 'Pine_4'] : ['Pine_5', 'Pine_5', 'Pine_4'])
            : pick(near ? ['CommonTree_2', 'CommonTree_3', 'CommonTree_4'] : ['CommonTree_5']);
      const scale = 0.95 + rand() * 0.6;
      // Only the trees at the clearing's edge cast shadows into the village.
      (d < 6 ? nearKit : farKit).place(model, at(x, heightAt(x, z) - 0.25, z, rand() * Math.PI * 2, scale));

      // The forest floor at the edge: ferns, bushes, rocks, mushrooms.
      if (d < 24 && rand() < 0.75) {
        const fx = x + (rand() - 0.5) * 5;
        const fz = z + (rand() - 0.5) * 5;
        const cover = pick(['Fern_1', 'Fern_1', 'Bush_Common_Flowers', 'Plant_1_Big', 'Rock_Medium_2', 'Mushroom_Common', 'Plant_7_Big']);
        const size = cover === 'Plant_1_Big' || cover === 'Bush_Common_Flowers' ? 0.5 : cover === 'Rock_Medium_2' ? 0.6 : 0.8;
        farKit.place(cover, at(fx, heightAt(fx, fz) - 0.05, fz, rand() * Math.PI * 2, size * (0.8 + rand() * 0.5)));
      }
    }
  }

  // Trees inside the clearing: between and behind the houses, never on a path.
  const villageTrees: [string, number, number, number][] = [
    ['CommonTree_2', -14.5, 33, 1.1],
    ['Pine_3', 15, 31.5, 1.0],
    ['CommonTree_4', -13.8, 20.5, 0.9],
    ['CommonTree_3', 14.6, 21.8, 1.0],
    ['Pine_1', -22.6, -16.5, 1.1],
    ['CommonTree_2', 14.4, -9.4, 0.95],
    ['Pine_4', -21.5, -31, 1.2],
    ['CommonTree_3', 21, -28.5, 1.0],
    ['Pine_2', -22.5, 20, 1.1],
    ['CommonTree_4', 22.5, 4.5, 1.0],
  ];
  for (const [model, x, z, scale] of villageTrees) {
    nearKit.place(model, at(x, -0.2, z, x * 7, scale));
    colliders.push({ x, z, halfX: 0.5, halfZ: 0.5, rot: 0 });
  }

  // The old tree in the square, with stones around its roots.
  nearKit.place('CommonTree_1', at(plazaTree.x, -0.15, plazaTree.z, 0.6, plazaTree.scale));
  colliders.push({ x: plazaTree.x, z: plazaTree.z, halfX: 0.7, halfZ: 0.7, rot: 0.6 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rand() * 0.3;
    const r = 2.1 + rand() * 0.3;
    nearKit.place(pick(['Pebble_Round_1', 'Pebble_Round_3', 'Pebble_Square_2']), at(plazaTree.x + Math.cos(a) * r, 0.02, plazaTree.z + Math.sin(a) * r, rand() * 6, 1.8));
  }

  // The field: rows of low leafy vegetables and taller beans.
  for (let row = 0; row < 5; row++) {
    const x = FIELD.minX + 0.5 + row * 1.4;
    for (let z = FIELD.minZ + 0.5; z < FIELD.maxZ; z += 0.9) {
      const beans = row % 2 === 1;
      nearKit.place(beans ? 'Plant_1_Big' : 'Plant_7_Big', at(x + (rand() - 0.5) * 0.15, 0, z, rand() * 6, beans ? 0.3 + rand() * 0.08 : 0.55 + rand() * 0.15));
    }
  }

  // Bushes, ferns and stones against the houses.
  let planted = 0;
  for (let tries = 0; tries < 1400 && planted < 150; tries++) {
    const x = CLEARING.minX + rand() * (CLEARING.maxX - CLEARING.minX);
    const z = CLEARING.minZ + rand() * (CLEARING.maxZ - CLEARING.minZ);
    // Close to a wall but not inside: against the houses.
    if (grassAt(x, z) < 0.6 || blocked(x, z, 0.2) || !blocked(x, z, 1.4)) continue;
    const model = pick(['Bush_Common_Flowers', 'Bush_Common_Flowers', 'Plant_7_Big', 'Fern_1', 'Plant_1_Big', 'Pebble_Round_3']);
    const size = model === 'Plant_1_Big' ? 0.35 : model === 'Fern_1' ? 0.45 : model === 'Pebble_Round_3' ? 1.6 : 0.5;
    farKit.place(model, at(x, 0, z, rand() * 6, size * (0.8 + rand() * 0.4)));
    planted++;
  }

  // What follows has its own seed, so adding to it never moves what's above.
  const extra = random(11);
  const pickExtra = <T,>(list: T[]) => list[Math.floor(extra() * list.length)];
  const plant = (name: string, x: number, z: number) =>
    farKit.place(name, at(x, heightAt(x, z) - 0.04, z, extra() * Math.PI * 2, coverScale[name] * (0.8 + extra() * 0.4)));

  // The old road: a denser wood on both sides and ferns, bushes, flowers and tall grass along its
  // verges, so that looking back from the gate you see a road going into the forest.
  // Further down, where the forest thins out, two rows close the view of the valley.
  for (let z = CLEARING.maxZ + 3; z < 132; z += 4) {
    for (const side of [-1, 1]) {
      const rows = z < 95 ? 1 : 2;
      for (let row = 0; row < rows; row++) {
        if (extra() > 0.85) continue;
        const x = side * (ROAD.halfWidth + 5 + row * 9 + extra() * 9);
        const tz = z + (extra() - 0.5) * 3;
        const model = pickExtra(z < 60 ? ['Pine_1', 'Pine_2', 'Pine_3', 'CommonTree_3', 'CommonTree_4'] : ['Pine_4', 'Pine_5', 'CommonTree_5']);
        (distanceFromClearing(x, tz) < 6 ? nearKit : farKit).place(model, at(x, heightAt(x, tz) - 0.25, tz, extra() * Math.PI * 2, 0.9 + extra() * 0.5));
      }
      if (z < 100) {
        for (let i = 0; i < 3; i++) plant(pickExtra(verge), side * (ROAD.halfWidth + 0.8 + extra() * 4.5), z + (extra() - 0.5) * 4);
      }
    }
  }

  // Around the village: clumps of bushes, flowers and tall grass on the open grass between the
  // houses and the forest, and on both sides of the gate.
  const clumps: [number, number][] = [[-7.5, 36.5], [7.5, 36.5], [-8, 32.5], [8.5, 32]];
  for (let tries = 0; tries < 2000 && clumps.length < 48; tries++) {
    const x = CLEARING.minX + 1 + extra() * (CLEARING.maxX - CLEARING.minX - 2);
    const z = CLEARING.minZ + 1 + extra() * (CLEARING.maxZ - CLEARING.minZ - 2);
    const outskirts = Math.abs(x) > 12 || z < -33 || z > 29;
    if (outskirts && grassAt(x, z) > 0.8 && !blocked(x, z, 1.2)) clumps.push([x, z]);
  }
  for (const [cx, cz] of clumps) {
    const count = 3 + Math.floor(extra() * 3);
    for (let i = 0; i < count; i++) {
      const x = cx + (extra() - 0.5) * 3;
      const z = cz + (extra() - 0.5) * 3;
      if (!blocked(x, z, 0.4)) plant(pickExtra(meadow), x, z);
    }
  }

  // The trees are built by 64 m cells, so the ones out of view (and out of the shadow box) aren't
  // drawn; everything else in one go.
  const near = new THREE.Group();
  const far = new THREE.Group();
  nearKit.build(near, { castShadow: true, receiveShadow: true, cell: 64, only: isTree });
  nearKit.build(near, { castShadow: true, receiveShadow: true });
  farKit.build(far, { castShadow: false, receiveShadow: true, cell: 64, only: isTree });
  farKit.build(far, { castShadow: false, receiveShadow: true });
  const clearingGrass = { minX: CLEARING.minX - 4, maxX: CLEARING.maxX + 4, minZ: CLEARING.minZ - 4, maxZ: CLEARING.maxZ + 10 };
  // Grass down the old road too, as far as the fog lets you see.
  const roadGrass = { minX: -22, maxX: 22, minZ: CLEARING.maxZ + 10, maxZ: 95 };
  scene.add(near, far, grass(rand, blocked, clearingGrass, 12000), grass(extra, blocked, roadGrass, 4500));
  return { colliders };
}
