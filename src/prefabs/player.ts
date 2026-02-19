import * as THREE from 'three'
import { addEntity, addComponent } from 'bitecs'
import { Transform, Velocity, initTransform } from '../components/spatial'
import { IsPlayer } from '../components/tags'
import { Health, AutoAttack } from '../components/combat'
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
 * Create the player entity at the given XZ position.
 * Optionally accepts a CharacterDef for character-specific stats/weapon/color.
 * Returns the new entity id.
 */
export function createPlayer(world: GameWorld, x: number, z: number, character?: CharacterDef): number {
  const eid = addEntity(world)
  const charDef = character ?? CHARACTERS[0] // default to Knight

  // ── Spatial ──────────────────────────────────────────────────────────
  addComponent(world, Transform, eid)
  initTransform(eid, x, 1, z)

  addComponent(world, Velocity, eid)

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

  // ── Auto-Attack (character's starting weapon) ──────────────────────
  const weaponKey = charDef.startingWeapon || 'sword'
  const weapon = WEAPONS[weaponKey] || WEAPONS.sword
  addComponent(world, AutoAttack, eid)
  AutoAttack.damage[eid] = weapon.damage
  AutoAttack.range[eid] = weapon.range
  AutoAttack.cooldown[eid] = weapon.cooldown
  AutoAttack.cooldownTimer[eid] = 0
  AutoAttack.pattern[eid] = weapon.pattern
  AutoAttack.knockback[eid] = weapon.knockback
  AutoAttack.projectileCount[eid] = weapon.projectileCount
  AutoAttack.projectileSpeed[eid] = weapon.projectileSpeed
  AutoAttack.weaponId[eid] = weapon.weaponIndex

  // ── PlayerStats (computed bonuses from tomes/items) ────────────────
  addComponent(world, PlayerStats, eid)
  PlayerStats.critChance[eid] = 0.05 // base 5% crit
  PlayerStats.critDamage[eid] = 2.0
  PlayerStats.evasion[eid] = 0
  PlayerStats.regen[eid] = 0
  PlayerStats.lifesteal[eid] = 0
  PlayerStats.thorns[eid] = 0
  PlayerStats.luck[eid] = 0
  PlayerStats.xpGain[eid] = 1.0
  PlayerStats.goldGain[eid] = 1.0
  PlayerStats.pickupRange[eid] = 3.0
  PlayerStats.damageMult[eid] = 1.0
  PlayerStats.speedMult[eid] = 1.0
  PlayerStats.cooldownMult[eid] = 1.0
  PlayerStats.knockbackMult[eid] = 1.0

  // ── Mesh ─────────────────────────────────────────────────────────────
  const geometry = new THREE.CapsuleGeometry(0.4, 1.0, 8, 16)
  const material = new THREE.MeshStandardMaterial({ color: charDef.meshColor })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.position.set(x, 1, z)
  sceneManager.addMesh(eid, mesh)

  // ── World reference ──────────────────────────────────────────────────
  world.player.eid = eid

  return eid
}
