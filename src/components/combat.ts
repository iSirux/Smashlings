import { defineComponent, Types } from 'bitecs'

export const Health = defineComponent({
  current: Types.f32,
  max: Types.f32,
  armor: Types.f32,
})

export const AutoAttack = defineComponent({
  damage: Types.f32,
  range: Types.f32,
  cooldown: Types.f32,
  cooldownTimer: Types.f32,
  /** Attack pattern: 0 = nearest, 1 = forward, 2 = radial */
  pattern: Types.ui8,
  knockback: Types.f32,
  projectileCount: Types.ui8,
})

export const DamageOnContact = defineComponent({
  amount: Types.f32,
  knockback: Types.f32,
  /** How many enemies this projectile can pass through before dying. */
  pierce: Types.ui8,
  /** How many enemies have been hit so far. */
  hitCount: Types.ui8,
})

export const Invincible = defineComponent({
  /** Seconds of invincibility remaining. */
  timer: Types.f32,
})
