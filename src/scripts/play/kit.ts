// A pack of models as building blocks: the .glb holds one scene per piece (the Medieval Village
// MegaKit, the Stylized Nature MegaKit). The builder collects every placement and then draws each
// piece's meshes as instanced meshes, so hundreds of walls or trees cost a few draw calls.
import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface PieceMesh {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  /** The mesh's transform inside its piece. */
  local: THREE.Matrix4;
}

export interface BuildOptions {
  castShadow?: boolean;
  receiveShadow?: boolean;
  /**
   * Splits each piece's placements into square cells this many metres wide, one instanced mesh
   * per cell, so the ones out of view aren't drawn (for pieces spread all around, like a forest).
   */
  cell?: number;
  /** Builds only the pieces this accepts; the rest wait for the next build. */
  only?: (name: string) => boolean;
}

export class Kit {
  private pieces = new Map<string, PieceMesh[]>();
  private placements = new Map<string, THREE.Matrix4[]>();

  constructor(gltf: GLTF, tweakMaterial: (material: THREE.Material) => THREE.Material = (m) => m) {
    const materials = new Map<THREE.Material, THREE.Material>();
    for (const scene of gltf.scenes) {
      scene.updateMatrixWorld(true);
      const meshes: PieceMesh[] = [];
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        const source = mesh.material as THREE.Material;
        if (!materials.has(source)) materials.set(source, tweakMaterial(source));
        meshes.push({ geometry: mesh.geometry, material: materials.get(source)!, local: mesh.matrixWorld.clone() });
      });
      this.pieces.set(scene.name, meshes);
    }
  }

  has(name: string) {
    return this.pieces.has(name);
  }

  /** Places a piece; `matrix` is its transform in the world. */
  place(name: string, matrix: THREE.Matrix4) {
    if (!this.pieces.has(name)) {
      console.warn(`Kit piece not found: ${name}`);
      return;
    }
    const list = this.placements.get(name) ?? [];
    list.push(matrix.clone());
    this.placements.set(name, list);
  }

  /** Builds the instanced meshes for what's been placed so far (see `only`) and adds them to `parent`. */
  build(parent: THREE.Object3D, { castShadow = true, receiveShadow = true, cell, only }: BuildOptions = {}) {
    const matrix = new THREE.Matrix4();
    for (const [name, placements] of this.placements) {
      if (only && !only(name)) continue;
      this.placements.delete(name);
      const groups = new Map<string, THREE.Matrix4[]>();
      for (const placed of placements) {
        // The translation is in elements 12 (x) and 14 (z).
        const key = cell ? `${Math.floor(placed.elements[12] / cell)},${Math.floor(placed.elements[14] / cell)}` : '';
        const group = groups.get(key);
        if (group) group.push(placed);
        else groups.set(key, [placed]);
      }
      for (const matrices of groups.values()) {
        for (const piece of this.pieces.get(name) ?? []) {
          const instanced = new THREE.InstancedMesh(piece.geometry, piece.material, matrices.length);
          matrices.forEach((placed, index) => instanced.setMatrixAt(index, matrix.multiplyMatrices(placed, piece.local)));
          instanced.castShadow = castShadow;
          instanced.receiveShadow = receiveShadow;
          instanced.computeBoundingSphere();
          instanced.name = name;
          parent.add(instanced);
        }
      }
    }
  }
}

/** A transform from a position, a rotation around Y and an optional uniform scale. */
export function at(x: number, y: number, z: number, rotY = 0, scale = 1) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY),
    new THREE.Vector3(scale, scale, scale),
  );
}
