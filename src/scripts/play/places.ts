// Where the portfolio lives in the village. Every project hangs as a framed picture in the Hall of
// Works (its real cover, or a parchment with its title while it has none); the About is the
// portrait and the lectern in the library; the skills are a board in the smithy; the contact
// details are a note on the tavern's counter; the quest board stands on the square. Signposts and
// a sign over every door show the way. Walking up to any of them and pressing E (or tapping the
// prompt) opens its panel. Everything comes from the project files and site data, so a new
// project gets its own frame. Text is painted on canvases with the site's display font.
import * as THREE from 'three';
import type { Box } from './collisions';
import type { Room } from './house';
import { at } from './kit';
import { questBoard, signposts } from './layout';
import { palette } from './palette';

/** What the page passes in (see play.astro): only facts from the project files and site data. */
export interface VillageContent {
  name: string;
  role: string;
  portrait: string | null;
  projects: {
    /** The panel it opens (e.g. "project-finn-adventure"). */
    panel: string;
    title: string;
    status?: string;
    summary: string;
    cover?: string;
  }[];
  tools: { category: string; items: string[] }[];
  contact: { lookingFor: string; email: string | null; linkedin: string | null; github: string | null; based: string };
}

/** Something you can use: walking up to it shows `label`; using it opens `panel`. */
export interface Point {
  position: THREE.Vector3;
  room: Room | null;
  label: string;
  panel: string;
}

const L = Math.PI / 2;
const R = -Math.PI / 2;

const font = () => getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim() || 'sans-serif';

/** A canvas texture painted by `draw`. */
function painted(width: number, height: number, draw: (context: CanvasRenderingContext2D, w: number, h: number) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (context) draw(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Weathered planks: the base colour, darker grain lines and darker edges. */
function wood(context: CanvasRenderingContext2D, w: number, h: number) {
  context.fillStyle = palette.signWood;
  context.fillRect(0, 0, w, h);
  context.strokeStyle = palette.signGrain;
  context.globalAlpha = 0.55;
  for (let i = 0; i < h / 7; i++) {
    const y = Math.random() * h;
    context.lineWidth = 1 + Math.random() * 2;
    context.beginPath();
    context.moveTo(0, y);
    context.bezierCurveTo(w * 0.3, y + (Math.random() - 0.5) * 8, w * 0.7, y + (Math.random() - 0.5) * 8, w, y + (Math.random() - 0.5) * 6);
    context.stroke();
  }
  context.globalAlpha = 1;
  const edge = context.createLinearGradient(0, 0, 0, h);
  edge.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
  edge.addColorStop(0.12, 'rgba(0, 0, 0, 0)');
  edge.addColorStop(0.88, 'rgba(0, 0, 0, 0)');
  edge.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  context.fillStyle = edge;
  context.fillRect(0, 0, w, h);
}

/** Old paper with darker edges. */
function parchment(context: CanvasRenderingContext2D, w: number, h: number) {
  context.fillStyle = palette.parchment;
  context.fillRect(0, 0, w, h);
  const burn = context.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  burn.addColorStop(0, 'rgba(0, 0, 0, 0)');
  burn.addColorStop(1, palette.parchmentEdge);
  context.fillStyle = burn;
  context.fillRect(0, 0, w, h);
}

/** Sets the largest font size up to `size` at which `text` fits in `maxWidth`. */
function fit(context: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, weight = 600) {
  let px = size;
  do {
    context.font = `${weight} ${px}px ${font()}`;
    px -= 2;
  } while (context.measureText(text).width > maxWidth && px > 10);
  // The size it settled on.
  return px + 2;
}

/** Breaks `text` into lines no wider than `maxWidth` (the font must be set). */
function wrap(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Text painted in cream on wood, with a dark shadow so it reads as carved and painted. */
function paintText(context: CanvasRenderingContext2D, text: string, x: number, y: number) {
  context.fillStyle = 'rgba(0, 0, 0, 0.6)';
  context.fillText(text, x + 2, y + 3);
  context.fillStyle = palette.signPaint;
  context.fillText(text, x, y);
}

const materials = {
  wood: new THREE.MeshStandardMaterial({ color: palette.frameWood, roughness: 0.9 }),
  iron: new THREE.MeshStandardMaterial({ color: palette.iron, roughness: 0.5, metalness: 0.6 }),
};

/** A wooden board with `lines` painted on both faces (the first line large). */
function board(lines: string[], width: number, height: number) {
  const scale = 512 / width;
  const texture = painted(512, Math.round(height * scale), (context, w, h) => {
    wood(context, w, h);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const sizes = lines.map((_, i) => (i === 0 ? h * (lines.length > 1 ? 0.42 : 0.55) : h * 0.24));
    const total = sizes.reduce((sum, size) => sum + size * 1.1, 0);
    let y = (h - total) / 2;
    lines.forEach((line, i) => {
      fit(context, line.toUpperCase(), w * 0.88, sizes[i], i === 0 ? 700 : 500);
      paintText(context, line.toUpperCase(), w / 2, y + sizes[i] * 0.55);
      y += sizes[i] * 1.1;
    });
  });
  const face = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 });
  const side = new THREE.MeshStandardMaterial({ color: palette.signWood, roughness: 0.9 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.045), [side, side, side, side, face, face]);
  mesh.castShadow = true;
  return mesh;
}

/** A picture in a wooden frame, facing +z; `image` fills it (cropped to cover, like CSS). */
function framed(image: THREE.Texture | null, width: number, height: number, fallback?: THREE.Texture) {
  const group = new THREE.Group();
  const border = 0.07;
  const parts: [number, number, number, number][] = [
    [0, height / 2 + border / 2, width + border * 2, border],
    [0, -height / 2 - border / 2, width + border * 2, border],
    [-width / 2 - border / 2, 0, border, height],
    [width / 2 + border / 2, 0, border, height],
  ];
  for (const [x, y, w, h] of parts) {
    const piece = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.07), materials.wood);
    piece.position.set(x, y, 0.035);
    piece.castShadow = true;
    group.add(piece);
  }
  const map = image ?? fallback ?? null;
  // Slightly self-lit so the picture reads in the candlelight.
  const picture = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.85 }),
  );
  picture.position.z = 0.03;
  const backing = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ color: 0x0b0908 }));
  backing.position.z = 0.025;
  group.add(backing, picture);
  return group;
}

