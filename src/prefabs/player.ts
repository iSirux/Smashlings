import * as THREE from 'three'
import { addEntity, addComponent } from 'bitecs'
import { Transform, Velocity, initTransform } from '../components/spatial'
import { IsPlayer } from '../components/tags'
import { Health } from '../components/combat'
import { AutoAttack } from '../components/combat'
import { PlayerControlled } from '../components/movement'
import { WEAPONS } from '../data/weapons'
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
 * Sets up all player components and attaches a capsule mesh.
 * Returns the new entity id.
 */
export function createPlayer(world: GameWorld, x: number, z: number): number {
  const eid = addEntity(world)

  // ── Spatial ──────────────────────────────────────────────────────────
  addComponent(world, Transform, eid)
  initTransform(eid, x, 1, z)

  addComponent(world, Velocity, eid)

  // ── Tags ─────────────────────────────────────────────────────────────
  addComponent(world, IsPlayer, eid)

  // ── Health ───────────────────────────────────────────────────────────
  addComponent(world, Health, eid)
  Health.current[eid] = PLAYER_HP
  Health.max[eid] = PLAYER_HP
  Health.armor[eid] = 0

  // ── Movement ─────────────────────────────────────────────────────────
  addComponent(world, PlayerControlled, eid)
  PlayerControlled.moveSpeed[eid] = PLAYER_SPEED
  PlayerControlled.jumpForce[eid] = PLAYER_JUMP_FORCE
  PlayerControlled.dashCooldown[eid] = PLAYER_DASH_COOLDOWN
  PlayerControlled.dashTimer[eid] = 0
  PlayerControlled.dashDuration[eid] = PLAYER_DASH_DURATION
  PlayerControlled.dashSpeed[eid] = PLAYER_DASH_SPEED
  PlayerControlled.isDashing[eid] = 0
  PlayerControlled.isGrounded[eid] = 1
  PlayerControlled.jumpsRemaining[eid] = 2
  PlayerControlled.maxJumps[eid] = 2

  // ── Auto-Attack (Sword) ──────────────────────────────────────────────
  const sword = WEAPONS.sword
  addComponent(world, AutoAttack, eid)
  AutoAttack.damage[eid] = sword.damage
  AutoAttack.range[eid] = sword.range
  AutoAttack.cooldown[eid] = sword.cooldown
  AutoAttack.cooldownTimer[eid] = 0
  AutoAttack.pattern[eid] = sword.pattern
  AutoAttack.knockback[eid] = sword.knockback
  AutoAttack.projectileCount[eid] = sword.projectileCount

  // ── Mesh ─────────────────────────────────────────────────────────────
  const geometry = new THREE.CapsuleGeometry(0.4, 1.0, 8, 16)
  const material = new THREE.MeshStandardMaterial({ color: 0x4FC3F7 })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.position.set(x, 1, z)
  sceneManager.addMesh(eid, mesh)

  // ── World reference ──────────────────────────────────────────────────
  world.player.eid = eid

  return eid
}
