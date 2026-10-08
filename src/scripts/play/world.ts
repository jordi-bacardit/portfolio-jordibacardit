// Builds the village at dusk: a sky with the sun going down behind the hills, warm low light with
// long shadows, fog that swallows the forest, the paved street and square, the houses and tower
// (some furnished inside), the gate, the market, lanterns, chimney smoke and fireflies. Returns the
// colliders, the camera occluders, the rooms, the people indoors and a per-frame update.
import * as THREE from 'three';
import type { Box } from './collisions';
import { chimneySmoke, effectsTime, fireflies, flames, mist, sparks } from './effects';
import { buildHouse, buildTower, onFacade, type Built, type Room } from './house';
import { furnish } from './interiors';
import { Kit, at } from './kit';
import {
  CLEARING,
  FIELD,
  PLAZA,
  bunting,
  STREET_HALF,
  STREET_START,
  backHouses,
  gate,
  houses,
  lanterns,
  outdoorProps,
  outdoorSolid,
  plazaTree,
  props,
  tower,
  vines,
  type NpcSpec,
} from './layout';
import { flicker, type LightPool } from './lights';
import { distanceFromClearing, grassAt, heightAt, plantNature, wind } from './nature';
import { palette } from './palette';

export interface GroundTextures {
  mud: THREE.Texture;
  mudNormal: THREE.Texture;
  grass: THREE.Texture;
}

export interface World {
  colliders: Box[];
  /** World boxes of what can hide the adventurer from the camera. */
  occluders: THREE.Box3[];
  /** The rooms you can walk into. */
  rooms: Room[];
  /** The people indoors (with their room). */
  people: (NpcSpec & { room: Room })[];
  /** Open fires, for the sound. */
  fires: { position: THREE.Vector3; room: Room }[];
  update(dt: number, time: number, focus: THREE.Vector3, room: Room | null): void;
}

/** Where the sun sits: low in the west-south-west, so its light rakes along the street. */
const SUN_DIRECTION = new THREE.Vector3(-0.78, 0.2, 0.42).normalize();
/** The moon, rising in the east above the forest. */
const MOON_DIRECTION = new THREE.Vector3(0.62, 0.42, -0.66).normalize();

function buildGround(textures: GroundTextures) {
  const geometry = new THREE.PlaneGeometry(320, 340, 200, 210).rotateX(-Math.PI / 2);
  geometry.translate(0, 0, 20);
  const position = geometry.attributes.position;
  const blend = new Float32Array(position.count);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    position.setY(i, heightAt(x, z));
    blend[i] = grassAt(x, z);
  }
  geometry.setAttribute('blend', new THREE.BufferAttribute(blend, 1));
  geometry.computeVertexNormals();

  for (const texture of [textures.mud, textures.mudNormal, textures.grass]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(80, 85);
    texture.anisotropy = 8;
  }
  const material = new THREE.MeshStandardMaterial({
    map: textures.mud,
    normalMap: textures.mudNormal,
    normalScale: new THREE.Vector2(0.9, 0.9),
    roughness: 1,
    color: 0xb0a090,
  });
  // Mixes the grass texture in by the per-vertex "blend" weight.
  material.onBeforeCompile = (shader) => {
    shader.uniforms.grassMap = { value: textures.grass };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float blend;\nvarying float vBlend;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBlend = blend;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D grassMap;\nvarying float vBlend;')
      .replace(
        '#include <map_fragment>',
        `vec4 mudColor = texture2D( map, vMapUv );
        vec4 grassColor = texture2D( grassMap, vMapUv * 0.7 ) * vec4( 0.62, 0.68, 0.48, 1.0 );
        diffuseColor *= mix( mudColor, grassColor, vBlend );`,
      );
  };
  const ground = new THREE.Mesh(geometry, material);
  ground.receiveShadow = true;
  return ground;
}

