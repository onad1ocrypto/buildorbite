// Keep a broad fort view at normal zoom, and follow the hero more closely when zoomed in.
export function cameraTrackingTarget(x: number, z: number, zoom: number, portrait: boolean): { x: number; z: number } {
  const zoomIn = Math.max(0, Math.min(1, (1 - zoom) / 0.38));
  const base = portrait ? 0.3 : 0.18;
  const follow = base + (0.92 - base) * zoomIn;
  const limit = 15.5;
  const safeOffset = 6 * Math.max(0.62, Math.min(1, zoom));
  const track = (position: number) => {
    const offsetFollow = Math.sign(position) * Math.max(0, Math.abs(position) - safeOffset);
    const target = Math.abs(offsetFollow) > Math.abs(position * follow) ? offsetFollow : position * follow;
    return Math.max(-limit, Math.min(limit, target));
  };
  return { x: track(x), z: track(z) };
}
