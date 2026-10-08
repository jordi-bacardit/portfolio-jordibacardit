// The village's sound: recordings from CC0 packs (listed in src/data/credits.ts), downloaded only
// when the visitor turns the sound on. A lute tune outdoors and a tavern tune in the tavern;
// crickets and wind outside; fires that crackle louder as you get close; the crowd in the tavern;
// the smith's hammer and the woodcutter's axe in time with their animations; pages turning in the
// library; a dog and a night bird somewhere off in the village; footsteps as each foot lands, that
// change with the ground. Sounds from another space (a room when you're outside, the street when
// you're in) come through muffled.
import * as THREE from 'three';
import type { Room } from './house';
import type { Beat } from './npcs';

// Every file in the folder, by URL (fetched only when the sound is turned on; never inlined into
// the script, however small).
const files = import.meta.glob<string>('../../assets/play/sounds/*.mp3', { query: '?no-inline', import: 'default', eager: true });

export type Ground = 'stone' | 'earth' | 'grass' | 'wood';

/** Footsteps by ground: the recordings, how many variants, and how bright they stay (low-pass). */
const steps: Record<Ground, { name: string; count: number; cutoff: number; level: number }> = {
  stone: { name: 'step-boot', count: 10, cutoff: 5200, level: 0.85 },
  earth: { name: 'step-boot', count: 10, cutoff: 1500, level: 0.9 },
  grass: { name: 'step-grass', count: 5, cutoff: 6000, level: 0.55 },
  wood: { name: 'step-wood', count: 5, cutoff: 6000, level: 0.8 },
};

/** A sound that stays in one place. */
export interface Emitter {
  sound: 'fire' | 'pages' | 'tavern';
  position: THREE.Vector3;
  room: Room | null;
}

export interface Listening {
  /** Where the camera is and where it looks (the listener). */
  camera: THREE.Camera;
  /** The room the adventurer is in, if any. */
  room: Room | null;
  /** Feet that touched the ground this frame (-1 left, 1 right), what they stepped on, and whether running. */
  steps: (-1 | 1)[];
  ground: Ground;
  running: boolean;
  /** Sounds made by people's work this frame. */
  beats: Beat[];
}

interface Loop {
  emitter?: Emitter;
  gain: GainNode;
  filter: BiquadFilterNode;
  level: number;
  next: number;
  /** The muffling last scheduled on it: it's only scheduled again when it changes. */
  heard?: string;
}

export class Ambience {
  private context: AudioContext | null = null;
  private master!: GainNode;
  private buffers = new Map<string, AudioBuffer>();
  private loading: Promise<void> | null = null;
  private village?: Loop;
  private nature: Loop[] = [];
  private placed: Loop[] = [];
  private lastStep = -1;
  private nextCall = 0;
  private on = false;
  private forward = new THREE.Vector3();

  constructor(private emitters: Emitter[]) {}

  get enabled() {
    return this.on;
  }

  /** Turns the sound on (call from a click or key press: browsers need one to start audio). */
  enable() {
    if (!this.context) this.build();
    const context = this.context!;
    void context.resume();
    this.on = true;
    this.master.gain.cancelScheduledValues(context.currentTime);
    this.master.gain.setTargetAtTime(1, context.currentTime, 0.5);
    this.loading ??= this.load().then(() => this.start());
  }

  disable() {
    if (!this.context) return;
    this.on = false;
    const context = this.context;
    this.master.gain.cancelScheduledValues(context.currentTime);
    this.master.gain.setTargetAtTime(0, context.currentTime, 0.1);
    window.setTimeout(() => {
      if (!this.on) void context.suspend();
    }, 600);
  }

  private build() {
    const context = new AudioContext();
    this.context = context;
    this.master = context.createGain();
    this.master.gain.value = 0;
    this.master.connect(context.destination);
  }

  private async load() {
    const context = this.context!;
    await Promise.all(
      Object.entries(files).map(async ([path, file]) => {
        const name = path.split('/').pop()!.replace('.mp3', '');
        try {
          const response = await fetch(file);
          this.buffers.set(name, await context.decodeAudioData(await response.arrayBuffer()));
        } catch {
          // A missing sound only leaves a silence.
        }
      }),
    );
  }

  /** A looping sound through a gain and a low-pass filter (opened up, or closed to muffle it). */
  private loop(name: string, level: number, emitter?: Emitter): Loop | undefined {
    const context = this.context!;
    const buffer = this.buffers.get(name);
    if (!buffer) return undefined;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    // MP3 pads the start and the end with a few milliseconds of silence.
    source.loopStart = 0.06;
    source.loopEnd = buffer.duration - 0.06;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 20000;
    const gain = context.createGain();
    gain.gain.value = 0;
    let out: AudioNode = gain;
    if (emitter) {
      const panner = this.panner(emitter.position, emitter.sound === 'tavern' ? 5 : 1.5);
      gain.connect(panner);
      out = panner;
    }
    source.connect(filter).connect(gain);
    out.connect(this.master);
    source.start(0, Math.random() * buffer.duration * 0.5);
    return { emitter, gain, filter, level, next: 0 };
  }

  private panner(position: THREE.Vector3, near: number) {
    const panner = this.context!.createPanner();
    panner.panningModel = 'equalpower';
    panner.distanceModel = 'inverse';
    panner.refDistance = near;
    panner.rolloffFactor = 1.4;
    panner.maxDistance = 60;
    panner.positionX.value = position.x;
    panner.positionY.value = position.y + 1;
    panner.positionZ.value = position.z;
    return panner;
  }

