// Villagers: each one dressed from the wardrobe and playing its own clip, some with something in
// their hands. Walkers follow their path in a loop; everyone blocks the adventurer like a small
// pillar. People with lines can be talked to: they turn to face you (unless they're busy), and
// walkers stop for a moment. Only the people you could see are animated.
import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { propCopy, type Wardrobe } from './characters';
import type { Box } from './collisions';
import type { Room } from './house';
import type { NpcSpec } from './layout';
import type { LightPool, LightSource } from './lights';
import { palette } from './palette';

const WALK_SPEED = 1.15;
/** How close you have to be to talk to someone. */
const REACH = 2.4;
/** How long someone stays turned to you after talking. */
const TALK_TIME = 6;
/** Beyond this distance from the camera nobody is drawn. */
const DRAW_DISTANCE = 55;
/**
 * Only people this close to the camera cast shadows: each person is several skinned meshes drawn
 * again for the shadow map, and further away (at dusk) the shadow isn't missed.
 */
const SHADOW_DISTANCE = 14;
/**
 * The sitting clips put the hips 0.33 m behind the character's origin and 0.54 m up. A sitting
 * person's x, z is their seat: they're moved forward and up so their hips rest on its middle, on
 * a 0.5 m seat (benches and chairs).
 */
const SEAT = { forward: 0.3, lift: 0.06 };

/** Something held in one hand: the prop (or the torch), the hand, and its place in the hand bone's frame. */
interface Held {
  prop: string;
  bone: 'hand_l' | 'hand_r';
  position: [number, number, number];
  /** Degrees, XYZ. */
  rotation: [number, number, number];
}

// Solved from the skeleton rather than by eye: the grip sits in the palm (between the wrist and
// the middle knuckle) and the prop is turned by the hand's own axes (fist axis from little
// finger to index, knuckles, palm), so it moves with the hand through the whole clip.
// - torch: handle through the fist, flame up; the torch clip holds it up in the left hand.
// - axe: handle through the fist near its end, blade towards the knuckles.
// - mug: fingers through the handle, cup on the palm side, upright when the arm hangs.
// - bucket: the handle's bar through the fist, hanging when the arm is down.
const held: Record<Exclude<NpcSpec['hold'], 'crate' | undefined>, Held> = {
  torch: { prop: 'torch', bone: 'hand_l', position: [-0.0002, 0.073, 0.0031], rotation: [-150.1, 89.6, -117.4] },
  axe: { prop: 'Axe_Bronze', bone: 'hand_r', position: [-0.0017, 0.0601, 0.3028], rotation: [-150.1, -89.6, 117.4] },
  mug: { prop: 'Mug', bone: 'hand_l', position: [-0.1008, 0.0764, -0.0862], rotation: [92.4, 0.2, -0.4] },
  bucket: { prop: 'Bucket_Wooden_1', bone: 'hand_r', position: [-0.0739, 0.4249, 0.0177], rotation: [-85.8, 78.1, -91.8] },
};

/** Busy people (sitting, leaning on the bar, working) don't turn round to talk. */
const turning = new Set(['Idle_Loop', 'Idle_Talking_Loop', 'Idle_FoldArms_Loop', 'Sword_Idle', 'Idle_Torch_Loop', 'Consume', 'Walk_Loop', 'Walk_Formal_Loop']);
/** Walkers that stop to talk (a porter with a crate keeps going). */
const stopping = new Set(['Walk_Loop', 'Walk_Formal_Loop']);

interface Villager {
  spec: NpcSpec;
  object: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  main?: THREE.AnimationAction;
  idle?: THREE.AnimationAction;
  collider: Box;
  room: Room | null;
  path?: THREE.Vector2[];
  target: number;
  /** Until when (game clock) they stay turned to the adventurer. */
  talkUntil: number;
  /** Where the adventurer stood when they talked. */
  listener: THREE.Vector3;
  said: number;
  torch?: { flame: THREE.Object3D; light: LightSource };
  /** A crate carried in both arms. */
  carry?: { item: THREE.Object3D; left: THREE.Object3D; right: THREE.Object3D };
  /** Where the clip was last frame (0..1), for people whose work makes a sound. */
  phase: number;
  /** Their meshes (and what they hold), whose shadows are switched on only near the camera. */
  casters: THREE.Object3D[];
  shadows: boolean;
}

/** The crate's size at scale 1 (Crate_Wooden): width, height, and how far its origin sits under its bottom. */
const CRATE = { width: 0.84, height: 0.93, base: -0.05 };
const between = new THREE.Vector3();
const other = new THREE.Vector3();

/** A sound made by someone's work this frame (the smith's hammer, the woodcutter's axe). */
export interface Beat {
  sound: 'hammer' | 'chop';
  position: THREE.Vector3;
  room: Room | null;
}

