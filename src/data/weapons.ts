export interface WeaponDef {
  id: string;
  name: string;
  damage: number;
  cooldown: number;
  range: number;
  /** Attack pattern: 0=nearest, 1=forward, 2=radial, 3=forward_spread, 4=orbit, 5=aura, 6=trail, 7=homing */
  pattern: number;
  knockback: number;
  projectileCount: number;
  projectileSpeed: number;
  projectileLifetime: number;
  projectileSize: number;
  /** Spread angle in degrees for forward_spread pattern */
  spreadAngle?: number;
  /** Number of chain targets for chain lightning */
  chainCount?: number;
  /** Projectile mesh color (hex) */
  meshColor?: number;
  /** Numeric weapon index used by AutoAttack.weaponId */
  weaponIndex: number;
}

export const WEAPONS: Record<string, WeaponDef> = {
  sword: {
    id: "sword",
    name: "Sword",
    damage: 8,
    cooldown: 1.2,
    range: 2.5,
    pattern: 1, // forward
    knockback: 2.0,
    projectileCount: 1,
    projectileSpeed: 12,
    projectileLifetime: 0.15,
    projectileSize: 1.5,
    meshColor: 0xFFF176,
    weaponIndex: 0,
  },
  bow: {
    id: "bow",
    name: "Bow",
    damage: 6,
    cooldown: 0.8,
    range: 20,
    pattern: 0, // nearest
    knockback: 1.0,
    projectileCount: 1,
    projectileSpeed: 25,
    projectileLifetime: 2.0,
    projectileSize: 0.2,
    meshColor: 0xFFF176,
    weaponIndex: 1,
  },
  revolver: {
    id: "revolver",
    name: "Revolver",
    damage: 5,
    cooldown: 1.5,
    range: 18,
    pattern: 0, // nearest
    knockback: 1.5,
    projectileCount: 6,
    projectileSpeed: 30,
    projectileLifetime: 1.5,
    projectileSize: 0.15,
    meshColor: 0xFFFFFF,
    weaponIndex: 2,
  },
  bone_toss: {
    id: "bone_toss",
    name: "Bone Toss",
    damage: 8,
    cooldown: 1.2,
    range: 15,
    pattern: 0, // nearest
    knockback: 4.0,
    projectileCount: 1,
    projectileSpeed: 15,
    projectileLifetime: 1.5,
    projectileSize: 0.3,
    meshColor: 0xFAFAFA,
    weaponIndex: 3,
  },
  aura: {
    id: "aura",
    name: "Aura",
    damage: 3,
    cooldown: 0.5,
    range: 4.0,
    pattern: 5, // aura
    knockback: 0.5,
    projectileCount: 1,
    projectileSpeed: 0,
    projectileLifetime: 0.3,
    projectileSize: 4.0,
    meshColor: 0xCE93D8,
    weaponIndex: 4,
  },
  katana: {
    id: "katana",
    name: "Katana",
    damage: 4,
    cooldown: 0.3,
    range: 2.0,
    pattern: 1, // forward
    knockback: 1.0,
    projectileCount: 1,
    projectileSpeed: 14,
    projectileLifetime: 0.1,
    projectileSize: 1.0,
    meshColor: 0x80DEEA,
    weaponIndex: 5,
  },
  lightning_staff: {
    id: "lightning_staff",
    name: "Lightning Staff",
    damage: 7,
    cooldown: 1.8,
    range: 16,
    pattern: 0, // nearest
    knockback: 1.0,
    projectileCount: 1,
    projectileSpeed: 20,
    projectileLifetime: 1.0,
    projectileSize: 0.3,
    chainCount: 3,
    meshColor: 0xFFEB3B,
    weaponIndex: 6,
  },
  flamewalker: {
    id: "flamewalker",
    name: "Flamewalker",
    damage: 5,
    cooldown: 0.3,
    range: 1.5,
    pattern: 6, // trail
    knockback: 0.0,
    projectileCount: 1,
    projectileSpeed: 0,
    projectileLifetime: 2.0,
    projectileSize: 0.5,
    meshColor: 0xFF5722,
    weaponIndex: 7,
  },
  shotgun: {
    id: "shotgun",
    name: "Shotgun",
    damage: 4,
    cooldown: 2.0,
    range: 12,
    pattern: 3, // forward_spread
    knockback: 2.0,
    projectileCount: 5,
    projectileSpeed: 20,
    projectileLifetime: 0.8,
    projectileSize: 0.15,
    spreadAngle: 30,
    meshColor: 0xFFF176,
    weaponIndex: 8,
  },
  boomerang: {
    id: "boomerang",
    name: "Boomerang",
    damage: 6,
    cooldown: 1.5,
    range: 15,
    pattern: 1, // forward
    knockback: 1.5,
    projectileCount: 1,
    projectileSpeed: 15,
    projectileLifetime: 1.5,
    projectileSize: 0.4,
    meshColor: 0x76FF03,
    weaponIndex: 9,
  },
  frostwalker: {
    id: "frostwalker",
    name: "Frostwalker",
    damage: 9,
    cooldown: 2.0,
    range: 5.0,
    pattern: 5, // aura
    knockback: 1.0,
    projectileCount: 1,
    projectileSpeed: 0,
    projectileLifetime: 0.5,
    projectileSize: 5.0,
    meshColor: 0x80D8FF,
    weaponIndex: 10,
  },
  dice: {
    id: "dice",
    name: "Dice",
    damage: 3,
    cooldown: 1.0,
    range: 14,
    pattern: 0, // nearest
    knockback: 1.0,
    projectileCount: 1,
    projectileSpeed: 18,
    projectileLifetime: 1.5,
    projectileSize: 0.3,
    meshColor: 0xE040FB,
    weaponIndex: 11,
  },
};
