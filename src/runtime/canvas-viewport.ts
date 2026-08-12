import type * as THREE from 'three';

export interface CanvasViewportOptions {
  maxPixelRatio?: number;
  onResize?: (width: number, height: number, pixelRatio: number) => void;
}

/**
 * Resize a Three.js renderer only when its container actually changes size.
 * This avoids calling renderer.setSize() and camera.updateProjectionMatrix()
 * on every animation frame.
 */
export function observeRendererViewport(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  container: HTMLElement,
  options: CanvasViewportOptions = {},
) {
  const maxPixelRatio = Math.max(1, options.maxPixelRatio ?? 1.5);
  let width = 0;
  let height = 0;
  let pixelRatio = 1;

  const resize = () => {
    const rect = container.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    const nextPixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);

    if (nextWidth === width && nextHeight === height && nextPixelRatio === pixelRatio) return false;

    width = nextWidth;
    height = nextHeight;
    pixelRatio = nextPixelRatio;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    options.onResize?.(width, height, pixelRatio);
    return true;
  };

  const observer = new ResizeObserver(() => resize());
  observer.observe(container);
  resize();

  return {
    resize,
    get width() { return width; },
    get height() { return height; },
    get pixelRatio() { return pixelRatio; },
    dispose() { observer.disconnect(); },
  };
}
