/** Decorative field layout. All field vegetation and exclusion zones use this center. */
export const CORNFIELD = { x: 20.5, z: -16.8, rotation: -0.68, halfWidth: 4.55, halfDepth: 3.45 } as const;
export const MOAT_OUTER_BANK_RADIUS = 20.02;

/** Distance from origin to closest point on the field's rotated rectangular bed. */
export function cornfieldNearestRadius(): number {
  const { x, z, rotation, halfWidth, halfDepth } = CORNFIELD;
  const c = Math.cos(rotation);
  const s = Math.sin(rotation);
  const localX = -x * c + z * s;
  const localZ = -x * s - z * c;
  const closestX = Math.max(-halfWidth, Math.min(halfWidth, localX));
  const closestZ = Math.max(-halfDepth, Math.min(halfDepth, localZ));
  return Math.hypot(x + closestX * c + closestZ * s, z - closestX * s + closestZ * c);
}
