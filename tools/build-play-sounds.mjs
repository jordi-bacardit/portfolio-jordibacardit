// Builds src/assets/play/sounds/*.mp3 for the village from CC0 packs (credited in
// src/data/credits.ts): downloads them, cuts and converts them to small MP3s with even loudness.
// Not part of the site build: run it by hand. Needs, in a temporary folder: ffmpeg-static (v5).
// Usage: node build-play-sounds.mjs <work dir> <out dir>
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import ffmpeg from 'ffmpeg-static';

const [work, out] = process.argv.slice(2);
mkdirSync(work, { recursive: true });
mkdirSync(out, { recursive: true });

const oga = 'https://opengameart.org/sites/default/files/';
const downloads = {
  'Loop_The_Bards_Tale.wav': oga + 'Loop_The_Bards_Tale.wav', // RandomMind, "Medieval: The Bard's Tale"
  'Loop_The_Old_Tower_Inn.wav': oga + 'Loop_The_Old_Tower_Inn.wav', // RandomMind, "Medieval: The Old Tower Inn"
  'crickets_1.mp3': oga + 'crickets_1.mp3', // Wolfgang_, "Crickets Ambient Noise - loopable"
  'fire.wav': oga + 'fire.wav', // PagDev, "Fireplace Sound Loop"
  'wind_woosh_loop.ogg': oga + 'wind%20woosh%20loop.ogg', // SketchMan3, "Wind Woosh Loop"
  'crowd_shouting.ogg': oga + 'crowd_shouting.ogg', // StarNinjas, "Crowd Shouting/Speaking Ambience"
  'blacksmithhammer.wav': oga + 'blacksmithhammer.wav', // VishwaJai, "Blacksmith's Hammer"
  'dog_barking_mono.wav': oga + 'dog_barking_mono.wav', // HaelDB, "Dog Barking"
  'birdNight.ogg': oga + 'birdNight.ogg', // Aj_, "Bird, Cricket, Frog and Mosquito Sounds"
  'rpg.zip': 'https://kenney.nl/media/pages/assets/rpg-audio/8e99002d76-1677590336/kenney_rpg-audio.zip',
  'impact.zip': 'https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip',
};
for (const [file, url] of Object.entries(downloads)) {
  const target = path.join(work, file);
  if (existsSync(target)) continue;
  const response = await fetch(url);
  writeFileSync(target, Buffer.from(await response.arrayBuffer()));
}
for (const zip of ['rpg', 'impact']) {
  execFileSync('tar', ['-xf', path.join(work, `${zip}.zip`), '-C', work]);
}

// [source, name, extra input options, loudness (LUFS), channels, bitrate]
const sounds = [
  ['Loop_The_Bards_Tale.wav', 'music-village', [], -20, 2, '112k'],
  ['Loop_The_Old_Tower_Inn.wav', 'music-tavern', [], -20, 2, '112k'],
  ['crickets_1.mp3', 'crickets', [], -24, 1, '64k'],
  ['fire.wav', 'fire', ['-t', '16'], -22, 1, '64k'],
  ['wind_woosh_loop.ogg', 'wind', [], -26, 1, '64k'],
  ['crowd_shouting.ogg', 'crowd', [], -24, 1, '64k'],
  ['blacksmithhammer.wav', 'hammer', [], -16, 1, '64k'],
  ['Audio/chop.ogg', 'chop', [], -16, 1, '64k'],
  ['dog_barking_mono.wav', 'dog', [], -20, 1, '64k'],
  ['birdNight.ogg', 'owl', [], -22, 1, '64k'],
  ...[1, 2, 3].map((i) => [`Audio/bookFlip${i}.ogg`, `page-${i}`, [], -20, 1, '64k']),
  // Boots on stone and earth (RPG Audio), grass and boards (Impact Sounds).
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => [`Audio/footstep0${i}.ogg`, `step-boot-${i}`, [], -20, 1, '64k']),
  ...['grass', 'wood'].flatMap((surface) =>
    [0, 1, 2, 3, 4].map((i) => [`Audio/footstep_${surface}_00${i}.ogg`, `step-${surface}-${i}`, [], -20, 1, '64k']),
  ),
];
for (const [source, name, options, loudness, channels, bitrate] of sounds) {
  execFileSync(ffmpeg, [
    '-loglevel', 'error', '-y', '-i', path.join(work, source), ...options,
    '-af', `loudnorm=I=${loudness}:TP=-2:LRA=11`, '-ac', String(channels), '-ar', '44100', '-b:a', bitrate,
    path.join(out, `${name}.mp3`),
  ]);
}
console.log(`${sounds.length} sounds written to ${out}`);
