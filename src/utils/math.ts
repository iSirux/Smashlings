import * as THREE from 'three'

// Reusable temp vectors - NEVER allocate in per-frame loops
export const _v1 = new THREE.Vector3()
export const _v2 = new THREE.Vector3()
export const _v3 = new THREE.Vector3()
export const _q1 = new THREE.Quaternion()

/**
 * Linear interpolation between a and b by factor t.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Clamp value between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

/**
 * Random float in [min, max).
 */
export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/**
 * Random integer in [min, max] (inclusive on both ends).
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1))
}

/**
 * Squared 2D distance on the XZ plane. Use this to avoid sqrt when
 * comparing distances (compare against threshold*threshold instead).
 */
export function distanceSq(x1: number, z1: number, x2: number, z2: number): number {
  const dx = x2 - x1
  const dz = z2 - z1
  return dx * dx + dz * dz
}

/**
 * Angle in radians from (x1,z1) toward (x2,z2) on the XZ plane.
 * Returns value in (-PI, PI]. 0 points along +X, PI/2 along +Z.
 */
export function angleBetween(x1: number, z1: number, x2: number, z2: number): number {
  return Math.atan2(z2 - z1, x2 - x1)
}
