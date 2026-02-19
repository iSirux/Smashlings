export interface QuestDef {
  id: string
  name: string
  description: string
  type: 'kills' | 'survive' | 'level' | 'gold' | 'collect' | 'clear'
  target: number
  reward: {
    gold: number
    unlock?: string // id of item/character/weapon to unlock
  }
}

export const QUESTS: QuestDef[] = [
  // Kill quests
  { id: 'kills_100', name: 'Pest Control', description: 'Kill 100 enemies', type: 'kills', target: 100, reward: { gold: 50 } },
  { id: 'kills_500', name: 'Exterminator', description: 'Kill 500 enemies', type: 'kills', target: 500, reward: { gold: 150 } },
  { id: 'kills_1000', name: 'Slaughter House', description: 'Kill 1,000 enemies', type: 'kills', target: 1000, reward: { gold: 300 } },
  { id: 'kills_5000', name: 'Genocide', description: 'Kill 5,000 enemies', type: 'kills', target: 5000, reward: { gold: 500, unlock: 'quantity_tome' } },
  { id: 'kills_10000', name: 'Apocalypse', description: 'Kill 10,000 enemies', type: 'kills', target: 10000, reward: { gold: 1000, unlock: 'cursed_tome' } },

  // Survival quests
  { id: 'survive_3', name: 'Survivor', description: 'Survive for 3 minutes', type: 'survive', target: 180, reward: { gold: 30 } },
  { id: 'survive_5', name: 'Endurance', description: 'Survive for 5 minutes', type: 'survive', target: 300, reward: { gold: 75 } },
  { id: 'survive_10', name: 'Iron Will', description: 'Survive for 10 minutes', type: 'survive', target: 600, reward: { gold: 200, unlock: 'skeleton' } },

  // Level quests
  { id: 'level_10', name: 'Getting Stronger', description: 'Reach level 10', type: 'level', target: 10, reward: { gold: 50 } },
  { id: 'level_20', name: 'Powerhouse', description: 'Reach level 20', type: 'level', target: 20, reward: { gold: 150, unlock: 'armor_tome' } },
  { id: 'level_50', name: 'Legendary', description: 'Reach level 50', type: 'level', target: 50, reward: { gold: 500 } },

  // Gold quests
  { id: 'gold_100', name: 'Coin Collector', description: 'Earn 100 gold', type: 'gold', target: 100, reward: { gold: 50 } },
  { id: 'gold_500', name: 'Treasure Hunter', description: 'Earn 500 gold', type: 'gold', target: 500, reward: { gold: 200 } },
  { id: 'gold_2000', name: 'Midas Touch', description: 'Earn 2,000 gold', type: 'gold', target: 2000, reward: { gold: 500 } },

  // Misc
  { id: 'first_boss', name: 'Boss Slayer', description: 'Defeat a boss', type: 'clear', target: 1, reward: { gold: 300, unlock: 'aura_chad' } },
  { id: 'swarm_6', name: 'Swarm Survivor', description: 'Survive 6 minutes in Final Swarm', type: 'survive', target: 960, reward: { gold: 1000, unlock: 'soul_harvester' } },
]
