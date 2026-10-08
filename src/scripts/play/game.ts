// The 3D village. Loaded only on /play, and only when the browser supports WebGL (play.astro
// imports this module on demand, so three.js never weighs on the classic portfolio).
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import animationsUrl from '../../assets/play/animations.glb?url';
import animations2Url from '../../assets/play/animations-2.glb?url';
import charactersUrl from '../../assets/play/characters.glb?url';
import grassUrl from '../../assets/play/grass-color.webp?url';
import kitUrl from '../../assets/play/kit.glb?url';
import mudUrl from '../../assets/play/mud-color.webp?url';
import mudNormalUrl from '../../assets/play/mud-normal.webp?url';
import natureUrl from '../../assets/play/nature.glb?url';
import peasantGreenUrl from '../../assets/play/peasant-green.webp?url';
import propsUrl from '../../assets/play/props.glb?url';
import rangerBlueUrl from '../../assets/play/ranger-blue.webp?url';
import rangerBrownUrl from '../../assets/play/ranger-brown.webp?url';
import { FollowCamera } from './camera';
import { Wardrobe } from './characters';
import { inRoom } from './house';
import { Joystick, Keyboard } from './input';
import { Kit } from './kit';
import { PLAZA, STREET_HALF, STREET_START, areas, npcs, plazaTree, regions, spawn } from './layout';
import { LightPool } from './lights';
import { addWind, grassAt } from './nature';
import { Villagers } from './npcs';
import { grading, palette } from './palette';
import { Player } from './player';
import { buildPlaces, type Point, type VillageContent } from './places';
import { Ambience, type Emitter, type Ground } from './sound';
import { buildWorld } from './world';
import { prefersReducedMotion } from '../support';

/** How close you have to stand to use a frame, a board or a note. */
const POINT_REACH = 1.7;

/** What the ground is made of outdoors, for the footsteps: the paving, grass, or bare earth. */
function groundAt(x: number, z: number): Ground {
  const street = Math.abs(x) < STREET_HALF && z < STREET_START && z > PLAZA.maxZ;
  const square = x > PLAZA.minX && x < PLAZA.maxX && z > PLAZA.minZ && z < PLAZA.maxZ && Math.hypot(x - plazaTree.x, z - plazaTree.z) > 2.6;
  if (street || square) return 'stone';
  return grassAt(x, z) > 0.5 ? 'grass' : 'earth';
}

export interface GameOptions {
  /** Element the canvas fills. */
  stage: HTMLElement;
  /** The touch stick's zone (see Joystick). */
  stick?: HTMLElement | null;
  /** The projects and site data the village shows (see places.ts). */
  content: VillageContent;
  /** Loading progress, 0..1 (by bytes). */
  onProgress(fraction: number): void;
  /** True while the player shouldn't move (a panel is open). */
  isBlocked(): boolean;
  /** Mouse look turned on or off (off: the page invites a click). */
  onLook(looking: boolean): void;
  /** The adventurer walked into a named place. */
  onRegion(name: string): void;
  /** Something to do came within reach ("Talk to the smith", "View Finn Adventure"), or nothing is (null). */
  onPrompt(label: string | null): void;
  /** Someone said something. */
  onSay(name: string, line: string): void;
  /** A frame, board or note was used: open this panel. */
  onOpen(panel: string): void;
}

export interface Game {
  /** Hands control to the player (until then the camera sways behind the adventurer). */
  start(): void;
  /** Captures the mouse for looking around (after a click). */
  look(): void;
  /** Frees the mouse, e.g. when a panel opens. */
  release(): void;
  /** Talks to whoever is within reach, or uses what's within reach. */
  interact(): void;
  /** Turns the sound on or off (turning it on needs a click or key press). */
  sound(on: boolean): void;
  /** Frees the GPU memory and every listener. */
  dispose(): void;
}

