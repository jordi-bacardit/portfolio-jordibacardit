// Builds the /play characters and animations from Quaternius' Modular Character Outfits - Fantasy,
// Universal Base Characters and Universal Animation Library (all CC0, Standard versions).
// - characters.glb: one scene per character (Male_Ranger, Female_Ranger, Male_Peasant,
//   Female_Peasant, and the base characters' heads), textures WebP, Meshopt.
// - animations.glb: only the clips the village uses, without the mannequin mesh.
// Not part of the site build: run it by hand. Needs, in a temporary folder: @gltf-transform/core,
// functions and extensions (v4), meshoptimizer and sharp.
// Usage: node build-play-characters.mjs <dir with the unzipped packs> <out dir>
// The base characters' and hairstyles' glTFs (Godot - UE) point at some textures as "X_png.png"
// while the pack ships "X.png": copy each missing one to the name the glTF expects first.
import { NodeIO, PropertyType } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { compactPrimitive, dedup, mergeDocuments, meshopt, prune, resample, textureCompress, unpartition } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const [q2, out] = process.argv.slice(2);
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });

const outfits = path.join(q2, 'Modular_Character_Outfits_-_Fantasy/Modular Character Outfits - Fantasy[Standard]/Exports/glTF (Godot-Unreal)/Outfits');
const base = path.join(q2, 'Universal_Base_Characters/Universal Base Characters[Standard]/Base Characters/Godot - UE');
const hair = path.join(q2, 'Universal_Base_Characters/Universal Base Characters[Standard]/Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)');

/** Keeps only the head of a base character: triangles skinned (mostly) to the head and neck. */
async function headOf(file) {
  const source = await io.read(file);
  for (const node of source.getRoot().listNodes()) {
    const mesh = node.getMesh();
    const skin = node.getSkin();
    if (!mesh || !skin) continue;
    const headJoints = new Set(skin.listJoints().map((joint, index) => (['Head', 'neck_01'].includes(joint.getName()) ? index : -1)).filter((i) => i >= 0));
    for (const primitive of mesh.listPrimitives()) {
      if (!/Superhero/.test(primitive.getMaterial()?.getName() ?? '')) continue; // eyes and brows are head-only already
      const joints = primitive.getAttribute('JOINTS_0');
      const weights = primitive.getAttribute('WEIGHTS_0');
      const indices = primitive.getIndices();
      const weightOnHead = (v) => {
        const j = joints.getElement(v, []);
        const w = weights.getElement(v, []);
        return j.reduce((sum, joint, k) => sum + (headJoints.has(joint) ? w[k] : 0), 0);
      };
      const kept = [];
      for (let t = 0; t < indices.getCount(); t += 3) {
        const tri = [indices.getScalar(t), indices.getScalar(t + 1), indices.getScalar(t + 2)];
        if (tri.every((v) => weightOnHead(v) >= 0.5)) kept.push(...tri);
      }
      indices.setArray(new Uint32Array(kept));
      compactPrimitive(primitive);
      console.log('  head triangles', kept.length / 3);
    }
  }
  return source;
}

const sources = [
  ['Male_Ranger', () => io.read(path.join(outfits, 'Male_Ranger.gltf'))],
  ['Female_Ranger', () => io.read(path.join(outfits, 'Female_Ranger.gltf'))],
  ['Male_Peasant', () => io.read(path.join(outfits, 'Male_Peasant.gltf'))],
  ['Female_Peasant', () => io.read(path.join(outfits, 'Female_Peasant.gltf'))],
  ['Male_Head', () => headOf(path.join(base, 'Superhero_Male_FullBody.gltf'))],
  ['Female_Head', () => headOf(path.join(base, 'Superhero_Female_FullBody.gltf'))],
  ...['Hair_Beard', 'Hair_SimpleParted', 'Hair_Long', 'Hair_Buns', 'Hair_Buzzed', 'Eyebrows_Regular', 'Eyebrows_Female'].map(
    (name) => [name, () => io.read(path.join(hair, name + '.gltf'))],
  ),
];
const doc = await sources[0][1]();
doc.getRoot().listScenes()[0].setName(sources[0][0]);
for (const [name, load] of sources.slice(1)) {
  const source = await load();
  source.getRoot().listScenes()[0].setName(name);
  mergeDocuments(doc, source);
}
await doc.transform(
  // Every character keeps its own skeleton: no merging of skins or nodes.
  dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.TEXTURE, PropertyType.MATERIAL] }),
  prune(),
  unpartition(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], slots: /^baseColorTexture$/, quality: 85 }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], slots: /^(?!baseColorTexture).*$/, quality: 85 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);
const root = doc.getRoot();
console.log('characters:', root.listScenes().map((s) => s.getName()).join(', '));
console.log('materials:', root.listMaterials().map((m) => m.getName()).join(', '));
await io.write(path.join(out, 'characters.glb'), doc);

// Animations: keep the clips, drop the mannequin's mesh.
const keep = [
  'Idle_Loop', 'Walk_Loop', 'Jog_Fwd_Loop', 'Idle_Talking_Loop', 'Sitting_Idle_Loop', 'Sitting_Talking_Loop',
  'Idle_Torch_Loop', 'Interact', 'Fixing_Kneeling', 'Walk_Formal_Loop', 'Sword_Idle',
];
const anims = await io.read(path.join(q2, 'Universal_Animation_Library/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb'));
const ar = anims.getRoot();
for (const animation of ar.listAnimations()) {
  if (keep.includes(animation.getName())) continue;
  animation.listSamplers().forEach((sampler) => sampler.dispose());
  animation.listChannels().forEach((channel) => channel.dispose());
  animation.dispose();
}
for (const node of ar.listNodes()) node.setMesh(null);
ar.listMeshes().forEach((mesh) => mesh.dispose());
await anims.transform(resample(), prune(), dedup(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
console.log('animations:', ar.listAnimations().map((a) => a.getName()).join(', '));
await io.write(path.join(out, 'animations.glb'), anims);

for (const file of ['characters.glb', 'animations.glb']) {
  console.log(file, (statSync(path.join(out, file)).size / 1024).toFixed(0) + ' KB');
}
