// Builds people from Quaternius' modular characters (CC0): an outfit (body and clothes) plus a head,
// hair and eyebrows, all bound to the outfit's skeleton so one animation moves them together.
// characters.glb holds one scene per part; animations.glb and animations-2.glb hold the shared clips
// (both libraries use the same skeleton).
//
// All parts share the same skeleton names (root, pelvis, spine_01...). three.js renames repeated
// names when it loads one file ("pelvis_1", "pelvis_2"), so every person's bones are renamed back
// to the clean names the clips use.
import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export interface Look {
  outfit: 'Male_Ranger' | 'Female_Ranger' | 'Male_Peasant' | 'Female_Peasant';
  head: 'Male_Head' | 'Female_Head';
  /** Hair, beard and eyebrows. */
  extras: string[];
  /** Tints the clothes, so villagers in the same outfit don't look identical. */
  tint?: number;
  /** Tints the hair (the kit's hair is light grey). */
  hair?: number;
  /** Wears the outfit's other colours: true for its usual alternative, or a named one (see Wardrobe.variant). */
  variant?: boolean | string;
  /** false takes the ranger's hood off. */
  hood?: boolean;
}

/** A copy of one of the props (props.glb) to hold or wear, graded like the rest of the village. */
export function propCopy(props: GLTF, name: string, grade: (material: THREE.Material) => THREE.Material) {
  const source = props.scenes.find((scene) => scene.name === name);
  if (!source) return null;
  const item = source.clone();
  item.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.material = grade(mesh.material as THREE.Material);
    mesh.castShadow = true;
  });
  return item;
}

export class Wardrobe {
  private parts = new Map<string, THREE.Object3D>();
  private boneNames: Set<string>;
  private variants = new Map<string, THREE.Texture>();
  readonly clips: THREE.AnimationClip[];

  constructor(characters: GLTF, animations: GLTF[]) {
    for (const scene of characters.scenes) this.parts.set(scene.name, scene);
    this.clips = animations.flatMap((file) => file.animations);
    // The clips come from their own file, so their bone names are the clean ones.
    this.boneNames = new Set(this.clips.flatMap((clip) => clip.tracks.map((track) => track.name.split('.')[0])));
  }

  /**
   * An alternative colour texture for an outfit material (e.g. the ranger in brown leather); with
   * a name, one that people wear by asking for it (`variant: 'blue'`).
   */
  variant(materialName: string, texture: THREE.Texture, name?: string) {
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.variants.set(name ? `${materialName}:${name}` : materialName, texture);
  }

  clip(name: string) {
    return THREE.AnimationClip.findByName(this.clips, name);
  }

  /** "spine_01_3" → "spine_01": drops the suffixes three.js added until the name is a known bone. */
  private clean(name: string) {
    let result = name;
    while (!this.boneNames.has(result) && /_\d+$/.test(result)) result = result.replace(/_\d+$/, '');
    return result;
  }

  /** A new person: its own copy of the outfit's skeleton, with the head and extras skinned to it. */
  dress(look: Look) {
    const body = SkeletonUtils.clone(this.parts.get(look.outfit)!);
    const bones = new Map<string, THREE.Bone>();
    body.traverse((object) => {
      if ((object as THREE.Bone).isBone) {
        object.name = this.clean(object.name);
        bones.set(object.name, object as THREE.Bone);
      }
    });
    const armature = bones.get('root')?.parent ?? body;

    for (const name of [look.head, ...look.extras]) {
      const source = this.parts.get(name);
      if (!source) continue;
      // Only the part's meshes join the person; its own copy of the skeleton is left behind.
      source.traverse((object) => {
        const mesh = object as THREE.SkinnedMesh;
        if (!mesh.isSkinnedMesh) return;
        const copy = mesh.clone();
        const skeleton = new THREE.Skeleton(
          mesh.skeleton.bones.map((bone) => bones.get(this.clean(bone.name)) ?? bone),
          mesh.skeleton.boneInverses,
        );
        copy.bind(skeleton, mesh.bindMatrix);
        if (look.hair !== undefined && /Hair/.test((mesh.material as THREE.Material).name)) {
          copy.material = (mesh.material as THREE.MeshStandardMaterial).clone();
          (copy.material as THREE.MeshStandardMaterial).color.set(look.hair);
        }
        armature.add(copy);
      });
    }

    body.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (look.hood === false && /_Hood$/.test(mesh.name)) mesh.visible = false;
      mesh.castShadow = true;
      // Skinned meshes move beyond their bind-pose bounds; never cull them by mistake.
      mesh.frustumCulled = false;
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (!/Peasant|Ranger/.test(material.name)) return;
      const key = typeof look.variant === 'string' ? `${material.name}:${look.variant}` : material.name;
      const variant = look.variant ? this.variants.get(key) : undefined;
      if (look.tint === undefined && !variant) return;
      const outfit = material.clone();
      if (variant) outfit.map = variant;
      if (look.tint !== undefined) outfit.color.multiply(new THREE.Color(look.tint));
      mesh.material = outfit;
    });
    return body;
  }
}
