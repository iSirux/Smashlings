import { defineComponent, Types } from 'bitecs'

export const PlayerStats = defineComponent({
  critChance: Types.f32,     // 0.0 to 1.0+
  critDamage: Types.f32,     // multiplier, default 2.0
  evasion: Types.f32,        // 0.0 to 1.0
  regen: Types.f32,          // HP per second
  lifesteal: Types.f32,      // 0.0 to 1.0
  luck: Types.f32,           // 0.0+
  xpGain: Types.f32,         // multiplier, default 1.0
  goldGain: Types.f32,       // multiplier, default 1.0
  pickupRange: Types.f32,    // radius
  damageMult: Types.f32,     // from damage tome, default 1.0
  speedMult: Types.f32,      // from speed tome, default 1.0
  cooldownMult: Types.f32,   // from attack speed tome, default 1.0
  knockbackMult: Types.f32,  // from knockback tome, default 1.0
  projCountBonus: Types.ui8,  // from Quantity Tome, flat bonus to all weapons
  projSpeedMult: Types.f32,   // from Projectile Speed Tome, default 1.0
})