/** A burning torch for a hand: a wooden handle, a bright flame and a glow. */
function torch(glow: THREE.Texture) {
  const group = new THREE.Group();
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.03, 0.55, 6),
    new THREE.MeshStandardMaterial({ color: palette.wood, roughness: 0.9 }),
  );
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.2, 6),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(palette.fire).multiplyScalar(4), toneMapped: false }),
  );
  flame.position.y = 0.36;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 }),
  );
  sprite.position.y = 0.38;
  sprite.scale.setScalar(1.1);
  group.add(handle, flame, sprite);
  return { group, flame };
}

/** Turns an object towards `yaw` the shortest way, smoothly. */
function turnTowards(object: THREE.Object3D, yaw: number, dt: number, rate: number) {
  let delta = yaw - object.rotation.y;
  delta = Math.atan2(Math.sin(delta), Math.cos(delta));
  object.rotation.y += delta * (1 - Math.exp(-dt * rate));
}

export class Villagers {
  private people: Villager[] = [];
  private frustum = new THREE.Frustum();
  private matrix = new THREE.Matrix4();
  private sphere = new THREE.Sphere(new THREE.Vector3(), 1.6);
  /** Their colliders, kept up to date as walkers move. */
  readonly colliders: Box[] = [];
  /** The sounds their work made this frame. */
  readonly beats: Beat[] = [];

