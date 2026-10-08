// A close third-person camera, over the right shoulder like The Witcher.
// - Mouse: the pointer is captured (Pointer Lock) and moving the mouse looks around. Pressing Alt
//   frees the cursor (for the buttons and panels); pressing it again captures it. If the browser
//   refuses (it needs a click after Esc), a click on the world does it.
// - Touch: drag to look around.
// - Wheel: closer or further.
// When a house stands between the camera and the adventurer, the camera moves in front of it;
// indoors it stays inside the room.
import * as THREE from 'three';
import type { Room } from './house';

const MIN_DISTANCE = 1.6;
const MIN_INDOORS = 0.5;
const SHOULDER = 0.45;
const HEAD = 1.6;
const MOUSE_SPEED = 0.0022;

export class FollowCamera {
  yaw = 0;
  private pitch = 0.18;
  private distance = 4.4;
  /** The distance actually used this frame (shorter while something is in the way). */
  private current = 4.4;
  private focus = new THREE.Vector3();
  private drag?: { id: number; x: number; y: number };
  private ray = new THREE.Ray();
  private hit = new THREE.Vector3();
  private localRay = new THREE.Ray();
  private roomBox = new THREE.Box3();
  private rotation = new THREE.Matrix4();
  /** The room the adventurer is in. */
  private room: Room | null = null;
  enabled = false;

  constructor(
    readonly camera: THREE.PerspectiveCamera,
    private element: HTMLElement,
    private occluders: THREE.Box3[] = [],
    /** Told whenever mouse look turns on or off, so the page can say "click to look around". */
    private onLook: (looking: boolean) => void = () => {},
  ) {
    element.addEventListener('pointerdown', this.down);
    element.addEventListener('pointermove', this.dragMove);
    element.addEventListener('pointerup', this.up);
    element.addEventListener('pointercancel', this.up);
    element.addEventListener('wheel', this.wheel, { passive: false });
    document.addEventListener('mousemove', this.mouseMove);
    document.addEventListener('pointerlockchange', this.lockChange);
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
  }

  get looking() {
    return document.pointerLockElement === this.element;
  }

  /** Captures the mouse for looking around (needs a recent click or key press). */
  look() {
    if (!this.enabled || this.looking || !this.element.requestPointerLock) return;
    try {
      const request = this.element.requestPointerLock() as unknown as Promise<void> | undefined;
      request?.catch?.(() => this.onLook(false));
    } catch {
      this.onLook(false);
    }
  }

  /** Frees the mouse, e.g. when a panel opens. */
  release() {
    if (this.looking) document.exitPointerLock();
  }

  private lockChange = () => this.onLook(this.looking);

