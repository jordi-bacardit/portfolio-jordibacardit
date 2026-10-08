// Input for the village. Keyboard: WASD or arrows to move, Shift to walk (the mouse looks around).
// Touch: a virtual stick on the left of the screen (a small push walks, a bigger one runs).
// Input is ignored while `isBlocked()` (a panel is open, or the game hasn't started), so keys keep
// working normally in the HTML panels.

const keys = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  walk: ['ShiftLeft', 'ShiftRight'],
};

const handled = new Set(Object.values(keys).flat());

export class Keyboard {
  private pressed = new Set<string>();

  constructor(private isBlocked: () => boolean) {
    window.addEventListener('keydown', this.down);
    window.addEventListener('keyup', this.up);
    window.addEventListener('blur', this.clear);
  }

  private down = (event: KeyboardEvent) => {
    if (this.isBlocked() || event.altKey || event.ctrlKey || event.metaKey) return;
    if (!handled.has(event.code)) return;
    // Arrows would scroll or move focus; while walking they only steer.
    if (event.code.startsWith('Arrow')) event.preventDefault();
    this.pressed.add(event.code);
  };

  private up = (event: KeyboardEvent) => {
    this.pressed.delete(event.code);
  };

  /** Forgets held keys, e.g. when a panel opens or the window loses focus. */
  clear = () => {
    this.pressed.clear();
  };

  private held(action: keyof typeof keys) {
    return keys[action].some((code) => this.pressed.has(code));
  }

  /** Movement intent: x to the right, z forward, each -1..1. */
  move() {
    return {
      x: Number(this.held('right')) - Number(this.held('left')),
      z: Number(this.held('forward')) - Number(this.held('back')),
    };
  }

  walking() {
    return this.held('walk');
  }

  dispose() {
    window.removeEventListener('keydown', this.down);
    window.removeEventListener('keyup', this.up);
    window.removeEventListener('blur', this.clear);
  }
}

/** How far (px) the thumb can push the stick. */
const STICK_REACH = 56;

/**
 * A virtual stick: the stick appears where the thumb lands in `zone` and follows it. `zone` holds
 * `[data-stick-base]`, which holds `[data-stick-knob]`.
 */
export class Joystick {
  private id: number | null = null;
  private originX = 0;
  private originY = 0;
  private vector = { x: 0, z: 0 };
  private base: HTMLElement | null;
  private knob: HTMLElement | null;

  constructor(
    private zone: HTMLElement,
    private isBlocked: () => boolean,
  ) {
    this.base = zone.querySelector('[data-stick-base]');
    this.knob = zone.querySelector('[data-stick-knob]');
    zone.addEventListener('pointerdown', this.down);
    zone.addEventListener('pointermove', this.drag);
    zone.addEventListener('pointerup', this.up);
    zone.addEventListener('pointercancel', this.up);
  }

  private down = (event: PointerEvent) => {
    if (this.id !== null || this.isBlocked()) return;
    event.preventDefault();
    this.id = event.pointerId;
    try {
      // Keeps the thumb's moves coming even if it slides off the zone.
      this.zone.setPointerCapture(event.pointerId);
    } catch {}
    const bounds = this.zone.getBoundingClientRect();
    this.originX = event.clientX;
    this.originY = event.clientY;
    this.base?.style.setProperty('--x', `${event.clientX - bounds.left}px`);
    this.base?.style.setProperty('--y', `${event.clientY - bounds.top}px`);
    this.zone.classList.add('is-active');
  };

  private drag = (event: PointerEvent) => {
    if (event.pointerId !== this.id) return;
    let dx = event.clientX - this.originX;
    let dy = event.clientY - this.originY;
    const length = Math.hypot(dx, dy);
    if (length > STICK_REACH) {
      dx *= STICK_REACH / length;
      dy *= STICK_REACH / length;
    }
    this.vector.x = dx / STICK_REACH;
    this.vector.z = -dy / STICK_REACH;
    this.knob?.style.setProperty('transform', `translate(${dx}px, ${dy}px)`);
  };

  private up = (event: PointerEvent) => {
    if (event.pointerId !== this.id) return;
    this.clear();
  };

  /** Lets go of the stick, e.g. when a panel opens. */
  clear = () => {
    this.id = null;
    this.vector.x = 0;
    this.vector.z = 0;
    this.knob?.style.removeProperty('transform');
    this.zone.classList.remove('is-active');
  };

  /** Movement intent, as Keyboard.move(); a light push (under a fifth of the reach) is ignored. */
  move() {
    return Math.hypot(this.vector.x, this.vector.z) < 0.2 ? { x: 0, z: 0 } : this.vector;
  }

  /** A small push walks; pushing further runs. */
  walking() {
    return Math.hypot(this.vector.x, this.vector.z) < 0.65;
  }

  dispose() {
    this.zone.removeEventListener('pointerdown', this.down);
    this.zone.removeEventListener('pointermove', this.drag);
    this.zone.removeEventListener('pointerup', this.up);
    this.zone.removeEventListener('pointercancel', this.up);
  }
}
