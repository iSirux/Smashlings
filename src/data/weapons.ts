export interface WeaponDef {
  id: string
  name: string
  damage: number
  cooldown: number
  range: number
  pattern: number // 0=nearest, 1=forward, 2=radial
  knockback: number
  projectileCount: number
  projectileSpeed: number
  projectileLifetime: number
  projectileSize: number
}

export const WEAPONS: Record<string, WeaponDef> = {
  sword: {
    id: 'sword',
    name: 'Sword',
    damage: 8,
    cooldown: 1.2,
    range: 2.5,
    pattern: 1, // forward
    knockback: 2.0,
    projectileCount: 1,
    projectileSpeed: 0,
    projectileLifetime: 0.15, // short slash
    projectileSize: 1.5,
  },
}