  /** Alt toggles between looking around and a free cursor. */
  private keyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Alt') return;
    // Alt alone would focus the browser's menu bar on some systems.
    event.preventDefault();
    if (event.repeat) return;
    if (this.looking) this.release();
    else if (!document.querySelector('dialog[open]')) this.look();
  };

  private keyUp = (event: KeyboardEvent) => {
    if (event.key === 'Alt') event.preventDefault();
  };

  private mouseMove = (event: MouseEvent) => {
    if (!this.looking) return;
    this.yaw -= event.movementX * MOUSE_SPEED;
    this.pitch = THREE.MathUtils.clamp(this.pitch + event.movementY * MOUSE_SPEED, -0.35, 0.95);
  };

  private down = (event: PointerEvent) => {
    if (!this.enabled) return;
    if (event.pointerType === 'mouse') {
      if (event.button === 0) this.look();
      return;
    }
    this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    this.element.setPointerCapture(event.pointerId);
  };

  private dragMove = (event: PointerEvent) => {
    if (!this.drag || event.pointerId !== this.drag.id) return;
    this.yaw -= (event.clientX - this.drag.x) * 0.005;
    this.pitch = THREE.MathUtils.clamp(this.pitch + (event.clientY - this.drag.y) * 0.004, -0.35, 0.95);
    this.drag.x = event.clientX;
    this.drag.y = event.clientY;
  };

  private up = (event: PointerEvent) => {
    if (this.drag?.id === event.pointerId) this.drag = undefined;
  };

  private wheel = (event: WheelEvent) => {
    if (!this.enabled) return;
    event.preventDefault();
    this.distance = THREE.MathUtils.clamp(this.distance * (1 + event.deltaY * 0.001), 2.4, 9);
  };

  /** The point the camera orbits: the adventurer's head, shifted over the right shoulder. */
  private target(position: THREE.Vector3, out: THREE.Vector3) {
    return out.set(
      position.x + Math.cos(this.yaw) * SHOULDER,
      position.y + HEAD,
      position.z - Math.sin(this.yaw) * SHOULDER,
    );
  }

  /** Jumps straight to the target, e.g. on load. */
  snap(position: THREE.Vector3, yaw = this.yaw) {
    this.yaw = yaw;
    this.target(position, this.focus);
    this.current = this.allowed();
    this.apply();
  }

  /** Follows the adventurer; `room` is the room they're in, if any. */
  update(dt: number, position: THREE.Vector3, room: Room | null = null) {
    this.room = room;
    const goal = this.target(position, new THREE.Vector3());
    // Indoors the point over the shoulder stays clear of the walls.
    if (room) {
      goal.applyMatrix4(room.inverse);
      goal.x = THREE.MathUtils.clamp(goal.x, -room.halfW + 0.9, room.halfW - 0.9);
      goal.z = THREE.MathUtils.clamp(goal.z, -room.halfL + 0.9, room.halfL - 0.9);
      goal.applyMatrix4(room.frame);
    }
    this.focus.lerp(goal, 1 - Math.exp(-dt * 12));
    this.follow(dt);
  }

  /** Slowly sways behind the target: the idle view behind the start screen. */
  drift(dt: number, time: number, baseYaw: number) {
    this.yaw = baseYaw + Math.sin(time * 0.12) * 0.35;
    this.follow(dt);
  }

  /** Moves in fast when something blocks the view, eases back out when it clears. */
  private follow(dt: number) {
    const allowed = this.allowed();
    const rate = allowed < this.current ? 25 : 3;
    this.current += (allowed - this.current) * (1 - Math.exp(-dt * rate));
    this.apply();
  }

  private direction(out: THREE.Vector3) {
    return out.set(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch),
    );
  }

  /** How far the camera can be before a house gets in the way (or, indoors, a wall or the ceiling). */
  private allowed() {
    this.ray.origin.copy(this.focus);
    this.direction(this.ray.direction);
    const room = this.room;
    if (room) {
      // In the room's own frame the room is a box; the ray starts inside it and leaves through
      // a wall, the floor or the ceiling.
      this.roomBox.min.set(-room.halfW + 0.42, 0.3, -room.halfL + 0.42);
      this.roomBox.max.set(room.halfW - 0.42, room.height - 0.2, room.halfL - 0.42);
      this.localRay.origin.copy(this.focus).applyMatrix4(room.inverse);
      this.roomBox.clampPoint(this.localRay.origin, this.localRay.origin);
      this.rotation.extractRotation(room.inverse);
      this.localRay.direction.copy(this.ray.direction).applyMatrix4(this.rotation);
      const exit = this.localRay.intersectBox(this.roomBox, this.hit);
      const inside = exit ? this.hit.distanceTo(this.localRay.origin) - 0.1 : MIN_INDOORS;
      return THREE.MathUtils.clamp(inside, MIN_INDOORS, this.distance);
    }
    let nearest = this.distance;
    for (const box of this.occluders) {
      if (box.containsPoint(this.focus)) continue;
      if (this.ray.intersectBox(box, this.hit)) {
        nearest = Math.min(nearest, this.hit.distanceTo(this.focus) - 0.3);
      }
    }
    return Math.max(MIN_DISTANCE, nearest);
  }

  private apply() {
    const direction = this.direction(new THREE.Vector3());
    this.camera.position.copy(this.focus).addScaledVector(direction, this.current);
    // Never below the ground.
    this.camera.position.y = Math.max(this.camera.position.y, 0.4);
    this.camera.lookAt(this.focus);
  }

  dispose() {
    this.release();
    this.element.removeEventListener('pointerdown', this.down);
    this.element.removeEventListener('pointermove', this.dragMove);
    this.element.removeEventListener('pointerup', this.up);
    this.element.removeEventListener('pointercancel', this.up);
    this.element.removeEventListener('wheel', this.wheel);
    document.removeEventListener('mousemove', this.mouseMove);
    document.removeEventListener('pointerlockchange', this.lockChange);
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
  }
}
