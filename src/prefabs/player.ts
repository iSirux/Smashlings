import * as THREE from 'three'
import { addEntity, addComponent } from 'bitecs'
import { Transform, Velocity, Collider, initTransform } from '../components/spatial'
import { IsPlayer } from '../components/tags'
import { Health, AutoAttack, WeaponSlot } from '../components/combat'
import { PlayerControlled } from '../components/movement'
import { PlayerStats } from '../components/stats'
import { WEAPONS } from '../data/weapons'
import { CHARACTERS, CharacterDef } from '../data/characters'
import {
  PLAYER_HP,
  PLAYER_SPEED,
  PLAYER_JUMP_FORCE,
  PLAYER_DASH_SPEED,
  PLAYER_DASH_DURATION,
  PLAYER_DASH_COOLDOWN,
} from '../data/balance'
import { sceneManager } from '../core/SceneManager'
import type { GameWorld } from '../world'

/**
 * Create a weapon entity linked to the player via WeaponSlot.
 * Returns the new entity id.
 */
export function createWeaponEntity(world: GameWorld, weaponKey: string, slotIndex: number, playerEid: number): number {
  const weid = addEntity(world)
  const weapon = WEAPONS[weaponKey] || WEAPONS.sword

  addComponent(world, AutoAttack, weid)
  AutoAttack.damage[weid] = weapon.damage
  AutoAttack.range[weid] = weapon.range
  AutoAttack.cooldown[weid] = weapon.cooldown
  AutoAttack.cooldownTimer[weid] = 0
  AutoAttack.pattern[weid] = weapon.pattern
  AutoAttack.knockback[weid] = weapon.knockback
  AutoAttack.projectileCount[weid] = weapon.projectileCount
  AutoAttack.projectileSpeed[weid] = weapon.projectileSpeed
  AutoAttack.weaponId[weid] = weapon.weaponIndex

  addComponent(world, WeaponSlot, weid)
  WeaponSlot.ownerEid[weid] = playerEid
  WeaponSlot.slotIndex[weid] = slotIndex

  return weid
}

/**
 * Create the player entity at the given XZ position.
 * Optionally accepts a CharacterDef for character-specific stats/weapon/color.
 * Returns the new entity id.
 */
export function createPlayer(world: GameWorld, x: number, z: number, character?: CharacterDef): number {
  const eid = addEntity(world)
  const charDef = character ?? CHARACTERS[0] // default to Knight

  // ── Spatial ──────────────────────────────────────────────────────────
  addComponent(world, Transform, eid)
  const playerTerrainY = sceneManager.getTerrainHeight(x, z)
  initTransform(eid, x, playerTerrainY + 0.9, z)

  addComponent(world, Velocity, eid)

  addComponent(world, Collider, eid)
  Collider.radius[eid] = 0.4
  Collider.halfHeight[eid] = 0.9

  // ── Tags ─────────────────────────────────────────────────────────────
  addComponent(world, IsPlayer, eid)

  // ── Health ───────────────────────────────────────────────────────────
  const hp = charDef.baseHp || PLAYER_HP
  addComponent(world, Health, eid)
  Health.current[eid] = hp
  Health.max[eid] = hp
  Health.armor[eid] = charDef.baseArmor || 0

  // ── Movement ─────────────────────────────────────────────────────────
  addComponent(world, PlayerControlled, eid)
  PlayerControlled.moveSpeed[eid] = charDef.baseSpeed || PLAYER_SPEED
  PlayerControlled.jumpForce[eid] = PLAYER_JUMP_FORCE
  PlayerControlled.dashCooldown[eid] = PLAYER_DASH_COOLDOWN
  PlayerControlled.dashTimer[eid] = 0
  PlayerControlled.dashDuration[eid] = PLAYER_DASH_DURATION
  PlayerControlled.dashSpeed[eid] = PLAYER_DASH_SPEED
  PlayerControlled.isDashing[eid] = 0
  PlayerControlled.isGrounded[eid] = 1
  PlayerControlled.jumpsRemaining[eid] = 2
  PlayerControlled.maxJumps[eid] = 2

  // ── PlayerStats (computed bonuses from tomes/items) ────────────────
  addComponent(world, PlayerStats, eid)
  PlayerStats.critChance[eid] = 0.05 // base 5% crit
  PlayerStats.critDamage[eid] = 2.0
  PlayerStats.evasion[eid] = 0
  PlayerStats.regen[eid] = 0
  PlayerStats.lifesteal[eid] = 0
  PlayerStats.luck[eid] = 0
  PlayerStats.xpGain[eid] = 1.0
  PlayerStats.goldGain[eid] = 1.0
  PlayerStats.pickupRange[eid] = 3.0
  PlayerStats.damageMult[eid] = 1.0
  PlayerStats.speedMult[eid] = 1.0
  PlayerStats.cooldownMult[eid] = 1.0
  PlayerStats.knockbackMult[eid] = 1.0
  PlayerStats.projCountBonus[eid] = 0
  PlayerStats.projSpeedMult[eid] = 1.0
  PlayerStats.sizeMult[eid] = 1.0
  PlayerStats.durationMult[eid] = 1.0
  PlayerStats.cursedMult[eid] = 0
  PlayerStats.bossDamageMult[eid] = 0
  PlayerStats.idleDamageMult[eid] = 0
  PlayerStats.speedDamageMult[eid] = 0
  PlayerStats.flexTimer[eid] = 0

  // ── Mesh ─────────────────────────────────────────────────────────────
  const geometry = new THREE.CapsuleGeometry(0.4, 1.0, 8, 16)
  const material = new THREE.MeshStandardMaterial({ color: charDef.meshColor })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.position.set(x, playerTerrainY + 0.9, z)
  sceneManager.addMesh(eid, mesh)

  // ── World reference ──────────────────────────────────────────────────
  world.player.eid = eid

  // ── Starter weapon entity ────────────────────────────────────────────
  const weaponKey = charDef.startingWeapon || 'sword'
  const weid = createWeaponEntity(world, weaponKey, 0, eid)
  world.player.weaponSlots[0] = { eid: weid, weaponKey, level: 1 }

  return eid
}
