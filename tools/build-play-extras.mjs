// Builds src/assets/play/props.glb (Quaternius Fantasy Props MegaKit, CC0: furniture, barrels, stalls,
// tools...) and animations-2.glb (the clips the village uses from Universal Animation Library 2,
// CC0: drinking, farming, chopping wood, leaning on the bar...). Not part of the site build: run it
// by hand. Needs, in a temporary folder: @gltf-transform/core, functions and extensions (v4),
// meshoptimizer and sharp.
// Usage: node build-play-extras.mjs <dir with the unzipped packs> <out dir>
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, mergeDocuments, meshopt, prune, resample, textureCompress, unpartition } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const [packs, out] = process.argv.slice(2);
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });

// 1. Props
const dir = path.join(packs, 'Fantasy_Props_MegaKit/Exports/glTF');
const props = [
  'Anvil_Log', 'Axe_Bronze', 'Bag', 'Banner_1_Cloth', 'Banner_2_Cloth', 'Barrel', 'Barrel_Apples', 'Barrel_Holder',
  'Bed_Twin1', 'Bench', 'BookGroup_Medium_1', 'BookGroup_Medium_2', 'BookGroup_Small_1', 'BookStand', 'Book_7',
  'Book_Stack_1', 'Book_Stack_2', 'Bookcase_2', 'Bottle_1', 'Bucket_Metal', 'Bucket_Wooden_1', 'Cabinet', 'CandleStick',
  'CandleStick_Triple', 'Candle_1', 'Candle_2', 'Cauldron', 'Chain_Coil', 'Chair_1', 'Chandelier', 'Chest_Wood',
  'Coin_Pile', 'Crate_Wooden', 'Dummy', 'FarmCrate_Apple', 'FarmCrate_Carrot', 'FarmCrate_Empty', 'Mug',
  'Nightstand_Shelf', 'Peg_Rack', 'Pot_1', 'Pot_1_Lid', 'Potion_1', 'Potion_2', 'Potion_4', 'Pouch_Large', 'Rope_1',
  'Rope_2', 'Scroll_1', 'Scroll_2', 'Shelf_Simple', 'Shelf_Small_Bottles', 'Shield_Wooden', 'SmallBottles_1',
  'Stall_Cart_Empty', 'Stall_Empty', 'Stool', 'Table_Large', 'Table_Plate', 'Torch_Metal', 'Vase_2', 'Vase_4',
  'WeaponStand', 'Whetstone', 'Workbench',
];
const doc = await io.read(path.join(dir, `${props[0]}.gltf`));
doc.getRoot().listScenes()[0].setName(props[0]);
for (const name of props.slice(1)) {
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
console.log('props', doc.getRoot().listScenes().length, 'materials', doc.getRoot().listMaterials().map((m) => m.getName()).join(', '));
await io.write(path.join(out, 'props.glb'), doc);

// 2. Animations from the second library, without the mannequin's mesh.
const keep = [
  'Consume', 'Farm_Harvest', 'Farm_PlantSeed', 'Farm_Watering', 'Idle_FoldArms_Loop', 'TreeChopping_Loop',
  'Walk_Carry_Loop',
];
const anims = await io.read(path.join(packs, 'Universal_Animation_Library_2/Universal Animation Library 2[Standard]/Unreal-Godot/UAL2_Standard.glb'));
const root = anims.getRoot();
for (const animation of root.listAnimations()) {
  if (keep.includes(animation.getName())) continue;
  animation.listSamplers().forEach((sampler) => sampler.dispose());
  animation.listChannels().forEach((channel) => channel.dispose());
  animation.dispose();
}
for (const node of root.listNodes()) node.setMesh(null);
root.listMeshes().forEach((mesh) => mesh.dispose());
await anims.transform(resample(), prune(), dedup(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
console.log('animations:', root.listAnimations().map((a) => a.getName()).join(', '));
await io.write(path.join(out, 'animations-2.glb'), anims);

for (const file of ['props.glb', 'animations-2.glb']) {
  console.log(file, (statSync(path.join(out, file)).size / 1024).toFixed(0) + ' KB');
}
