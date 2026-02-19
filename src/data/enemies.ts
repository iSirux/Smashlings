export interface EnemyDef {
  id: string
  name: string
  health: number
  speed: number
  damage: number
  xpValue: number
  spawnWeight: number
  meshColor: number // hex color
  meshScale: [number, number, number]
  isBoss?: boolean
}

export const ENEMIES: EnemyDef[] = [
  {
    id: 'goblin',
    name: 'Goblin',
    health: 15,
    speed: 3.5,
    damage: 5,
    xpValue: 3,
    spawnWeight: 10,
    meshColor: 0x66BB6A,
    meshScale: [0.6, 0.8, 0.6],
  },
  {
    id: 'goblin_brute',
    name: 'Goblin Brute',
    health: 40,
    speed: 2.5,
    damage: 12,
    xpValue: 8,
    spawnWeight: 4,
    meshColor: 0x43A047,
    meshScale: [1.0, 1.2, 1.0],
  },
  {
    id: 'bat',
    name: 'Bat',
    health: 8,
    speed: 5.0,
    damage: 3,
    xpValue: 2,
    spawnWeight: 8,
    meshColor: 0xEF5350,
    meshScale: [0.3, 0.3, 0.3],
  },
  {
    id: 'wolf',
    name: 'Wolf',
    health: 20,
    speed: 4.5,
    damage: 7,
    xpValue: 4,
    spawnWeight: 5,
    meshColor: 0x8D6E63,
    meshScale: [0.5, 0.4, 0.8],
  },
]

// Index by id for easy lookup
export const ENEMY_INDEX: Record<string, number> = {}
ENEMIES.forEach((e, i) => ENEMY_INDEX[e.id] = i)
