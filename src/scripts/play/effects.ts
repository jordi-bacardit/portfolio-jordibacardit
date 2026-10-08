// Small things that make the village feel alive, all drawn as GPU-animated points (one draw call
// each, nothing to update on the CPU): smoke rising from the chimneys, fireflies at the edge of
// the forest, and the flames of hearths and forges.
import * as THREE from 'three';
import { palette } from './palette';

export const effectsTime = { value: 0 };

/** Grey smoke that rises, drifts with the wind, grows and fades. */
export function chimneySmoke(chimneys: THREE.Vector3[]) {
  const perChimney = 16;
  const count = chimneys.length * perChimney;
  const origins = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  chimneys.forEach((chimney, c) => {
    for (let i = 0; i < perChimney; i++) {
      const index = c * perChimney + i;
      origins.set([chimney.x, chimney.y, chimney.z], index * 3);
      seeds[index] = i / perChimney + c * 0.37;
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(origins, 3));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: effectsTime, uColor: { value: new THREE.Color(palette.smoke) } },
    vertexShader: `
      attribute float seed;
      uniform float uTime;
      varying float vAlpha;
      void main() {
        float life = fract(uTime * 0.07 + seed);
        vec3 p = position;
        p.y += life * 8.0;
        p.x += life * life * 3.0 + sin(seed * 31.0 + life * 4.0) * 0.4 * life;
        p.z += cos(seed * 17.0 + life * 3.0) * 0.4 * life;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (90.0 + 260.0 * life) / -mv.z;
        vAlpha = smoothstep(0.0, 0.12, life) * (1.0 - life) * 0.32;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float soft = smoothstep(0.5, 0.1, d);
        gl_FragColor = vec4(uColor, soft * vAlpha);
        #include <colorspace_fragment>
      }`,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

/** An open fire: tongues of flame that rise, shrink and cool from yellow to red. `size` scales each. */
export function flames(fires: { position: THREE.Vector3; size: number }[]) {
  const perFire = 28;
  const count = fires.length * perFire;
  const origins = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  fires.forEach(({ position, size }, f) => {
    for (let i = 0; i < perFire; i++) {
      const index = f * perFire + i;
      origins.set([position.x, position.y, position.z], index * 3);
      seeds[index] = i / perFire + f * 0.29;
      sizes[index] = size;
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(origins, 3));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: { uTime: effectsTime },
    vertexShader: `
      attribute float seed;
      attribute float size;
      uniform float uTime;
      varying float vLife;
      void main() {
        float life = fract(uTime * 1.4 + seed * 3.0);
        float angle = seed * 91.0;
        float radius = (1.0 - life) * 0.22 * fract(seed * 13.7) * size;
        vec3 p = position;
        p.x += cos(angle) * radius + sin(uTime * 3.0 + seed * 20.0) * 0.03 * life;
        p.z += sin(angle) * radius;
        p.y += life * 0.7 * size;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.0 - life * 0.8) * 150.0 * size / -mv.z;
        vLife = life;
      }`,
    fragmentShader: `
      varying float vLife;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float soft = smoothstep(0.5, 0.05, d);
        vec3 hot = vec3(1.0, 0.78, 0.35) * 2.6;
        vec3 cool = vec3(1.0, 0.28, 0.06) * 1.4;
        vec3 color = mix(hot, cool, smoothstep(0.0, 0.7, vLife));
        float alpha = soft * (1.0 - vLife) * smoothstep(0.0, 0.08, vLife) * 0.8;
        gl_FragColor = vec4(color * alpha, alpha);
      }`,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

/** Sparks flying up from a fire: tiny bright points that rise, drift and go out. */
export function sparks(fires: { position: THREE.Vector3; size: number }[]) {
  const perFire = 14;
  const count = fires.length * perFire;
  const origins = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  fires.forEach(({ position }, f) => {
    for (let i = 0; i < perFire; i++) {
      origins.set([position.x, position.y + 0.2, position.z], (f * perFire + i) * 3);
      seeds[f * perFire + i] = Math.random();
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(origins, 3));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: { uTime: effectsTime },
    vertexShader: `
      attribute float seed;
      uniform float uTime;
      varying float vLife;
      void main() {
        float life = fract(uTime * (0.35 + seed * 0.3) + seed * 7.0);
        vec3 p = position;
        p.y += life * (1.2 + seed * 1.2);
        p.x += sin(seed * 40.0 + life * 6.0) * 0.25 * life;
        p.z += cos(seed * 23.0 + life * 5.0) * 0.25 * life;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = 14.0 / -mv.z + 1.0;
        vLife = life;
      }`,
    fragmentShader: `
      varying float vLife;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float core = smoothstep(0.5, 0.0, d);
        float fade = (1.0 - vLife) * smoothstep(0.0, 0.05, vLife);
        vec3 color = mix(vec3(1.0, 0.85, 0.5), vec3(1.0, 0.35, 0.1), vLife) * 3.0;
        gl_FragColor = vec4(color * core * fade, core * fade);
      }`,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

/**
 * Low mist: big soft patches lying on the ground, drifting slowly and breathing in and out, at
 * the edge of the forest and over the road and the field.
 */
export function mist(spots: THREE.Vector3[], color: THREE.ColorRepresentation) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(spots.length * 3);
  const seeds = new Float32Array(spots.length);
  spots.forEach((spot, i) => {
    positions.set([spot.x, spot.y, spot.z], i * 3);
    seeds[i] = Math.random() * 100;
  });
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    uniforms: { uTime: effectsTime, uColor: { value: new THREE.Color(color) } },
    vertexShader: `
      attribute float seed;
      uniform float uTime;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.03 + seed) * 2.5;
        p.z += cos(uTime * 0.025 + seed * 1.7) * 2.5;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = min(5200.0 / -mv.z, 900.0);
        // Thin when close (so it never blocks the view), stronger at a distance.
        vAlpha = (0.55 + 0.45 * sin(uTime * 0.2 + seed * 3.0)) * smoothstep(3.0, 14.0, -mv.z) * 0.16;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        // Flatter than it is wide, like a bank of mist.
        float d = length(vec2(c.x, c.y * 2.2));
        float soft = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(uColor, soft * soft * vAlpha);
        #include <colorspace_fragment>
      }`,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 2;
  return points;
}

/** Fireflies drifting and blinking where the clearing meets the trees. */
export function fireflies(spots: THREE.Vector3[]) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(spots.length * 3);
  const seeds = new Float32Array(spots.length);
  spots.forEach((spot, i) => {
    positions.set([spot.x, spot.y, spot.z], i * 3);
    seeds[i] = Math.random() * 100;
  });
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: { uTime: effectsTime, uColor: { value: new THREE.Color(palette.firefly).multiplyScalar(2.5) } },
    vertexShader: `
      attribute float seed;
      uniform float uTime;
      varying float vGlow;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.35 + seed) * 1.2;
        p.y += sin(uTime * 0.5 + seed * 2.0) * 0.4;
        p.z += cos(uTime * 0.3 + seed * 1.3) * 1.2;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = 26.0 / -mv.z + 1.5;
        vGlow = pow(0.5 + 0.5 * sin(uTime * (1.3 + fract(seed) * 1.5) + seed), 3.0);
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vGlow;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float core = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(uColor * core * vGlow, core * vGlow);
      }`,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}
