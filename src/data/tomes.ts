export interface TomeDef {
  id: string
  name: string
  description: string
  stat: string
  perLevel: number // the amount of bonus per level
  isPercent: boolean // true = multiplicative percent, false = flat
}

export const TOMES: TomeDef[] = [
  { id: 'damage', name: 'Damage Tome', description: '+10% Base Damage', stat: 'damage', perLevel: 0.10, isPercent: true },
  { id: 'attackSpeed', name: 'Attack Speed Tome', description: '-4% Cooldown', stat: 'attackSpeed', perLevel: 0.04, isPercent: true },
  { id: 'moveSpeed', name: 'Movement Tome', description: '+7% Move Speed', stat: 'moveSpeed', perLevel: 0.07, isPercent: true },
  { id: 'maxHp', name: 'HP Tome', description: '+8% Max HP', stat: 'maxHp', perLevel: 0.08, isPercent: true },
  { id: 'regen', name: 'Regen Tome', description: '+0.5 HP/s Regen', stat: 'regen', perLevel: 0.5, isPercent: false },
  { id: 'crit', name: 'Crit Tome', description: '+7% Crit Chance', stat: 'crit', perLevel: 0.07, isPercent: false },
  { id: 'knockback', name: 'Knockback Tome', description: '+10% Knockback', stat: 'knockback', perLevel: 0.10, isPercent: true },
  { id: 'evasion', name: 'Evasion Tome', description: '+2% Evasion', stat: 'evasion', perLevel: 0.02, isPercent: false },
  { id: 'xpGain', name: 'XP Tome', description: '+7% XP Gain', stat: 'xpGain', perLevel: 0.07, isPercent: true },
  { id: 'armor', name: 'Armor Tome', description: '+3% Armor', stat: 'armor', perLevel: 0.03, isPercent: true },
  { id: 'luck', name: 'Luck Tome', description: '+7% Luck', stat: 'luck', perLevel: 0.07, isPercent: false },
  { id: 'projCount', name: 'Quantity Tome', description: '+1 Projectile', stat: 'projectileCount', perLevel: 1, isPercent: false },
  { id: 'cursed', name: 'Cursed Tome', description: '+3.5% Difficulty & Drops', stat: 'cursed', perLevel: 0.035, isPercent: true },
  { id: 'lifesteal', name: 'Lifesteal Tome', description: '+3% Lifesteal', stat: 'lifesteal', perLevel: 0.03, isPercent: false },
  { id: 'duration', name: 'Duration Tome', description: '+8% Effect Duration', stat: 'duration', perLevel: 0.08, isPercent: true },
  { id: 'size', name: 'Size Tome', description: '+10% Weapon Size', stat: 'size', perLevel: 0.10, isPercent: true },
  { id: 'thorns', name: 'Thorns Tome', description: '+5% Thorns', stat: 'thorns', perLevel: 0.05, isPercent: false },
  { id: 'projSpeed', name: 'Projectile Speed Tome', description: '+8% Projectile Speed', stat: 'projSpeed', perLevel: 0.08, isPercent: true },
  { id: 'goldGain', name: 'Gold Tome', description: '+7% Gold Gain', stat: 'goldGain', perLevel: 0.07, isPercent: true },
]
