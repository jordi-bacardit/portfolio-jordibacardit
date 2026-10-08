// Builds src/assets/play/ranger-blue.webp, the adventurer's colours: the ranger's texture from
// Quaternius' Modular Character Outfits - Fantasy (CC0, Textures/Ranger/T_Ranger_BaseColor.png)
// with its green cloth dyed a dark blue; the leather and the metal keep their colours.
// Not part of the site build: run it by hand. Needs sharp in a temporary folder.
// Usage: node build-play-ranger-blue.mjs <T_Ranger_BaseColor.png> <out dir>
import path from 'node:path';
import sharp from 'sharp';

const [source, out] = process.argv.slice(2);
const { data, info } = await sharp(source).resize(1024, 1024).removeAlpha().raw().toBuffer({ resolveWithObject: true });

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// The dye: hue 218° (a dark blue), a little less saturated and darker than the green it replaces.
const HUE = 218;
for (let i = 0; i < data.length; i += 3) {
  const r = data[i] / 255;
  const g = data[i + 1] / 255;
  const b = data[i + 2] / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  if (chroma < 0.04) continue; // greys: the metal and the stitching
  let hue = max === r ? ((g - b) / chroma) % 6 : max === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4;
  hue = (hue * 60 + 360) % 360;
  // Only the greens, fading in and out so the edges between cloth and leather stay soft.
  const amount = smoothstep(62, 82, hue) * (1 - smoothstep(165, 185, hue));
  if (amount === 0) continue;
  const value = max * 0.78;
  const saturation = (chroma / max) * 0.8;
  const c = value * saturation;
  const x = c * (1 - Math.abs(((HUE / 60) % 2) - 1));
  const m = value - c;
  // 218° lies between 180° and 240°: (0, x, c).
  const dyed = [m, x + m, c + m];
  for (let k = 0; k < 3; k++) data[i + k] = Math.round((data[i + k] / 255) * (1 - amount) * 255 + dyed[k] * amount * 255);
}
await sharp(data, { raw: info }).webp({ quality: 85 }).toFile(path.join(out, 'ranger-blue.webp'));
console.log('ranger-blue.webp written');