/** Loads every file in parallel and reports their combined progress by bytes. */
async function loadAssets(onProgress: (fraction: number) => void) {
  const gltfLoader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const textureLoader = new THREE.TextureLoader();
  const parts = new Map<string, { loaded: number; total: number }>();
  const report = () => {
    let loaded = 0;
    let total = 0;
    parts.forEach((part) => {
      loaded += part.loaded;
      total += part.total;
    });
    onProgress(total ? Math.min(loaded / total, 1) : 0);
  };
  const progress = (url: string) => (event: ProgressEvent) => {
    const part = parts.get(url)!;
    part.loaded = event.loaded;
    if (event.lengthComputable) part.total = event.total;
    report();
  };
  const finish = (url: string) => {
    const part = parts.get(url)!;
    part.loaded = part.total;
    report();
  };
  const model = (url: string, estimate: number) =>
    new Promise<GLTF>((resolve, reject) => {
      parts.set(url, { loaded: 0, total: estimate });
      gltfLoader.load(
        url,
        (gltf) => {
          finish(url);
          resolve(gltf);
        },
        progress(url),
        reject,
      );
    });
  const texture = (url: string, estimate: number, colour = true) =>
    new Promise<THREE.Texture>((resolve, reject) => {
      parts.set(url, { loaded: 0, total: estimate });
      textureLoader.load(
        url,
        (loaded) => {
          if (colour) loaded.colorSpace = THREE.SRGBColorSpace;
          finish(url);
          resolve(loaded);
        },
        undefined,
        reject,
      );
    });
  const [kit, props, nature, characters, animations, animations2, mud, mudNormal, grass, rangerBrown, peasantGreen, rangerBlue] =
    await Promise.all([
      model(kitUrl, 1_370_000),
      model(propsUrl, 1_940_000),
      model(natureUrl, 2_110_000),
      model(charactersUrl, 2_400_000),
      model(animationsUrl, 640_000),
      model(animations2Url, 390_000),
      texture(mudUrl, 340_000),
      texture(mudNormalUrl, 130_000, false),
      texture(grassUrl, 200_000),
      texture(rangerBrownUrl, 55_000),
      texture(peasantGreenUrl, 42_000),
      texture(rangerBlueUrl, 68_000),
    ]);
  return {
    kit,
    props,
    nature,
    characters,
    animations: [animations, animations2],
    ground: { mud, mudNormal, grass },
    variants: { rangerBrown, peasantGreen, rangerBlue },
  };
}

/**
 * Colour-grades the packs' materials (see palette.grading), lights the windows, and makes leaves
 * and grass sway. Shared by every instance of a material.
 */
function gradeMaterials() {
  const graded = new Map<THREE.Material, THREE.Material>();
  return (source: THREE.Material) => {
    const cached = graded.get(source);
    if (cached) return cached;
    let material: THREE.Material;
    if (source.name === 'MI_WindowGlass') {
      material = new THREE.MeshStandardMaterial({
        name: source.name,
        color: 0x120a04,
        emissive: palette.window,
        emissiveIntensity: 1.05,
        roughness: 0.5,
      });
    } else {
      material = source.clone();
      const tint = grading[source.name];
      if (tint !== undefined && 'color' in material) (material as THREE.MeshStandardMaterial).color.multiply(new THREE.Color(tint));
      if (/^Leaves/.test(source.name)) {
        material.alphaToCoverage = true;
        addWind(material, source.name === 'Leaves' ? 0.05 : 0.012);
      } else if (source.name === 'Grass') {
        addWind(material, 0.07);
      }
    }
    graded.set(source, material);
    return material;
  };
}

