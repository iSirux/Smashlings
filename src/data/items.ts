export interface ItemDef {
  id: string
  name: string
  description: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  effects: Array<{ stat: string; value: number; isPercent: boolean }>
}

export const ITEMS: ItemDef[] = [
  { id: 'sucky_magnet', name: 'Sucky Magnet', description: 'Periodically pulls all XP toward player', rarity: 'common', effects: [{ stat: 'pickupRange', value: 5, isPercent: false }] },
  { id: 'turbo_socks', name: 'Turbo Socks', description: '+15% Move Speed', rarity: 'common', effects: [{ stat: 'moveSpeed', value: 0.15, isPercent: true }] },
  { id: 'anvil', name: 'Anvil', description: '+20% Damage', rarity: 'rare', effects: [{ stat: 'damage', value: 0.20, isPercent: true }] },
  { id: 'moldy_cheese', name: 'Moldy Cheese', description: '+5% damage over time to enemies', rarity: 'common', effects: [{ stat: 'damage', value: 0.05, isPercent: true }] },
  { id: 'giant_fork', name: 'Giant Fork', description: '+50% Crit Damage', rarity: 'rare', effects: [{ stat: 'critDamage', value: 0.5, isPercent: false }] },
  { id: 'spiky_shield', name: 'Spiky Shield', description: '+5% Thorns, +5% Armor', rarity: 'common', effects: [{ stat: 'thorns', value: 0.05, isPercent: false }, { stat: 'armor', value: 5, isPercent: false }] },
  { id: 'leeching_crystal', name: 'Leeching Crystal', description: '+10% Lifesteal', rarity: 'uncommon', effects: [{ stat: 'lifesteal', value: 0.10, isPercent: false }] },
  { id: 'boss_buster', name: 'Boss Buster', description: '+50% damage to bosses', rarity: 'rare', effects: [{ stat: 'bossDamage', value: 0.50, isPercent: true }] },
  { id: 'forbidden_juice', name: 'Forbidden Juice', description: '+25% Crit Damage, -10% Max HP', rarity: 'epic', effects: [{ stat: 'critDamage', value: 0.25, isPercent: false }, { stat: 'maxHp', value: -0.10, isPercent: true }] },
  { id: 'battery', name: 'Battery', description: '+10% Attack Speed', rarity: 'common', effects: [{ stat: 'attackSpeed', value: 0.10, isPercent: true }] },
  { id: 'idle_juice', name: 'Idle Juice', description: '+100% Damage while standing still', rarity: 'epic', effects: [{ stat: 'idleDamage', value: 1.0, isPercent: true }] },
  { id: 'gym_sauce', name: 'Gym Sauce', description: '+20 Max HP', rarity: 'common', effects: [{ stat: 'maxHp', value: 20, isPercent: false }] },
  { id: 'phantom_shroud', name: 'Phantom Shroud', description: '+15% Evasion', rarity: 'rare', effects: [{ stat: 'evasion', value: 0.15, isPercent: false }] },
  { id: 'cursed_doll', name: 'Cursed Doll', description: '+30% Damage, +15% damage taken', rarity: 'epic', effects: [{ stat: 'damage', value: 0.30, isPercent: true }] },
  { id: 'the_key', name: 'The Key', description: '+1 item from every chest', rarity: 'uncommon', effects: [] },
  { id: 'echo_shard', name: 'Echo Shard', description: '+7% XP Gain', rarity: 'uncommon', effects: [{ stat: 'xpGain', value: 0.07, isPercent: true }] },
  { id: 'mirror', name: 'Mirror', description: 'Brief invincibility when taking damage', rarity: 'rare', effects: [] },
  { id: 'credit_card', name: 'Credit Card', description: 'Free reroll on level-up', rarity: 'rare', effects: [] },
  { id: 'soul_harvester', name: 'Soul Harvester', description: 'Kills extend the timer by 0.5s', rarity: 'legendary', effects: [] },
  { id: 'kevin', name: 'Kevin', description: 'Takes 1 HP/s but triggers on-hit effects', rarity: 'rare', effects: [{ stat: 'regen', value: -1, isPercent: false }] },
]

export const RARITY_COLORS: Record<string, string> = {
  common: '#B0B0B0',
  uncommon: '#4FC3F7',
  rare: '#AB47BC',
  epic: '#FF7043',
  legendary: '#FFD54F',
}
