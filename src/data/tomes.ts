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
]