  constructor(
    scene: THREE.Scene,
    wardrobe: Wardrobe,
    specs: (NpcSpec & { room?: Room })[],
    props: GLTF,
    grade: (material: THREE.Material) => THREE.Material,
    glow: THREE.Texture,
    lights: LightPool,
  ) {
    for (const spec of specs) {
      const object = wardrobe.dress(spec.look);
      const forward = spec.clip.startsWith('Sitting') ? SEAT.forward : 0;
      object.position.set(spec.x + Math.sin(spec.rot) * forward, forward ? SEAT.lift : 0, spec.z + Math.cos(spec.rot) * forward);
      object.rotation.y = spec.rot;
      scene.add(object);
      object.updateMatrixWorld(true);
      const mixer = new THREE.AnimationMixer(object);
      const clip = wardrobe.clip(spec.clip);
      let main: THREE.AnimationAction | undefined;
      if (clip) {
        // Start everyone at a different point of their loop, so nobody moves in sync.
        main = mixer.clipAction(clip).play();
        main.time = Math.random() * clip.duration;
      }
      const idleClip = spec.path && stopping.has(spec.clip) ? wardrobe.clip('Idle_Loop') : undefined;
      const person: Villager = {
        spec,
        object,
        mixer,
        main,
        idle: idleClip ? mixer.clipAction(idleClip) : undefined,
        collider: { x: spec.x, z: spec.z, halfX: 0.35, halfZ: 0.35, rot: 0 },
        room: spec.room ?? null,
        path: spec.path?.map(([x, z]) => new THREE.Vector2(x, z)),
        target: 1,
        talkUntil: -1,
        listener: new THREE.Vector3(),
        said: 0,
        phase: 0,
        casters: [],
        shadows: true,
      };

      if (spec.hold === 'crate') {
        // Carried in both arms: placed between the hands every frame (see update).
        const item = propCopy(props, 'Crate_Wooden', grade);
        const left = object.getObjectByName('hand_l');
        const right = object.getObjectByName('hand_r');
        if (item && left && right) {
          object.add(item);
          person.carry = { item, left, right };
        }
      } else if (spec.hold) {
        const { prop, bone, position, rotation } = held[spec.hold];
        const hand = object.getObjectByName(bone);
        // The torch is drawn here; the rest are props. The grip is the holder's origin.
        let item: THREE.Object3D | null = null;
        if (prop === 'torch') {
          const lit = torch(glow);
          // Held a third of the way up the handle.
          lit.group.position.y = 0.12;
          item = new THREE.Group().add(lit.group);
          const light = lights.add({ position: new THREE.Vector3(spec.x, 1.6, spec.z), color: palette.fire, intensity: 7, distance: 9, room: person.room, flicker: 0.7 });
          person.torch = { flame: lit.flame, light };
        } else {
          item = propCopy(props, prop, grade);
        }
        if (hand && item) {
          item.position.set(...position);
          item.rotation.set(...(rotation.map(THREE.MathUtils.degToRad) as [number, number, number]));
          item.scale.setScalar(1 / (hand.getWorldScale(new THREE.Vector3()).x || 1));
          hand.add(item);
        }
      }

      object.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.castShadow) person.casters.push(child);
      });
      this.colliders.push(person.collider);
      this.people.push(person);
    }
  }

  /** The nearest person within reach who has something to say, in the same room as `position`. */
  nearest(position: THREE.Vector3, room: Room | null) {
    let best: Villager | null = null;
    let bestDistance = REACH;
    for (const person of this.people) {
      if (!person.spec.lines?.length || person.room !== room) continue;
      const distance = Math.hypot(person.object.position.x - position.x, person.object.position.z - position.z);
      if (distance < bestDistance) {
        best = person;
        bestDistance = distance;
      }
    }
    return best ? { id: this.people.indexOf(best), name: best.spec.name ?? 'A villager', distance: bestDistance } : null;
  }

  /** Talks to someone (by `nearest().id`): they turn to `from` and say their next line. */
  talk(id: number, time: number, from: THREE.Vector3) {
    const person = this.people[id];
    const lines = person?.spec.lines;
    if (!person || !lines?.length) return null;
    const line = lines[person.said % lines.length];
    person.said++;
    person.talkUntil = time + TALK_TIME;
    person.listener.copy(from);
    return { name: person.spec.name ?? 'A villager', line };
  }

  update(dt: number, time: number, camera: THREE.Camera, focus: THREE.Vector3, room: Room | null) {
    this.matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.matrix);
    this.beats.length = 0;
    for (const person of this.people) {
      const { object, spec } = person;
      const position = object.position;
      const talking = time < person.talkUntil;
      const listenerYaw = Math.atan2(person.listener.x - position.x, person.listener.z - position.z);

      if (person.path) {
        const stops = talking && Boolean(person.idle);
        if (stops) {
          turnTowards(object, listenerYaw, dt, 5);
        } else {
          const goal = person.path[person.target];
          const dx = goal.x - position.x;
          const dz = goal.y - position.z;
          const distance = Math.hypot(dx, dz);
          const speed = spec.speed ?? WALK_SPEED;
          if (distance < 0.3) {
            person.target = (person.target + 1) % person.path.length;
          } else {
            position.x += (dx / distance) * speed * dt;
            position.z += (dz / distance) * speed * dt;
            turnTowards(object, Math.atan2(dx, dz), dt, 4);
          }
        }
        // Walk or stand still, cross-fading between the two.
        if (person.idle && person.main) {
          const want = stops ? person.idle : person.main;
          const other = stops ? person.main : person.idle;
          if (!want.isRunning()) {
            want.reset().play();
            want.crossFadeFrom(other, 0.3, true);
          }
        }
        person.collider.x = position.x;
        person.collider.z = position.z;
      } else if (turning.has(spec.clip)) {
        turnTowards(object, talking ? listenerYaw : spec.rot, dt, talking ? 5 : 1.5);
      }

      // Drawn only in the adventurer's space (indoors you can't see the street, outdoors you only
      // see into a room from near its door), near enough and in view.
      let visible = person.room === room || (room === null && position.distanceTo(focus) < 14);
      if (visible) visible = camera.position.distanceTo(position) < DRAW_DISTANCE;
      if (visible) {
        this.sphere.center.copy(position).y += 1;
        visible = this.frustum.intersectsSphere(this.sphere);
      }
      object.visible = visible;
      const shadows = visible && camera.position.distanceTo(position) < SHADOW_DISTANCE;
      if (shadows !== person.shadows) {
        person.shadows = shadows;
        for (const caster of person.casters) caster.castShadow = shadows;
      }
      // People whose work makes a sound keep working out of sight, so you hear them anyway.
      const beat = spec.beat;
      if (visible || beat) person.mixer.update(dt);
      if (beat && person.main) {
        const phase = person.main.time / person.main.getClip().duration;
        const crossed = person.phase < beat.at ? phase >= beat.at || phase < person.phase : phase >= beat.at && phase < person.phase;
        if (crossed) this.beats.push({ sound: beat.sound, position: position, room: person.room });
        person.phase = phase;
      }
      if (person.torch) person.torch.flame.getWorldPosition(person.torch.light.position);
      if (person.carry && visible) {
        // The crate between the palms, sized once so its sides fill the gap between the hands.
        const { item, left, right } = person.carry;
        left.getWorldPosition(between);
        right.getWorldPosition(other);
        if (item.userData.sized !== true) {
          item.scale.setScalar(THREE.MathUtils.clamp((between.distanceTo(other) - 0.1) / CRATE.width, 0.3, 0.6));
          item.userData.sized = true;
        }
        const scale = item.scale.x;
        object.worldToLocal(between.add(other).multiplyScalar(0.5));
        item.position.set(between.x, between.y - (CRATE.height / 2 + CRATE.base) * scale, between.z);
      }
    }
  }

  dispose() {
    for (const person of this.people) {
      person.mixer.stopAllAction();
      person.mixer.uncacheRoot(person.object);
    }
  }
}
