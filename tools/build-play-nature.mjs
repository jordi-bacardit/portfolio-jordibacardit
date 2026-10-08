// Builds src/assets/play/nature.glb from Quaternius' Stylized Nature MegaKit (CC0, Standard): the
// trees, bushes, ground cover and rocks the village uses, one scene per model, textures as WebP,
// geometry Meshopt-compressed. Not part of the site build: run it by hand.
// Needs, in a temporary folder: @gltf-transform/core, functions and extensions (v4), meshoptimizer
// and sharp.
// Usage: node build-play-nature.mjs <Stylized Nature MegaKit glTF dir> <out file>
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, mergeDocuments, meshopt, prune, textureCompress, unpartition } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const [dir, out] = process.argv.slice(2);
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });

const models = [
  'Pine_1', 'Pine_2', 'Pine_3', 'Pine_4', 'Pine_5',
  'CommonTree_1', 'CommonTree_2', 'CommonTree_3', 'CommonTree_4', 'CommonTree_5',
  'DeadTree_3',
  'Bush_Common_Flowers', 'Fern_1', 'Plant_1_Big', 'Plant_7_Big', 'Mushroom_Common',
  // Ground cover around the village and along the old road.
  'Bush_Common', 'Flower_3_Group', 'Flower_4_Group', 'Grass_Wispy_Tall', 'Grass_Common_Tall', 'Clover_1', 'Plant_7',
  'Rock_Medium_2', 'Pebble_Round_1', 'Pebble_Round_3', 'Pebble_Square_2',
];
const doc = await io.read(path.join(dir, `${models[0]}.gltf`));
doc.getRoot().listScenes()[0].setName(models[0]);
for (const name of models.slice(1)) {
  const source = await io.read(path.join(dir, `${name}.gltf`));
  source.getRoot().listScenes()[0].setName(name);
  mergeDocuments(doc, source);
}
await doc.transform(
  dedup(),
  prune(),
  unpartition(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], slots: /^baseColorTexture$/, quality: 85 }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], slots: /^(?!baseColorTexture).*$/, quality: 85 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);
const root = doc.getRoot();
console.log('models', root.listScenes().length, 'materials', root.listMaterials().map((m) => m.getName()).join(', '));
await io.write(out, doc);
console.log(path.basename(out), (statSync(out).size / 1024).toFixed(0) + ' KB');