/** A dusk sky: deep blue overhead, violet at the horizon, burning orange behind the sun, faint stars. */
function buildSky() {
  const sky = new THREE.Group();
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(600, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        zenith: { value: new THREE.Color(palette.zenith) },
        horizon: { value: new THREE.Color(palette.horizon) },
        sunset: { value: new THREE.Color(palette.sunset) },
        sunDirection: { value: SUN_DIRECTION },
        moonDirection: { value: MOON_DIRECTION },
        moonColor: { value: new THREE.Color(palette.moon) },
      },
      vertexShader: [
        'varying vec3 vDir;',
        'void main() {',
        '  vDir = normalize(position);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 zenith;',
        'uniform vec3 horizon;',
        'uniform vec3 sunset;',
        'uniform vec3 sunDirection;',
        'uniform vec3 moonDirection;',
        'uniform vec3 moonColor;',
        'varying vec3 vDir;',
        'void main() {',
        '  vec3 dir = normalize(vDir);',
        '  float toSun = max(dot(normalize(dir.xz), normalize(sunDirection.xz)), 0.0);',
        '  float low = 1.0 - smoothstep(0.0, 0.45, dir.y);',
        '  vec3 rim = mix(horizon, sunset, pow(toSun, 3.0) * low);',
        '  vec3 color = mix(rim, zenith, smoothstep(0.02, 0.6, dir.y));',
        '  float sun = max(dot(dir, sunDirection), 0.0);',
        '  color += vec3(1.0, 0.62, 0.32) * (pow(sun, 900.0) * 6.0 + pow(sun, 24.0) * 0.45);',
        // The moon: a pale disc, a little darker towards its rim and in two soft patches, in a halo.
        '  float moon = dot(dir, moonDirection);',
        '  float disc = smoothstep(0.99955, 0.99968, moon);',
        '  vec3 side = normalize(cross(moonDirection, vec3(0.0, 1.0, 0.0)));',
        '  vec3 up = cross(side, moonDirection);',
        '  vec2 m = vec2(dot(dir, side), dot(dir, up)) / 0.03;',
        '  float maria = 1.0 - 0.18 * smoothstep(0.35, 0.0, length(m - vec2(0.25, 0.2))) - 0.12 * smoothstep(0.3, 0.0, length(m + vec2(0.3, 0.15)));',
        '  float limb = 1.0 - 0.25 * smoothstep(0.6, 1.0, length(m));',
        '  color = mix(color, moonColor * 0.95 * maria * limb, disc);',
        '  color += moonColor * pow(max(moon, 0.0), 900.0) * 0.12;',
        '  color = mix(color, horizon, 1.0 - smoothstep(-0.12, 0.04, dir.y));',
        '  gl_FragColor = vec4(color, 1.0);',
        '  #include <colorspace_fragment>',
        '}',
      ].join('\n'),
    }),
  );
  sky.add(dome);

  // Stars, only high up and away from the sunset.
  const count = 900;
  const stars = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const y = 0.35 + Math.pow(Math.random(), 0.6) * 0.65;
    const r = Math.sqrt(1 - y * y);
    stars.set([Math.cos(theta) * r * 550, y * 550, Math.sin(theta) * r * 550], i * 3);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(stars, 3));
  sky.add(
    new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({ color: palette.stars, size: 1.4, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.55 }),
    ),
  );
  return sky;
}

