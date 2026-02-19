import { defineComponent, Types } from 'bitecs'

export const Transform = defineComponent({
  x: Types.f32,
  y: Types.f32,
  z: Types.f32,
  rotX: Types.f32,
  rotY: Types.f32,
  rotZ: Types.f32,
  scaleX: Types.f32,
  scaleY: Types.f32,
  scaleZ: Types.f32,
})

export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32,
  z: Types.f32,
})

export const Collider = defineComponent({
  radius: Types.f32,     // XZ collision radius
  halfHeight: Types.f32, // half the entity height (for terrain snapping)
})

/**
 * Initialise a Transform on the given entity with position and default
 * scale of (1, 1, 1). Rotation defaults to (0, 0, 0).
 */
export function initTransform(eid: number, x: number, y: number, z: number): void {
  Transform.x[eid] = x
  Transform.y[eid] = y
  Transform.z[eid] = z
  Transform.rotX[eid] = 0
  Transform.rotY[eid] = 0
  Transform.rotZ[eid] = 0
  Transform.scaleX[eid] = 1
  Transform.scaleY[eid] = 1
  Transform.scaleZ[eid] = 1
}
