export interface CharacterDef {
  id: string
  name: string
  description: string
  startingWeapon: string  // key into WEAPONS record
  baseHp: number
  baseSpeed: number
  baseArmor: number
  passive: {
    name: string
    description: string
    stat: string
    perLevel: number
  }
  meshColor: number
  unlocked: boolean  // default unlock state
  unlockCondition?: string
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'knight', name: 'Knight', description: 'Tanky beginner. Forgiving, learns you the game.',
    startingWeapon: 'sword', baseHp: 120, baseSpeed: 5, baseArmor: 5,
    passive: { name: 'Reinforced', description: '+1% Armor per level', stat: 'armor', perLevel: 0.01 },
    meshColor: 0x4FC3F7, unlocked: true
  },
  {
    id: 'fox', name: 'Fox', description: 'Luck scaling - better drops over time.',
    startingWeapon: 'bow', baseHp: 80, baseSpeed: 7, baseArmor: 0,
    passive: { name: 'Lucky', description: '+1% Luck per level', stat: 'luck', perLevel: 0.01 },
    meshColor: 0xFF8A65, unlocked: true
  },
  {
    id: 'gunslinger', name: 'Gunslinger', description: 'Crit scaling glass cannon.',
    startingWeapon: 'revolver', baseHp: 70, baseSpeed: 6, baseArmor: 0,
    passive: { name: 'Crit Happens', description: '+1% Crit per level', stat: 'crit', perLevel: 0.01 },
    meshColor: 0xFFA726, unlocked: false, unlockCondition: 'Kill 7,500 total enemies'
  },
  {
    id: 'skeleton', name: 'Skeleton', description: 'Attack speed scaling rattle bones.',
    startingWeapon: 'bone_toss', baseHp: 60, baseSpeed: 6, baseArmor: 0,
    passive: { name: 'Rattled', description: '+1% Attack Speed per level', stat: 'attackSpeed', perLevel: 0.01 },
    meshColor: 0xFAFAFA, unlocked: false, unlockCondition: 'Survive 10 min as Knight'
  },
  {
    id: 'aura_chad', name: 'Aura Chad', description: 'AoE damage specialist.',
    startingWeapon: 'aura', baseHp: 100, baseSpeed: 5, baseArmor: 3,
    passive: { name: 'Flex', description: 'Ignore damage if not hit recently', stat: 'flex', perLevel: 0 },
    meshColor: 0xE040FB, unlocked: false, unlockCondition: 'Clear Forest Tier 1'
  },
  {
    id: 'speed_demon', name: 'Speed Demon', description: 'Damage scales with move speed.',
    startingWeapon: 'katana', baseHp: 60, baseSpeed: 9, baseArmor: 0,
    passive: { name: 'Speed Freak', description: 'Damage scales with move speed', stat: 'speedDamage', perLevel: 0.02 },
    meshColor: 0x76FF03, unlocked: false, unlockCondition: 'Clear Desert Tier 1'
  },
]