/** A soft round glow drawn on a canvas (no image file). */
function glowTexture(rgb: string) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, `rgba(${rgb}, 1)`);
    gradient.addColorStop(0.18, `rgba(${rgb}, 0.8)`);
    gradient.addColorStop(0.45, `rgba(${rgb}, 0.18)`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * A string of cloth pennants between two points: the cord sags in the middle, the pennants hang
 * from it in a repeating run of colours and sway in the wind (more at their tips).
 */
function buntingString(from: THREE.Vector3, to: THREE.Vector3) {
  const group = new THREE.Group();
  const length = from.distanceTo(to);
  const sag = 0.08 * length;
  const along = (t: number) => from.clone().lerp(to, t).setY(THREE.MathUtils.lerp(from.y, to.y, t) - sag * 4 * t * (1 - t));
  const cord = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 25 }, (_, i) => along(i / 24))),
    new THREE.LineBasicMaterial({ color: 0x1e1712 }),
  );
  const positions: number[] = [];
  const colors: number[] = [];
  const sway: number[] = [];
  const colour = new THREE.Color();
  const count = Math.floor(length / 0.45);
  for (let i = 1; i < count; i++) {
    const a = along((i - 0.3) / count);
    const b = along((i + 0.3) / count);
    const tip = along(i / count).setY(along(i / count).y - 0.36);
    positions.push(...a.toArray(), ...b.toArray(), ...tip.toArray());
    colour.set(palette.bunting[i % palette.bunting.length]);
    for (let k = 0; k < 3; k++) colors.push(colour.r, colour.g, colour.b);
    sway.push(0, 0, 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('sway', new THREE.Float32BufferAttribute(sway, 1));
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.95 });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = wind;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float sway;\nuniform float uWindTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        transformed.x += sin(uWindTime * 2.1 + position.z * 0.8) * 0.06 * sway;
        transformed.z += cos(uWindTime * 1.7 + position.x * 0.9) * 0.08 * sway;`,
      );
  };
  material.customProgramCacheKey = () => 'bunting';
  const flags = new THREE.Mesh(geometry, material);
  flags.castShadow = true;
  group.add(cord, flags);
  return group;
}

/** A lantern post: a dark post, an arm, an open iron lantern around a bright flame, and a glow. */
function lanternPost(glowMaterial: THREE.SpriteMaterial, parts: Record<string, THREE.BufferGeometry>, materials: Record<string, THREE.Material>) {
  const post = new THREE.Group();
  const pole = new THREE.Mesh(parts.post, materials.wood);
  pole.position.y = 1.7;
  pole.castShadow = true;
  const arm = new THREE.Mesh(parts.arm, materials.wood);
  arm.position.set(0, 3.3, 0.36);
  const lantern = new THREE.Group();
  lantern.position.set(0, 2.98, 0.66);
  const cap = new THREE.Mesh(parts.cap, materials.iron);
  cap.position.y = 0.26;
  const base = new THREE.Mesh(parts.plate, materials.iron);
  base.position.y = -0.19;
  lantern.add(cap, base, new THREE.Mesh(parts.core, materials.flame));
  for (const [bx, bz] of [[0.13, 0.13], [-0.13, 0.13], [0.13, -0.13], [-0.13, -0.13]]) {
    const bar = new THREE.Mesh(parts.bar, materials.iron);
    bar.position.set(bx, 0, bz);
    lantern.add(bar);
  }
  const sprite = new THREE.Sprite(glowMaterial);
  sprite.position.copy(lantern.position);
  sprite.scale.setScalar(1.8);
  post.add(pole, arm, lantern, sprite);
  return { post, sprite };
}

export function buildWorld(
  scene: THREE.Scene,
  kit: Kit,
  propsKit: Kit,
  natureNear: Kit,
  natureFar: Kit,
  textures: GroundTextures,
  lights: LightPool,
): World {
  const colliders: Box[] = [];
  const occluders: THREE.Box3[] = [];
  const chimneys: THREE.Vector3[] = [];
  const rooms: Room[] = [];

  // Dusk: low warm sun with long shadows, a cool sky light, fog the colour of the horizon.
  scene.fog = new THREE.FogExp2(palette.horizon, 0.0135);
  scene.background = new THREE.Color(palette.horizon);
  const sky = new THREE.HemisphereLight(palette.hemiSky, palette.hemiGround, 1.15);
  scene.add(sky);
  const sun = new THREE.DirectionalLight(palette.sun, 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38, near: 1, far: 220 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.05;
  scene.add(sun, sun.target, buildSky(), buildGround(textures));

  // The paved street and square, with a stone kerb along the street.
  for (let z = STREET_START; z > PLAZA.maxZ; z -= 2) {
    for (let x = -STREET_HALF + 1; x < STREET_HALF; x += 2) kit.place('Floor_UnevenBrick', at(x, 0.02, z));
    kit.place('Prop_ExteriorBorder_Straight1', at(-STREET_HALF, 0.02, z, Math.PI / 2));
    kit.place('Prop_ExteriorBorder_Straight1', at(STREET_HALF, 0.02, z - 2, -Math.PI / 2));
  }
  for (let z = PLAZA.maxZ; z > PLAZA.minZ; z -= 2) {
    for (let x = PLAZA.minX + 1; x < PLAZA.maxX; x += 2) {
      // Leave earth around the old tree's roots.
      if (Math.hypot(x - plazaTree.x, z - 1 - plazaTree.z) < 2.6) continue;
      kit.place('Floor_UnevenBrick', at(x, 0.02, z));
    }
  }

  const add = (built: Built) => {
    colliders.push(...built.colliders);
    occluders.push(built.occluder);
    chimneys.push(...built.chimneys);
    if (built.room) rooms.push(built.room);
  };
  for (const spec of [...houses, ...backHouses]) add(buildHouse(kit, spec));
  add(buildTower(kit, tower));

  // Inside: furniture, fires, candles and people.
  const people: World['people'] = [];
  const fires: { position: THREE.Vector3; size: number; room: Room }[] = [];
  const torchFlames: { position: THREE.Vector3; size: number }[] = [];
  for (const room of rooms) {
    const inside = furnish(room, kit, propsKit, scene);
    colliders.push(...inside.colliders);
    fires.push(...inside.fires);
    torchFlames.push(...inside.torchFlames);
    inside.lights.forEach((light) => lights.add(light));
    people.push(...inside.people);
  }

  // The market, benches, barrels.
  for (const [piece, x, y, z, rot] of outdoorProps) propsKit.place(piece, at(x, y, z, rot));
  for (const [x, z, halfX, halfZ, rot] of outdoorSolid) colliders.push({ x, z, halfX, halfZ, rot });

  for (const [piece, x, z, rot] of props) {
    kit.place(piece, at(x, 0, z, rot));
    if (piece === 'Prop_Wagon') {
      // The wagon's origin is at its shafts: the body reaches about 3 m behind (-z).
      colliders.push({ x: x - Math.sin(rot) * 1.15, z: z - Math.cos(rot) * 1.15, halfX: 1, halfZ: 2, rot });
    } else if (piece === 'Prop_Crate') {
      colliders.push({ x, z, halfX: 0.55, halfZ: 0.55, rot });
    } else {
      colliders.push({ x, z, halfX: 1, halfZ: 0.12, rot });
    }
  }
  for (const [piece, house, facade, offset, y] of vines) kit.place(piece, onFacade(houses[house], facade, offset, y));

  // The gate: a stretch of stone wall on each side of the road with the village's banners, a
  // wooden porch over the road, and a wooden fence across the rest of the clearing.
  for (const side of [-1, 1]) {
    const wallX = side * (gate.gap + 1);
    kit.place('Wall_UnevenBrick_Straight', at(wallX, 0, gate.z));
    kit.place('Corner_Exterior_Brick', at(side * gate.gap, 0, gate.z, side > 0 ? Math.PI / 2 : Math.PI));
    kit.place('Corner_Exterior_Brick', at(side * (gate.gap + 2), 0, gate.z, side > 0 ? Math.PI : Math.PI / 2));
    // The banner's cloth hangs down from its origin.
    propsKit.place('Banner_1_Cloth', at(wallX, 2.75, gate.z + 0.15));
    colliders.push({ x: wallX, z: gate.z - 0.1, halfX: 1.2, halfZ: 0.35, rot: 0 });
    for (let x = gate.gap + 3.05; x < gate.reach; x += 2.04) {
      kit.place('Prop_WoodenFence_Single', at(side * x, 0, gate.z + Math.sin(x * 0.7) * 0.15, Math.sin(x) * 0.04));
    }
  }
  // The porch: four timber posts at the walls' inner ends (in front of and behind them), a beam
  // across the road on each side (the roof's ridge log, slimmed; its base is 3.85 m up) and a
  // small tiled roof with its ridge across the road (a 4 × 8 house roof, flattened).
  const across = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  const upright = new THREE.Quaternion();
  const scaled = (name: string, x: number, y: number, z: number, turn: THREE.Quaternion, scale: [number, number, number]) =>
    kit.place(name, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), turn, new THREE.Vector3(...scale)));
  const porch = { x: gate.gap + 0.15, z: 0.75, height: 3.9 };
  for (const side of [-1, 1]) {
    for (const dz of [-porch.z, porch.z]) {
      scaled('Corner_ExteriorWide_Wood', side * porch.x, 0, gate.z + dz, upright, [1, porch.height / 3, 1]);
      colliders.push({ x: side * porch.x, z: gate.z + dz, halfX: 0.2, halfZ: 0.2, rot: 0 });
    }
  }
  for (const dz of [-porch.z, porch.z]) {
    scaled('Roof_Log', 0, porch.height - 3.85 * 0.42, gate.z + dz, across, [0.42, 0.42, 0.8]);
  }
  scaled('Roof_RoundTiles_4x8', 0, porch.height + 0.2, gate.z, across, [0.5, 0.36, 0.95]);

  const houseGroup = new THREE.Group();
  kit.build(houseGroup);
  propsKit.build(houseGroup);
  scene.add(houseGroup);
  scene.add(flames([...fires, ...torchFlames]), sparks(fires));

  // Nothing grows inside the rooms either.
  const floors = rooms.map((room): Box => {
    const centre = new THREE.Vector3().applyMatrix4(room.frame);
    return { x: centre.x, z: centre.z, halfX: room.halfW + 0.2, halfZ: room.halfL + 0.2, rot: room.rot };
  });
  const nature = plantNature(scene, natureNear, natureFar, [...colliders, ...floors]);
  colliders.push(...nature.colliders);

  // Lanterns along the street.
  const glowMaterial = new THREE.SpriteMaterial({
    map: glowTexture('255, 170, 90'),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.8,
  });
  const parts = {
    post: new THREE.BoxGeometry(0.14, 3.4, 0.14),
    arm: new THREE.BoxGeometry(0.08, 0.08, 0.8),
    cap: new THREE.ConeGeometry(0.24, 0.16, 4).rotateY(Math.PI / 4),
    plate: new THREE.BoxGeometry(0.3, 0.04, 0.3),
    bar: new THREE.BoxGeometry(0.025, 0.36, 0.025),
    core: new THREE.BoxGeometry(0.16, 0.26, 0.16),
  };
  const materials = {
    wood: new THREE.MeshStandardMaterial({ color: palette.wood, roughness: 0.9 }),
    iron: new THREE.MeshStandardMaterial({ color: palette.iron, roughness: 0.5, metalness: 0.6 }),
    // Brighter than white so the bloom picks it up.
    flame: new THREE.MeshBasicMaterial({ color: new THREE.Color(palette.fire).multiplyScalar(4), toneMapped: false }),
  };
  const glows: { sprite: THREE.Sprite; seed: number }[] = [];
  lanterns.forEach(([x, z], index) => {
    const { post, sprite } = lanternPost(glowMaterial, parts, materials);
    post.position.set(x, 0, z);
    // The arm reaches over the street.
    post.rotation.y = x < -0.5 ? Math.PI / 2 : x > 0.5 ? -Math.PI / 2 : 0;
    scene.add(post);
    post.updateMatrixWorld(true);
    glows.push({ sprite, seed: index * 2.3 });
    const flame = sprite.getWorldPosition(new THREE.Vector3()).setY(2.73);
    lights.add({ position: flame, color: palette.fire, intensity: 13.5, distance: 15, room: null, flicker: 0.6 });
    colliders.push({ x, z, halfX: 0.2, halfZ: 0.2, rot: 0 });
  });

  // Smoke from every chimney, fireflies where the clearing meets the forest and under the old tree.
  scene.add(chimneySmoke(chimneys));
  const spots: THREE.Vector3[] = [];
  for (let i = 0; i < 90; i++) {
    const side = Math.random();
    const x = side < 0.5 ? (Math.random() < 0.5 ? -1 : 1) * (CLEARING.maxX - 3 + Math.random() * 6) : (Math.random() - 0.5) * 44;
    const z = side < 0.5 ? CLEARING.minZ + Math.random() * (CLEARING.maxZ - CLEARING.minZ + 30) : CLEARING.maxZ + 2 + Math.random() * 20;
    spots.push(new THREE.Vector3(x, heightAt(x, z) + 0.6 + Math.random() * 1.8, z));
  }
  for (let i = 0; i < 18; i++) {
    const a = Math.random() * Math.PI * 2;
    spots.push(new THREE.Vector3(plazaTree.x + Math.cos(a) * 3, 1 + Math.random() * 2.5, plazaTree.z + Math.sin(a) * 3));
  }
  scene.add(fireflies(spots));

  // Mist lying where the clearing meets the trees, down the old road and over the field.
  const banks: THREE.Vector3[] = [];
  for (let tries = 0; tries < 2000 && banks.length < 60; tries++) {
    const x = (Math.random() - 0.5) * 90;
    const z = -55 + Math.random() * 130;
    const edge = distanceFromClearing(x, z);
    if (edge < 1 || edge > 16) continue;
    banks.push(new THREE.Vector3(x, heightAt(x, z) + 0.5, z));
  }
  for (let i = 0; i < 14; i++) {
    const z = CLEARING.maxZ + 4 + i * 4;
    banks.push(new THREE.Vector3((Math.random() - 0.5) * 6, heightAt(0, z) + 0.4, z));
  }
  for (let i = 0; i < 5; i++) banks.push(new THREE.Vector3(FIELD.minX + 1 + i * 1.5, 0.35, (FIELD.minZ + FIELD.maxZ) / 2 + (Math.random() - 0.5) * 4));
  scene.add(mist(banks, palette.mist));

  // Cloth bunting strung across the High Street between the upper floors.
  scene.add(...bunting.map(([from, to]) => buntingString(new THREE.Vector3(...from), new THREE.Vector3(...to))));

  const sunOffset = SUN_DIRECTION.clone().multiplyScalar(110);
  const snapped = new THREE.Vector3();
  return {
    colliders,
    occluders,
    rooms,
    people,
    fires,
    update(dt, time, focus, room) {
      wind.value = time;
      effectsTime.value = time;
      // The shadow box follows the adventurer, snapped to whole metres so shadows don't shimmer.
      snapped.set(Math.round(focus.x), 0, Math.round(focus.z));
      sun.target.position.copy(snapped);
      sun.position.copy(snapped).add(sunOffset);
      // Indoors the sky's light fades, so the fire and the candles light the room.
      const skyLevel = room ? 0.32 : 1.15;
      sky.intensity += (skyLevel - sky.intensity) * (1 - Math.exp(-dt * 3));
      for (const glow of glows) glow.sprite.scale.setScalar(1.6 + 0.35 * flicker(time + glow.seed));
    },
  };
}