  /** A one-shot, placed in the world (or at the listener when `position` is null). */
  private play(name: string, level: number, position: THREE.Vector3 | null, muffled = false, rate = 1) {
    const context = this.context!;
    const buffer = this.buffers.get(name);
    if (!buffer) return;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const gain = context.createGain();
    gain.gain.value = muffled ? level * 0.35 : level;
    let node: AudioNode = source;
    if (muffled) {
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 700;
      node = source.connect(filter);
    }
    node.connect(gain);
    if (position) gain.connect(this.panner(position, 2)).connect(this.master);
    else gain.connect(this.master);
    source.start();
  }

  private start() {
    this.village = this.loop('music-village', 0.16);
    this.nature = [this.loop('crickets', 0.32), this.loop('wind', 0.14)].filter((loop): loop is Loop => Boolean(loop));
    for (const emitter of this.emitters) {
      if (emitter.sound === 'fire') {
        const loop = this.loop('fire', 0.9, emitter);
        if (loop) this.placed.push(loop);
      } else if (emitter.sound === 'tavern') {
        for (const [name, level] of [['music-tavern', 0.3], ['crowd', 0.2]] as const) {
          const loop = this.loop(name, level, emitter);
          if (loop) this.placed.push(loop);
        }
      } else {
        // Pages are one-shots, timed in update().
        this.placed.push({ emitter, gain: this.context!.createGain(), filter: this.context!.createBiquadFilter(), level: 0.5, next: 0 });
      }
    }
  }

  update(state: Listening) {
    const context = this.context;
    if (!context || !this.on || !this.village) return;
    const now = context.currentTime;
    const smooth = 0.4;

    // The listener is the camera.
    const { camera, room } = state;
    const listener = context.listener;
    camera.getWorldDirection(this.forward);
    if (listener.positionX) {
      listener.positionX.value = camera.position.x;
      listener.positionY.value = camera.position.y;
      listener.positionZ.value = camera.position.z;
      listener.forwardX.value = this.forward.x;
      listener.forwardY.value = this.forward.y;
      listener.forwardZ.value = this.forward.z;
    } else {
      listener.setPosition(camera.position.x, camera.position.y, camera.position.z);
      listener.setOrientation(this.forward.x, this.forward.y, this.forward.z, 0, 1, 0);
    }

    // Outdoors the tune and the night; indoors they're faint through the walls.
    const inTavern = room?.name === 'The Rusty Tankard';
    const muffle = (loop: Loop, inside: boolean, silent = false) => {
      const heard = `${inside} ${silent}`;
      if (loop.heard === heard) return;
      loop.heard = heard;
      loop.filter.frequency.setTargetAtTime(inside ? 20000 : 650, now, smooth);
      loop.gain.gain.setTargetAtTime(silent ? 0 : loop.level * (inside ? 1 : 0.3), now, smooth);
    };
    // In the tavern its own tune plays instead of the village's.
    muffle(this.village, !room, inTavern);
    for (const loop of this.nature) muffle(loop, !room);
    for (const loop of this.placed) {
      if (!loop.emitter) continue;
      const here = loop.emitter.room === room;
      if (loop.emitter.sound === 'pages') {
        if (here && now > loop.next) {
          this.play(`page-${1 + Math.floor(Math.random() * 3)}`, 0.5, loop.emitter.position);
          loop.next = now + 5 + Math.random() * 9;
        }
        continue;
      }
      muffle(loop, here);
    }

    // Work in time with the animations.
    for (const beat of state.beats) {
      const muffled = beat.room !== room;
      if (beat.sound === 'hammer') this.play('hammer', 0.8, beat.position, muffled, 0.95 + Math.random() * 0.1);
      else this.play('chop', 0.9, beat.position, muffled, 0.9 + Math.random() * 0.15);
    }

    // Now and then, a dog or a night bird somewhere out in the village.
    if (now > this.nextCall) {
      if (this.nextCall > 0) {
        const angle = Math.random() * Math.PI * 2;
        const spot = new THREE.Vector3(camera.position.x + Math.cos(angle) * 30, 2, camera.position.z + Math.sin(angle) * 30);
        this.play(Math.random() < 0.4 ? 'dog' : 'owl', 0.7, spot, Boolean(room));
      }
      this.nextCall = now + 18 + Math.random() * 30;
    }

    // Footsteps, as each foot lands: a different take every time (never the same twice running),
    // a touch of pitch, a little to the left or right.
    for (const side of state.steps) {
      const kind = steps[state.ground];
      let take = Math.floor(Math.random() * kind.count);
      if (take === this.lastStep) take = (take + 1) % kind.count;
      this.lastStep = take;
      this.step(`${kind.name}-${take}`, kind.level * (state.running ? 0.38 : 0.26), kind.cutoff, side * 0.12, 0.92 + Math.random() * 0.14);
    }
  }

  /** A footstep near the listener: softened, slightly panned. */
  private step(name: string, level: number, cutoff: number, pan: number, rate: number) {
    const context = this.context!;
    const buffer = this.buffers.get(name);
    if (!buffer) return;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = context.createGain();
    gain.gain.value = level;
    const panner = context.createStereoPanner();
    panner.pan.value = pan;
    source.connect(filter).connect(gain).connect(panner).connect(this.master);
    source.start();
  }

  dispose() {
    void this.context?.close();
    this.context = null;
  }
}
