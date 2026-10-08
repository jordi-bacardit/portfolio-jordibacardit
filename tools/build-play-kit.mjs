// Builds src/assets/play/kit.glb from the Quaternius Medieval Village MegaKit (CC0), free version
// (glTF folder from https://quaternius.itch.io/medieval-village-megakit, or the CC0 mirror
// github.com/J-Ponzo/gltf-medieval-village-megakit). Not part of the site build: run it by hand.
// Needs, in a temporary folder: @gltf-transform/core, functions and extensions (v4), meshoptimizer
// and sharp. The ground textures (Poly Haven, CC0) were resized to 1024 (colour) / 512 (normal)
// WebP with sharp the same way.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, mergeDocuments, meshopt, prune, textureCompress, unpartition } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const [dir, out] = process.argv.slice(2);
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });

// Only the pieces the village uses (about a third of the pack), so /play downloads less. A house
// needing another piece (a roof size, a door) means adding it here and running this again.
const pieces = [
  'Balcony_Cross_Straight', 'Corner_ExteriorWide_Wood', 'Corner_Exterior_Brick', 'Corner_Exterior_Wood',
  'DoorFrame_Round_Brick', 'DoorFrame_Round_WoodDark', 'Door_8_Round', 'Floor_UnevenBrick', 'Floor_WoodDark',
  'Floor_WoodDark_Half3', 'Prop_Brick1', 'Prop_Brick2', 'Prop_Brick3', 'Prop_Brick4', 'Prop_Chimney',
  'Prop_Crate', 'Prop_ExteriorBorder_Straight1', 'Prop_Support', 'Prop_Vine1', 'Prop_Vine2', 'Prop_Vine4',
  'Prop_Wagon', 'Prop_WoodenFence_Extension1', 'Prop_WoodenFence_Extension2', 'Prop_WoodenFence_Single',
  'Roof_Front_Brick4', 'Roof_Front_Brick6', 'Roof_Front_Brick8', 'Roof_Log', 'Roof_RoundTiles_4x6',
  'Roof_RoundTiles_4x8', 'Roof_RoundTiles_6x10', 'Roof_RoundTiles_6x6', 'Roof_RoundTiles_6x8',
  'Roof_RoundTiles_8x10', 'Roof_RoundTiles_8x8', 'Roof_Tower_RoundTiles', 'Wall_Plaster_Door_Round',
  'Wall_Plaster_Straight', 'Wall_Plaster_Straight_Base', 'Wall_Plaster_Window_Thin_Round',
  'Wall_Plaster_Window_Wide_Round', 'Wall_Plaster_WoodGrid', 'Wall_UnevenBrick_Door_Round',
  'Wall_UnevenBrick_Straight', 'Wall_UnevenBrick_Window_Thin_Round', 'Wall_UnevenBrick_Window_Wide_Round',
  'WindowShutters_Thin_Round_Open', 'WindowShutters_Wide_Round_Open', 'Window_Thin_Round1',
  'Window_Wide_Round1',
];
const files = readdirSync(dir).filter((file) => pieces.includes(file.replace('.gltf', ''))).sort();
const missing = pieces.filter((piece) => !files.includes(`${piece}.gltf`));
if (missing.length) throw new Error(`Not in the pack: ${missing.join(', ')}`);
const kit = await io.read(path.join(dir, files[0]));
kit.getRoot().listScenes()[0].setName(files[0].replace('.gltf', ''));
for (const file of files.slice(1)) {
  const source = await io.read(path.join(dir, file));
  source.getRoot().listScenes()[0].setName(file.replace('.gltf', ''));
  mergeDocuments(kit, source);
}
await kit.transform(dedup(), prune(), unpartition());

const root = kit.getRoot();
console.log('pieces', root.listScenes().length, 'materials', root.listMaterials().map((m) => m.getName()).join(', '));
console.log('textures', root.listTextures().map((t) => `${t.getName() || t.getURI()} ${t.getSize()?.join('x')}`).join(' | '));

// Colour maps at 1024, the rest (normal, roughness, ORM) at 512: they read fine at village scale.
await kit.transform(
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], slots: /^baseColorTexture$/, quality: 82 }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], slots: /^(?!baseColorTexture).*$/, quality: 85 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);
await io.write(out, kit);
console.log(path.basename(out), (statSync(out).size / 1024).toFixed(0) + ' KB');
