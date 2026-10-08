// The adventurer: the ranger's outfit without its hood, in blue. Moves relative to the camera,
// turns towards where it goes, collides with the village and blends between its idle, walk and
// jog animations.
import * as THREE from 'three';
import type { Look, Wardrobe } from './characters';
import { resolve, type Area, type Box } from './collisions';

const RUN_SPEED = 3.6;
const WALK_SPEED = 1.45;
const RADIUS = 0.35;

type Move = 'idle' | 'walk' | 'run';

export const playerLook: Look = {
  outfit: 'Male_Ranger',
  head: 'Male_Head',
  extras: ['Hair_SimpleParted', 'Hair_Beard', 'Eyebrows_Regular'],
  hair: 0x2e2219,
  variant: 'blue',
  hood: false,
};

// A foot is planted when its ankle bone drops below FOOT_DOWN and lifted again above FOOT_UP
// (metres above the ground; the ankle sits at about 0.10 when standing).
const FOOT_DOWN = 0.13;
const FOOT_UP = 0.17;

export class Player {
  readonly object: THREE.Object3D;
  private mixer: THREE.AnimationMixer;
  private actions: Partial<Record<Move, THREE.AnimationAction>> = {};
  private current?: THREE.AnimationAction;
  private velocity = new THREE.Vector2();
  private feet: { bone: THREE.Object3D; side: -1 | 1; down: boolean }[] = [];
  private ankle = new THREE.Vector3();
  /** The feet that touched the ground this frame (-1 left, 1 right): footsteps in time with the animation. */
  readonly steps: (-1 | 1)[] = [];

  constructor(wardrobe: Wardrobe) {
    this.object = wardrobe.dress(playerLook);
    this.mixer = new THREE.AnimationMixer(this.object);
    const clips: Record<Move, string> = { idle: 'Idle_Loop', walk: 'Walk_Loop', run: 'Jog_Fwd_Loop' };
    for (const [move, name] of Object.entries(clips) as [Move, string][]) {
      const clip = wardrobe.clip(name);
      if (clip) this.actions[move] = this.mixer.clipAction(clip);
    }
    for (const [name, side] of [['foot_l', -1], ['foot_r', 1]] as const) {
      const bone = this.object.getObjectByName(name);
      if (bone) this.feet.push({ bone, side, down: true });
    }
    this.play('idle');
  }

  /** Ground speed in m/s. */
  get speed() {
    return this.velocity.length();
  }

  place(x: number, z: number, rot: number) {
    this.object.position.set(x, 0, z);
    this.object.rotation.y = rot;
  }

  private play(move: Move) {
    const next = this.actions[move];
    if (!next || next === this.current) return;
    next.reset().play();
    if (this.current) next.crossFadeFrom(this.current, 0.25, true);
    this.current = next;
  }

  /**
   * @param move input: x to the right, z forward (camera-relative), each -1..1
   * @param yaw the camera's yaw, so "forward" is away from the camera
   */
  update(dt: number, move: { x: number; z: number }, walking: boolean, yaw: number, colliders: Box[], areas: Area[]) {
    // Camera-relative direction on the ground.
    const forwardX = -Math.sin(yaw);
    const forwardZ = -Math.cos(yaw);
    let wishX = Math.cos(yaw) * move.x + forwardX * move.z;
    let wishZ = -Math.sin(yaw) * move.x + forwardZ * move.z;
    const length = Math.hypot(wishX, wishZ);
    const speed = length > 0 ? (walking ? WALK_SPEED : RUN_SPEED) : 0;
    if (length > 0) {
      wishX = (wishX / length) * speed;
      wishZ = (wishZ / length) * speed;
    }
    // Ease into the new velocity: quick, but no instant snaps.
    const blend = 1 - Math.exp(-dt * 10);
    this.velocity.x += (wishX - this.velocity.x) * blend;
    this.velocity.y += (wishZ - this.velocity.y) * blend;

    const position = { x: this.object.position.x + this.velocity.x * dt, z: this.object.position.z + this.velocity.y * dt };
    resolve(position, RADIUS, colliders, areas);
    this.object.position.x = position.x;
    this.object.position.z = position.z;

    const current = this.velocity.length();
    if (current > 0.2) {
      // Turn the shortest way towards the direction of travel.
      const target = Math.atan2(this.velocity.x, this.velocity.y);
      let delta = target - this.object.rotation.y;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      this.object.rotation.y += delta * (1 - Math.exp(-dt * 12));
    }

    if (current < 0.25) this.play('idle');
    else if (current < (WALK_SPEED + RUN_SPEED) / 2) this.play('walk');
    else this.play('run');
    this.mixer.update(dt);

    // Footsteps: a foot coming down onto the ground while moving.
    this.steps.length = 0;
    for (const foot of this.feet) {
      const height = foot.bone.getWorldPosition(this.ankle).y - this.object.position.y;
      if (!foot.down && height < FOOT_DOWN) {
        foot.down = true;
        if (current > 0.4) this.steps.push(foot.side);
      } else if (foot.down && height > FOOT_UP) {
        foot.down = false;
      }
    }
  }

  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.object);
  }
}