/** Loads an image as a texture cropped to fill a `width` × `height` frame. */
function coverTexture(url: string, width: number, height: number, anchor: 'centre' | 'top' = 'centre') {
  const texture = new THREE.TextureLoader().load(url, (loaded) => {
    const image = loaded.image as { width: number; height: number };
    const frame = width / height;
    const picture = image.width / image.height;
    if (picture > frame) {
      loaded.repeat.set(frame / picture, 1);
      loaded.offset.set((1 - frame / picture) / 2, 0);
    } else {
      loaded.repeat.set(1, picture / frame);
      loaded.offset.set(0, anchor === 'top' ? 1 - picture / frame : (1 - picture / frame) / 2);
    }
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** A parchment standing in for a project without a cover yet: its title, status and summary. */
function parchmentFor(project: VillageContent['projects'][number], width: number, height: number) {
  const scale = 1024 / width;
  return painted(1024, Math.round(height * scale), (context, w, h) => {
    parchment(context, w, h);
    context.fillStyle = palette.ink;
    context.textAlign = 'center';
    context.textBaseline = 'top';
    fit(context, project.title.toUpperCase(), w * 0.84, h * 0.16, 700);
    context.fillText(project.title.toUpperCase(), w / 2, h * 0.16);
    let y = h * 0.36;
    if (project.status) {
      context.font = `500 ${Math.round(h * 0.065)}px ${font()}`;
      context.fillText(project.status.toUpperCase(), w / 2, y);
      y += h * 0.12;
    }
    context.font = `400 ${Math.round(h * 0.07)}px ${font()}`;
    for (const line of wrap(context, project.summary, w * 0.78).slice(0, 4)) {
      context.fillText(line, w / 2, y);
      y += h * 0.095;
    }
  });
}

/** Places `object` in a room at local (x, y, z), turned `rot`. */
function inRoom(room: Room, object: THREE.Object3D, x: number, y: number, z: number, rot: number) {
  object.applyMatrix4(new THREE.Matrix4().multiplyMatrices(room.frame, at(x, y, z, rot)));
  return object;
}

/** World position of a room's local point, on the floor. */
const floorPoint = (room: Room, x: number, z: number) => new THREE.Vector3(x, 0, z).applyMatrix4(room.frame);

/**
 * The frames' places in the Hall of Works, in the order projects fill them: [x, y, z, rotation,
 * width, height] (16:9). The last two hang on the left wall above the cabinets, high enough for
 * their plaques to clear what stands on them. A project beyond these gets no frame (a warning in
 * development says so): add a slot here.
 */
const hallSlots: [number, number, number, number, number, number][] = [
  [0, 1.75, -3.66, 0, 2.4, 1.35],
  [3.66, 1.7, -1.6, R, 1.6, 0.9],
  [3.66, 1.7, 1.4, R, 1.6, 0.9],
  [-2.6, 1.7, -3.66, 0, 1.2, 0.675],
  [2.6, 1.7, -3.66, 0, 1.2, 0.675],
  [-3.66, 2.15, -2.9, L, 1.2, 0.675],
  [-3.66, 2.15, 2.7, L, 1.2, 0.675],
];

export interface Places {
  points: Point[];
  colliders: Box[];
}

export function buildPlaces(scene: THREE.Scene, rooms: Room[], content: VillageContent): Places {
  const points: Point[] = [];
  const colliders: Box[] = [];
  const room = (name: string) => rooms.find((candidate) => candidate.name === name);
  const group = new THREE.Group();

  // The Hall of Works: one frame per project, in the order of the Work page; a plaque under each.
  const hall = room('The Hall of Works');
  if (hall) {
    if (import.meta.env.DEV && content.projects.length > hallSlots.length) {
      console.warn(`The Hall of Works has ${hallSlots.length} frames for ${content.projects.length} projects: add slots in places.ts.`);
    }
    content.projects.slice(0, hallSlots.length).forEach((project, index) => {
      const [x, y, z, rot, w, h] = hallSlots[index];
      const image = project.cover ? coverTexture(project.cover, w, h) : null;
      group.add(inRoom(hall, framed(image, w, h, image ? undefined : parchmentFor(project, w, h)), x, y, z, rot));
      const plaque = board(project.status ? [project.title, project.status] : [project.title], Math.min(w, 1.4), 0.26);
      group.add(inRoom(hall, plaque, x, y - h / 2 - 0.3, z, rot));
      // Stand about 1.4 m in front of it to look.
      const out = new THREE.Vector3(Math.sin(rot), 0, Math.cos(rot));
      points.push({ position: floorPoint(hall, x + out.x * 1.4, z + out.z * 1.4), room: hall, label: `View ${project.title}`, panel: project.panel });
    });
  }

  // The library: the portrait on the left wall, a plaque with the name, and the lectern beside it.
  const library = room('The Old Library');
  if (library) {
    const w = 0.9;
    const h = 1.2;
    const image = content.portrait ? coverTexture(content.portrait, w, h, 'top') : null;
    group.add(inRoom(library, framed(image, w, h), -3.66, 1.75, 1.2, L));
    group.add(inRoom(library, board([content.name, content.role], 0.95, 0.26), -3.66, 0.95, 1.2, L));
    points.push({ position: floorPoint(library, -2.3, 1.7), room: library, label: `Read about ${content.name.split(' ')[0]}`, panel: 'about' });
  }

  // The smithy: the skills and tools on a board above the workbench.
  const smithy = room('The Smithy');
  if (smithy) {
    const w = 1.7;
    const h = 1.1;
    const texture = painted(1024, Math.round((1024 * h) / w), (context, cw, ch) => {
      wood(context, cw, ch);
      context.textBaseline = 'top';
      context.textAlign = 'left';
      fit(context, 'SKILLS AND TOOLS', cw * 0.9, ch * 0.11, 700);
      paintText(context, 'SKILLS AND TOOLS', cw * 0.05, ch * 0.06);
      let y = ch * 0.22;
      for (const { category, items } of content.tools) {
        context.font = `600 ${Math.round(ch * 0.05)}px ${font()}`;
        paintText(context, category.toUpperCase(), cw * 0.05, y);
        y += ch * 0.065;
        context.font = `400 ${Math.round(ch * 0.055)}px ${font()}`;
        for (const line of wrap(context, items.join(', '), cw * 0.9)) {
          paintText(context, line, cw * 0.05, y);
          y += ch * 0.065;
        }
        y += ch * 0.025;
      }
    });
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, 0.04),
      [materials.wood, materials.wood, materials.wood, materials.wood, new THREE.MeshStandardMaterial({ map: texture, emissiveMap: texture, emissive: 0xffffff, emissiveIntensity: 0.15, roughness: 0.85 }), materials.wood],
    );
    // Between the two windows of the left wall.
    group.add(inRoom(smithy, sign, -2.66, 1.95, 0, L));
    points.push({ position: floorPoint(smithy, -1.2, 0), room: smithy, label: 'See skills and tools', panel: 'skills' });
  }

  // The tavern, where people meet: a contact board on the wall by the fire, and a note on the
  // counter.
  const tavern = room('The Rusty Tankard');
  if (tavern) {
    const label = `Contact ${content.name.split(' ')[0]}`;
    const { lookingFor, email, linkedin, github, based } = content.contact;
    const w = 1.5;
    const h = 1.05;
    const bare = (link: string) => link.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    const texture = painted(1024, Math.round((1024 * h) / w), (context, cw, ch) => {
      wood(context, cw, ch);
      context.textBaseline = 'top';
      context.textAlign = 'left';
      fit(context, label.toUpperCase(), cw * 0.9, ch * 0.13, 700);
      paintText(context, label.toUpperCase(), cw * 0.06, ch * 0.07);
      let y = ch * 0.27;
      context.font = `500 ${Math.round(ch * 0.058)}px ${font()}`;
      for (const line of wrap(context, `${lookingFor}.`, cw * 0.88)) {
        paintText(context, line, cw * 0.06, y);
        y += ch * 0.075;
      }
      y += ch * 0.04;
      const rows = [
        email && ['Email', email],
        linkedin && ['LinkedIn', bare(linkedin)],
        github && ['GitHub', bare(github)],
      ].filter((row): row is string[] => Boolean(row));
      for (const [name, value] of rows) {
        context.font = `600 ${Math.round(ch * 0.05)}px ${font()}`;
        paintText(context, name.toUpperCase(), cw * 0.06, y);
        context.font = `400 ${Math.round(ch * 0.058)}px ${font()}`;
        paintText(context, value, cw * 0.3, y - ch * 0.006);
        y += ch * 0.09;
      }
      context.font = `400 ${Math.round(ch * 0.05)}px ${font()}`;
      paintText(context, based, cw * 0.06, y + ch * 0.02);
    });
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, 0.04),
      [materials.wood, materials.wood, materials.wood, materials.wood, new THREE.MeshStandardMaterial({ map: texture, emissiveMap: texture, emissive: 0xffffff, emissiveIntensity: 0.15, roughness: 0.85 }), materials.wood],
    );
    group.add(inRoom(tavern, sign, -3.66, 1.8, 1.6, L));
    points.push({ position: floorPoint(tavern, -1.9, 2.5), room: tavern, label, panel: 'contact' });
    points.push({ position: floorPoint(tavern, 0.5, -1.0), room: tavern, label, panel: 'contact' });
  }

  // A sign at every door you can walk through. On a one-storey building it sits flat over the
  // door (the roof's gable is right above); taller buildings hang it from a bracket beside the
  // door, above the open shutters of the ground floor and below the first floor's windows.
  for (const place of rooms) {
    if (place.storeys < 2) {
      // Wide enough for long names, never wider than the gap between the windows beside the door.
      const width = THREE.MathUtils.clamp(place.name.length * 0.066, 1.15, 1.6);
      group.add(inRoom(place, board([place.name], width, 0.34), place.doorX, 2.84, place.halfL + 0.12, 0));
      continue;
    }
    const sign = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.95), materials.iron);
    arm.position.set(0, 0, 0.47);
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.62), materials.iron);
    strut.position.set(0, -0.22, 0.25);
    strut.rotation.x = -0.75;
    const plank = board([place.name], 1.05, 0.36);
    plank.rotation.y = L;
    plank.position.set(0, -0.27, 0.55);
    for (const dz of [0.15, 0.95]) {
      const chain = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.1, 0.015), materials.iron);
      chain.position.set(0, -0.05, dz);
      sign.add(chain);
    }
    sign.add(arm, strut, plank);
    // Beside the door, on the side away from the middle (where balconies have their braces).
    const side = place.doorX >= 0 ? 0.95 : -0.95;
    group.add(inRoom(place, sign, place.doorX + side, 3.34, place.halfL + 0.09, 0));
  }

  // The quest board on the square: two posts, a little roof, and a note pinned for every place.
  {
    const stand = new THREE.Group();
    for (const side of [-1.05, 1.05]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.13, 2.5, 0.13), materials.wood);
      post.position.set(side, 1.25, 0);
      post.castShadow = true;
      stand.add(post);
    }
    for (const side of [-1, 1]) {
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 0.42), materials.wood);
      roof.position.set(0, 2.52, side * 0.17);
      roof.rotation.x = side * 0.45;
      roof.castShadow = true;
      stand.add(roof);
    }
    const notes = [
      ...content.projects.map((project) => project.title),
      'About',
      'Skills',
      'Contact',
    ];
    const texture = painted(1024, 620, (context, w, h) => {
      wood(context, w, h);
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      fit(context, 'QUEST BOARD', w * 0.8, h * 0.11, 700);
      paintText(context, 'QUEST BOARD', w / 2, h * 0.09);
      // Two rows of notes, with as many columns as they need (four at least).
      const columns = Math.max(4, Math.ceil(notes.length / 2));
      const cell = 0.96 / columns;
      const noteW = w * cell * 0.83;
      const noteH = h * 0.32;
      notes.forEach((title, i) => {
        const cx = w * (0.02 + ((i % columns) + 0.5) * cell);
        const cy = h * (0.37 + Math.floor(i / columns) * 0.4);
        context.save();
        context.translate(cx, cy);
        context.rotate((((i * 37) % 9) - 4) * 0.012);
        context.fillStyle = 'rgba(0, 0, 0, 0.35)';
        context.fillRect(-noteW / 2 + 4, -noteH / 2 + 6, noteW, noteH);
        context.fillStyle = palette.parchment;
        context.fillRect(-noteW / 2, -noteH / 2, noteW, noteH);
        context.fillStyle = palette.ink;
        // The type shrinks until the longest word fits the note (a word can't wrap).
        const text = title.toUpperCase();
        context.font = `700 ${Math.round(h * 0.045)}px ${font()}`;
        const longest = text.split(/\s+/).reduce((a, b) => (context.measureText(b).width > context.measureText(a).width ? b : a));
        const size = fit(context, longest, noteW * 0.84, Math.round(h * 0.045), 700);
        const lines = wrap(context, text, noteW * 0.84).slice(0, 4);
        lines.forEach((line, n) => context.fillText(line, 0, (n - (lines.length - 1) / 2) * size * 1.22));
        // A nail.
        context.fillStyle = '#1a1a1a';
        context.beginPath();
        context.arc(0, -noteH / 2 + 10, 5, 0, Math.PI * 2);
        context.fill();
        context.restore();
      });
    });
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 1.22, 0.06),
      [materials.wood, materials.wood, materials.wood, materials.wood, new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 }), materials.wood],
    );
    panel.position.y = 1.55;
    panel.castShadow = true;
    stand.add(panel);
    stand.position.set(questBoard.x, 0, questBoard.z);
    stand.rotation.y = questBoard.rot;
    group.add(stand);
    colliders.push({ x: questBoard.x, z: questBoard.z, halfX: 1.15, halfZ: 0.2, rot: questBoard.rot });
    const front = new THREE.Vector3(Math.sin(questBoard.rot), 0, Math.cos(questBoard.rot));
    points.push({
      position: new THREE.Vector3(questBoard.x, 0, questBoard.z).addScaledVector(front, 1.3),
      room: null,
      label: 'Read the quest board',
      panel: 'quests',
    });
  }

  // Signposts: an arm for each place, pointing at its door.
  const doorOf = (name: string) => {
    const place = room(name);
    return place ? floorPoint(place, place.doorX, place.halfL + 0.5) : null;
  };
  for (const post of signposts) {
    const sign = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.13, 2.7, 0.13), materials.wood);
    pole.position.y = 1.35;
    pole.castShadow = true;
    sign.add(pole);
    post.to.forEach((target, index) => {
      const [label, spot] = typeof target === 'string' ? [target, doorOf(target)] : [target[0], new THREE.Vector3(target[1], 0, target[2])];
      if (!spot) return;
      const yaw = Math.atan2(-(spot.z - post.z), spot.x - post.x);
      const arm = new THREE.Group();
      const length = THREE.MathUtils.clamp(label.length * 0.07, 1.0, 1.65);
      const plank = board([label], length, 0.22);
      plank.position.x = 0.08 + length / 2;
      const tip = new THREE.Mesh(
        new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(0, 0.11), new THREE.Vector2(0.16, 0), new THREE.Vector2(0, -0.11)]), { depth: 0.045, bevelEnabled: false }),
        new THREE.MeshStandardMaterial({ color: palette.signWood, roughness: 0.9 }),
      );
      tip.position.set(0.08 + length, 0, -0.0225);
      arm.add(plank, tip);
      arm.position.y = 2.4 - index * 0.3;
      arm.rotation.y = yaw;
      sign.add(arm);
    });
    sign.position.set(post.x, 0, post.z);
    group.add(sign);
    colliders.push({ x: post.x, z: post.z, halfX: 0.2, halfZ: 0.2, rot: 0 });
  }

  scene.add(group);
  return { points, colliders };
}
