export interface MeleeConfig {
  lungeRange: number
  windupTime: number
  lungeTime: number
  cooldownTime: number
  lungeSpeedMult: number
}

export interface RangedAttackConfig {
  cooldown: number
  damage: number
  projectileSpeed: number
  /** 0=straight, 1=homing, 2=aoe_cloud */
  projectileType: number
  minRange: number
}

export interface BossConfig {
  /** HP ratio thresholds per phase (e.g. [0.75, 0.5, 0.25] for 3 phase transitions) */
  phaseThresholds: number[]
}

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
  isMiniBoss?: boolean
  goldDrop?: number // guaranteed gold drop amount
  /** 0=direct(default), 1=orbit, 2=keepDistance */
  aiBehavior?: number
  preferredRange?: number
  rangedAttack?: RangedAttackConfig
  bossConfig?: BossConfig
  /** If true, no melee EnemyAttack component is added */
  noMelee?: boolean
  meleeConfig?: MeleeConfig
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
    aiBehavior: 1, // orbit
    preferredRange: 8,
    noMelee: true,
    rangedAttack: {
      cooldown: 2.0,
      damage: 4,
      projectileSpeed: 10,
      projectileType: 0, // straight
      minRange: 0,
    },
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
  // ── New regular enemies ────────────────────────────────────────────────
  {
    id: 'mushroom',
    name: 'Mushroom',
    health: 25,
    speed: 1.5,
    damage: 8,
    xpValue: 5,
    spawnWeight: 3,
    meshColor: 0x8D6E63,
    meshScale: [0.5, 0.6, 0.5],
    aiBehavior: 2, // keepDistance
    preferredRange: 4,
    noMelee: true,
    rangedAttack: {
      cooldown: 3.5,
      damage: 6,
      projectileSpeed: 0,
      projectileType: 2, // aoe_cloud
      minRange: 0,
    },
  },
  {
    id: 'ghost',
    name: 'Ghost',
    health: 30,
    speed: 3.0,
    damage: 10,
    xpValue: 6,
    spawnWeight: 2,
    meshColor: 0xB0BEC5,
    meshScale: [0.5, 0.7, 0.5],
    aiBehavior: 2, // keepDistance
    preferredRange: 10,
    noMelee: true,
    rangedAttack: {
      cooldown: 3.0,
      damage: 8,
      projectileSpeed: 8,
      projectileType: 1, // homing
      minRange: 0,
    },
  },
  {
    id: 'tree_ent',
    name: 'Tree Ent',
    health: 60,
    speed: 1.0,
    damage: 15,
    xpValue: 12,
    spawnWeight: 1,
    meshColor: 0x795548,
    meshScale: [1.2, 1.6, 1.2],
  },
  // ── Mini-bosses ────────────────────────────────────────────────────────
  {
    id: 'stone_golem',
    name: 'Stone Golem',
    health: 500,
    speed: 1.5,
    damage: 20,
    xpValue: 100,
    spawnWeight: 0,
    meshColor: 0xFF7043,
    meshScale: [1.5, 1.5, 1.5],
    isMiniBoss: true,
    goldDrop: 20,
    rangedAttack: {
      cooldown: 2.5,
      damage: 15,
      projectileSpeed: 12,
      projectileType: 0, // straight (boulder)
      minRange: 8,
    },
    bossConfig: {
      phaseThresholds: [0.5],
    },
  },
  {
    id: 'chunkham',
    name: 'Chunkham',
    health: 400,
    speed: 3.0,
    damage: 15,
    xpValue: 80,
    spawnWeight: 0,
    meshColor: 0xFF5722,
    meshScale: [1.3, 1.3, 1.3],
    isMiniBoss: true,
    goldDrop: 20,
    meleeConfig: {
      lungeRange: 8,
      windupTime: 0.5,
      lungeTime: 0.4,
      cooldownTime: 0.5,
      lungeSpeedMult: 5.0,
    },
    bossConfig: {
      phaseThresholds: [0.5],
    },
  },
  // ── Bosses ─────────────────────────────────────────────────────────────
  {
    id: 'lil_bark',
    name: 'Lil Bark',
    health: 2000,
    speed: 0.5,
    damage: 25,
    xpValue: 500,
    spawnWeight: 0,
    meshColor: 0xAB47BC,
    meshScale: [3.0, 3.0, 3.0],
    isBoss: true,
    goldDrop: 50,
    bossConfig: {
      phaseThresholds: [0.75, 0.5, 0.25],
    },
  },
]

// Index by id for easy lookup
export const ENEMY_INDEX: Record<string, number> = {}
ENEMIES.forEach((e, i) => ENEMY_INDEX[e.id] = i)
