import { defineComponent, Types } from 'bitecs'

export const PlayerControlled = defineComponent({
  moveSpeed: Types.f32,
  jumpForce: Types.f32,
  dashCooldown: Types.f32,
  dashTimer: Types.f32,
  dashDuration: Types.f32,
  dashSpeed: Types.f32,
  /** 1 while the entity is in a dash, 0 otherwise. */
  isDashing: Types.ui8,
  /** 1 while the entity is on the ground, 0 otherwise. */
  isGrounded: Types.ui8,
  jumpsRemaining: Types.ui8,
  maxJumps: Types.ui8,
})

export const AIFollow = defineComponent({
  /** Entity id of the target to follow. */
  targetEid: Types.eid,
  speed: Types.f32,
  /** 0=direct(default), 1=orbit, 2=keepDistance */
  behavior: Types.ui8,
  preferredDist: Types.f32,
  orbitAngle: Types.f32,
})