export async function loadGame({
  stage,
  stick,
  content,
  onProgress,
  isBlocked,
  onLook,
  onRegion,
  onPrompt,
  onSay,
  onOpen,
}: GameOptions): Promise<Game> {
  const assets = await loadAssets(onProgress);

  // Antialiasing comes from the composer's multisampled target, not the canvas.
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  // Sharp enough on high-density screens without rendering 3–4× the pixels (adaptive quality may
  // lower it to 1; resizing keeps whatever it is).
  let pixelRatio = Math.min(window.devicePixelRatio, 1.25);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.classList.add('village-canvas');
  stage.append(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 900);

  const grade = gradeMaterials();
  // Firelight: a fixed set of point lights shared by every flame (see lights.ts).
  const lights = new LightPool(scene, 8);
  const world = buildWorld(
    scene,
    new Kit(assets.kit, grade),
    new Kit(assets.props, grade),
    new Kit(assets.nature, grade),
    new Kit(assets.nature, grade),
    assets.ground,
    lights,
  );

  const wardrobe = new Wardrobe(assets.characters, assets.animations);
  wardrobe.variant('MI_Ranger', assets.variants.rangerBrown);
  wardrobe.variant('MI_Peasant', assets.variants.peasantGreen);
  // The adventurer's own colours.
  wardrobe.variant('MI_Ranger', assets.variants.rangerBlue, 'blue');
  // The torch glow reuses the lanterns' glow texture.
  let glow: THREE.Texture | null = null;
  scene.traverse((object) => {
    const sprite = object as THREE.Sprite;
    if (!glow && sprite.isSprite) glow = sprite.material.map;
  });
  const villagers = new Villagers(scene, wardrobe, [...npcs, ...world.people], assets.props, grade, glow ?? new THREE.Texture(), lights);

  // The portfolio in the village: frames, portrait, boards and signs (painted with the site's font).
  await document.fonts.ready;
  const places = buildPlaces(scene, world.rooms, content);
  const colliders = [...world.colliders, ...villagers.colliders, ...places.colliders];

  // Sounds that stay put: the fires, the tavern (its tune and crowd), pages in the library.
  const roomNamed = (name: string) => world.rooms.find((room) => room.name === name);
  const emitters: Emitter[] = world.fires.map(({ position, room }) => ({ sound: 'fire', position, room }));
  const tavern = roomNamed('The Rusty Tankard');
  if (tavern) emitters.push({ sound: 'tavern', position: new THREE.Vector3().applyMatrix4(tavern.frame), room: tavern });
  const library = roomNamed('The Old Library');
  if (library) emitters.push({ sound: 'pages', position: new THREE.Vector3(0, 1, -1.5).applyMatrix4(library.frame), room: library });

  const player = new Player(wardrobe);
  player.place(spawn.x, spawn.z, spawn.rot);
  scene.add(player.object);

  // Dev server only: ?spawn=x,z,rot places the adventurer, ?cam=x,y,z&look=x,y,z fixes the camera
  // (for checking the village without walking there); village.view(cam, look) moves it later.
  const debug = import.meta.env.DEV ? new URLSearchParams(location.search) : null;
  const debugSpawn = debug?.get('spawn')?.split(',').map(Number);
  if (debugSpawn) player.place(debugSpawn[0], debugSpawn[1], debugSpawn[2] ?? spawn.rot);
  let debugCam = debug?.get('cam')?.split(',').map(Number);
  let debugLook = debug?.get('look')?.split(',').map(Number) ?? [0, 2, 0];
  if (import.meta.env.DEV) {
    const view = (cam: number[], look: number[]) => {
      debugCam = cam;
      debugLook = look;
    };
    Object.assign(window, { village: { player, camera, scene, renderer, view } });
  }

  // The camera starts behind the adventurer, who faces up the road.
  const baseYaw = player.object.rotation.y - Math.PI;
  const view = new FollowCamera(camera, canvas, world.occluders, onLook);
  view.snap(player.object.position, baseYaw);
  let started = false;
  const keyboard = new Keyboard(() => !started || isBlocked());
  const joystick = stick ? new Joystick(stick, () => !started || isBlocked()) : null;
  const ambience = new Ambience(emitters);

  // Post-processing: a soft bloom on fire, windows and the sunset (MSAA in the render target).
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.6, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const resize = () => {
    const { clientWidth: width, clientHeight: height } = stage;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();

  // Adaptive quality: if the first seconds run below ~40 fps, render fewer pixels and drop the
  // bloom; if it's still slow, the shadows go too.
  let quality = 2;
  let sampleTime = 0;
  let sampleFrames = 0;
  const adapt = (dt: number) => {
    if (quality === 0) return;
    sampleTime += dt;
    sampleFrames++;
    if (sampleTime < 3) return;
    const slow = sampleTime / sampleFrames > 1 / 40;
    sampleTime = 0;
    sampleFrames = 0;
    if (!slow) return;
    quality--;
    if (quality === 1) {
      bloom.enabled = false;
      pixelRatio = 1;
      renderer.setPixelRatio(pixelRatio);
      composer.setPixelRatio(pixelRatio);
    } else {
      renderer.shadowMap.enabled = false;
      scene.traverse((object) => {
        const material = (object as THREE.Mesh).material as THREE.Material | undefined;
        if (material) material.needsUpdate = true;
      });
    }
  };

  let region = '';
  type Target = { person: NonNullable<ReturnType<Villagers['nearest']>> } | { point: Point } | null;
  let within: Target = null;
  let targetLabel: string | null = null;
  const reduceMotion = prefersReducedMotion();
  const timer = new THREE.Timer();
  const still = { x: 0, z: 0 };
  let lastFrame = -Infinity;

  const frame = (now: number) => {
    // Behind an open panel the village only needs to look alive: about ten frames a second, and
    // they don't count towards adaptive quality (a trailer playing in the panel would slow them).
    const panelOpen = started && isBlocked();
    if (panelOpen && now - lastFrame < 100) return;
    lastFrame = now;
    timer.update(now);
    // Clamp long frames (a hiccup, a background tab) so nothing jumps.
    const raw = timer.getDelta();
    const dt = Math.min(raw, panelOpen ? 0.12 : 0.05);
    const time = timer.getElapsed();
    const blocked = !started || isBlocked();
    if (blocked) {
      keyboard.clear();
      joystick?.clear();
    }
    // The keyboard wins over the stick when both are used.
    const keys = keyboard.move();
    const usingKeys = keys.x !== 0 || keys.z !== 0;
    const move = blocked ? still : usingKeys || !joystick ? keys : joystick.move();
    const walking = usingKeys || !joystick ? keyboard.walking() : joystick.walking();
    player.update(dt, move, walking, view.yaw, colliders, areas);

    const position = player.object.position;
    const room = world.rooms.find((candidate) => inRoom(candidate, position, 0.3)) ?? null;
    if (debugCam) {
      camera.position.set(debugCam[0], debugCam[1], debugCam[2]);
      camera.lookAt(debugLook[0], debugLook[1], debugLook[2]);
    } else if (started) view.update(dt, position, room);
    else view.drift(dt, reduceMotion ? 0 : time, baseYaw);
    camera.updateMatrixWorld();
    villagers.update(dt, time, camera, position, room);
    world.update(dt, time, position, room);
    lights.update(dt, time, position, room);

    const { x, z } = position;
    const here = room?.name ?? regions.find(({ area }) => x >= area.minX && x <= area.maxX && z >= area.minZ && z <= area.maxZ)?.name ?? '';
    if (started && here && here !== region) onRegion(here);
    region = here;

    // Something to do within reach: the nearest of someone to talk to and something to use.
    let next: Target = null;
    if (started) {
      const person = villagers.nearest(position, room);
      let point: Point | null = null;
      let pointDistance = POINT_REACH;
      for (const candidate of places.points) {
        if (candidate.room !== room) continue;
        const distance = Math.hypot(candidate.position.x - x, candidate.position.z - z);
        if (distance < pointDistance) {
          point = candidate;
          pointDistance = distance;
        }
      }
      if (point && (!person || pointDistance < person.distance)) next = { point };
      else if (person) next = { person };
    }
    const label = next && ('point' in next ? next.point.label : `Talk to ${next.person.name.charAt(0).toLowerCase()}${next.person.name.slice(1)}`);
    if (label !== targetLabel) onPrompt(label);
    within = next;
    targetLabel = label;

    if (ambience.enabled) {
      ambience.update({
        camera,
        room,
        steps: player.steps,
        ground: room ? 'wood' : groundAt(x, z),
        running: player.speed > 2.5,
        beats: villagers.beats,
      });
    }

    composer.render(dt);
    if (started && !panelOpen) adapt(raw);
  };

  // Rendering stops while the tab is hidden.
  const visibility = () => {
    if (document.hidden) {
      renderer.setAnimationLoop(null);
    } else {
      timer.reset();
      renderer.setAnimationLoop(frame);
    }
  };
  document.addEventListener('visibilitychange', visibility);
  renderer.setAnimationLoop(frame);

  return {
    start() {
      started = true;
      view.enabled = true;
      region = '';
      view.look();
    },
    look() {
      view.look();
    },
    release() {
      view.release();
    },
    interact() {
      if (!within) return;
      if ('point' in within) {
        onOpen(within.point.panel);
        return;
      }
      const said = villagers.talk(within.person.id, timer.getElapsed(), player.object.position);
      if (said) onSay(said.name, said.line);
    },
    sound(on) {
      if (on) ambience.enable();
      else ambience.disable();
    },
    dispose() {
      renderer.setAnimationLoop(null);
      timer.dispose();
      document.removeEventListener('visibilitychange', visibility);
      observer.disconnect();
      keyboard.dispose();
      joystick?.dispose();
      ambience.dispose();
      view.dispose();
      player.dispose();
      villagers.dispose();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        for (const material of materials) {
          for (const value of Object.values(material)) {
            if (value instanceof THREE.Texture) value.dispose();
          }
          material.dispose();
        }
      });
      composer.dispose();
      target.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
