// Firelight for the whole village with a fixed number of lights. Every flame (lanterns, torches,
// hearths, candles) is a source; each frame the few point lights in the scene go to the sources
// nearest the adventurer, fading out of one and into another so nothing pops. A fixed count means
// the shaders never recompile as you walk, and the GPU cost stays the same everywhere.
// Light doesn't pass walls here, so a room's sources only shine while you're in that room, and
// the street's only while you're outside.
import * as THREE from 'three';
import type { Room } from './house';

export interface LightSource {
  /** Where the flame is. Moving sources (a torch in a hand) update it every frame. */
  position: THREE.Vector3;
  color: THREE.ColorRepresentation;
  intensity: number;
  distance: number;
  /** The room it burns in, or null outside. */
  room: Room | null;
  /** How much it flickers, 0..1. */
  flicker?: number;
}

/** Cheap flicker noise in 0..1 from a few out-of-phase sines. */
export function flicker(t: number) {
  return 0.5 + 0.25 * Math.sin(t * 7.3) + 0.15 * Math.sin(t * 13.1 + 1.7) + 0.1 * Math.sin(t * 23.7);
}

interface Slot {
  light: THREE.PointLight;
  source: LightSource | null;
  /** Fade, 0..1. */
  level: number;
}

const FADE = 4;

export class LightPool {
  private slots: Slot[] = [];
  private sources: LightSource[] = [];
  private seeds = new Map<LightSource, number>();
  private ranked: { source: LightSource; distance: number }[] = [];

  constructor(scene: THREE.Scene, size: number) {
    for (let i = 0; i < size; i++) {
      const light = new THREE.PointLight(0xffffff, 0, 10, 2);
      scene.add(light);
      this.slots.push({ light, source: null, level: 0 });
    }
  }

  add(source: LightSource) {
    this.sources.push(source);
    this.seeds.set(source, this.sources.length * 2.3);
    return source;
  }

  update(dt: number, time: number, focus: THREE.Vector3, room: Room | null) {
    // The nearest sources that can light where the adventurer stands.
    this.ranked.length = 0;
    for (const source of this.sources) {
      if (source.room !== room) continue;
      this.ranked.push({ source, distance: source.position.distanceToSquared(focus) });
    }
    this.ranked.sort((a, b) => a.distance - b.distance);
    const wanted = new Set(this.ranked.slice(0, this.slots.length).map(({ source }) => source));

    // Sources that are wanted but not lit yet take the free slots (or ones that have faded out).
    const held = new Set(this.slots.map((slot) => slot.source).filter((source) => source && wanted.has(source)));
    const waiting = [...wanted].filter((source) => !held.has(source));
    const step = 1 - Math.exp(-dt * FADE);
    for (const slot of this.slots) {
      const leaving = slot.source !== null && !wanted.has(slot.source);
      if ((slot.source === null || (leaving && slot.level < 0.02)) && waiting.length) {
        slot.source = waiting.shift()!;
        slot.level = 0;
        slot.light.color.set(slot.source.color);
        slot.light.distance = slot.source.distance;
      }
      const source = slot.source;
      if (!source) continue;
      const goal = wanted.has(source) ? 1 : 0;
      slot.level += (goal - slot.level) * step;
      if (goal === 0 && slot.level < 0.01) {
        slot.level = 0;
        slot.source = null;
        slot.light.intensity = 0;
        continue;
      }
      slot.light.position.copy(source.position);
      const amount = source.flicker ?? 0.3;
      const f = flicker(time + this.seeds.get(source)!);
      slot.light.intensity = source.intensity * (1 - amount * 0.5 + amount * f) * slot.level;
    }
  }
}
