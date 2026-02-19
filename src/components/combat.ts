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
  /** Attack pattern: 0=nearest, 1=forward, 2=radial, 3=forward_spread, 4=orbit, 5=aura, 6=trail, 7=homing */
  pattern: Types.ui8,
  knockback: Types.f32,
  projectileCount: Types.ui8,
  projectileSpeed: Types.f32,
  /** Weapon index: 0=sword, 1=bow, 2=revolver, 3=bone_toss, 4=aura, 5=katana, 6=lightning_staff, 7=flamewalker, 8=shotgun, 9=boomerang, 10=frostwalker, 11=dice */
  weaponId: Types.ui8,
})

export const WeaponSlot = defineComponent({
  ownerEid: Types.ui32,   // player entity id
  slotIndex: Types.ui8,   // 0-3
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

export const ChainLightning = defineComponent({
  chainsRemaining: Types.ui8,
  chainRange: Types.f32,
})

/** Enemy melee attack state machine: 0=idle, 1=windup, 2=lunge, 3=cooldown */
export const EnemyAttack = defineComponent({
  state: Types.ui8,
  timer: Types.f32,
  /** Locked lunge direction (set at windup start) */
  dirX: Types.f32,
  dirZ: Types.f32,
})

export const EnemyRangedAttack = defineComponent({
  cooldown: Types.f32,
  cooldownTimer: Types.f32,
  damage: Types.f32,
  projectileSpeed: Types.f32,
  /** 0=straight, 1=homing, 2=aoe_cloud */
  projectileType: Types.ui8,
  minRange: Types.f32,
})

export const EnemyHoming = defineComponent({
  turnRate: Types.f32,
})

export const BossPhase = defineComponent({
  phase: Types.ui8,
  attackTimer: Types.f32,
  patternTimer: Types.f32,
  patternIndex: Types.ui8,
})

export const BoomerangReturn = defineComponent({
  elapsed: Types.f32,
  totalLife: Types.f32,
  /** Forward direction (toward target at spawn) */
  fwdX: Types.f32,
  fwdZ: Types.f32,
  /** Perpendicular direction (for arc curve) */
  perpX: Types.f32,
  perpZ: Types.f32,
  speed: Types.f32,
})
