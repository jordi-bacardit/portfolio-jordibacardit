// What the browser can do for the 3D village, shared by the home gate and /play.

/** True when the browser can create a WebGL context (the 3D village needs one). */
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** True when the visitor asked the system for less motion. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
