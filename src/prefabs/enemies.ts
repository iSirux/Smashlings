import * as THREE from 'three'
import { addEntity, addComponent, hasComponent } from 'bitecs'
import { Transform, Velocity, Collider, initTransform } from '../components/spatial'
import { IsEnemy, IsBoss } from '../components/tags'
import { Health, DamageOnContact, EnemyAttack, EnemyRangedAttack, BossPhase } from '../components/combat'
import { AIFollow } from '../components/movement'
import { PlayerStats } from '../components/stats'
import { EnemyType } from '../components/lifecycle'
import { ENEMIES } from '../data/enemies'
import { sceneManager } from '../core/SceneManager'
import type { GameWorld } from '../world'

/**
 * Create an enemy entity from the ENEMIES data table.
 * The enemyIndex corresponds to the index in the ENEMIES array.
 * Returns the new entity id.
 */
export function createEnemy(world: GameWorld, enemyIndex: number, x: number, z: number): number {
  const eid = addEntity(world)
  const def = ENEMIES[enemyIndex]

  // ── Spatial ──────────────────────────────────────────────────────────
  addComponent(world, Transform, eid)
  const halfH = def.meshScale[1] * 0.5
  const enemyTerrainY = sceneManager.getTerrainHeight(x, z)
  initTransform(eid, x, enemyTerrainY + halfH, z)

  addComponent(world, Velocity, eid)

  addComponent(world, Collider, eid)
  Collider.radius[eid] = Math.max(def.meshScale[0], def.meshScale[2]) * 0.5
  Collider.halfHeight[eid] = halfH

  // ── Tags ─────────────────────────────────────────────────────────────
  addComponent(world, IsEnemy, eid)

  if (def.isBoss) {
    addComponent(world, IsBoss, eid)
  }

  // ── Health (scaled by difficulty + cursed tome) ─────────────────────
  const diff = world.difficulty
  const playerEid = world.player.eid
  const cursed = (playerEid >= 0 && hasComponent(world, PlayerStats, playerEid))
    ? PlayerStats.cursedMult[playerEid] : 0
  const cursedScale = 1 + cursed // cursed increases enemy stats too

  addComponent(world, Health, eid)
  Health.current[eid] = def.health * diff.enemyHpMult * cursedScale
  Health.max[eid] = def.health * diff.enemyHpMult * cursedScale
  Health.armor[eid] = 0

  // ── Contact damage (scaled by difficulty + cursed) ─────────────────
  addComponent(world, DamageOnContact, eid)
  DamageOnContact.amount[eid] = def.damage * diff.enemyDmgMult * cursedScale
  DamageOnContact.knockback[eid] = 0
  DamageOnContact.pierce[eid] = 255 // enemies can hit unlimited times
  DamageOnContact.hitCount[eid] = 0

  // ── AI (scaled by difficulty) ──────────────────────────────────────
  addComponent(world, AIFollow, eid)
  AIFollow.targetEid[eid] = world.player.eid
  AIFollow.speed[eid] = def.speed * diff.enemySpeedMult
  AIFollow.behavior[eid] = def.aiBehavior ?? 0
  AIFollow.preferredDist[eid] = def.preferredRange ?? 0
  AIFollow.orbitAngle[eid] = Math.random() * Math.PI * 2 // stagger orbits

  // ── Melee attack state machine (conditional) ──────────────────────
  if (!def.noMelee) {
    addComponent(world, EnemyAttack, eid)
    EnemyAttack.state[eid] = 0  // idle
    EnemyAttack.timer[eid] = 0
    EnemyAttack.dirX[eid] = 0
    EnemyAttack.dirZ[eid] = 0
  }

  // ── Ranged attack (conditional) ────────────────────────────────────
  if (def.rangedAttack) {
    const ra = def.rangedAttack
    addComponent(world, EnemyRangedAttack, eid)
    EnemyRangedAttack.cooldown[eid] = ra.cooldown
    EnemyRangedAttack.cooldownTimer[eid] = ra.cooldown * Math.random() // stagger initial
    EnemyRangedAttack.damage[eid] = ra.damage * diff.enemyDmgMult * cursedScale
    EnemyRangedAttack.projectileSpeed[eid] = ra.projectileSpeed
    EnemyRangedAttack.projectileType[eid] = ra.projectileType
    EnemyRangedAttack.minRange[eid] = ra.minRange
  }

  // ── Boss phase (conditional) ───────────────────────────────────────
  if (def.bossConfig) {
    addComponent(world, BossPhase, eid)
    BossPhase.phase[eid] = 0
    BossPhase.attackTimer[eid] = 0
    BossPhase.patternTimer[eid] = 0
    BossPhase.patternIndex[eid] = 0
  }

  // ── Enemy type identifier ────────────────────────────────────────────
  addComponent(world, EnemyType, eid)
  EnemyType.id[eid] = enemyIndex

  // ── Mesh ─────────────────────────────────────────────────────────────
  let geometry: THREE.BufferGeometry

  if (def.isBoss) {
    // Bosses use sphere geometry with strong emissive glow
    const radius = Math.max(def.meshScale[0], def.meshScale[1], def.meshScale[2]) * 0.5
    geometry = new THREE.SphereGeometry(radius, 16, 16)
  } else if (def.isMiniBoss) {
    // Mini-bosses use sphere geometry with moderate emissive glow
    const radius = Math.max(def.meshScale[0], def.meshScale[1], def.meshScale[2]) * 0.5
    geometry = new THREE.SphereGeometry(radius, 12, 12)
  } else {
    geometry = new THREE.BoxGeometry(
      def.meshScale[0],
      def.meshScale[1],
      def.meshScale[2],
    )
  }

  const materialOpts: THREE.MeshStandardMaterialParameters = { color: def.meshColor }
  if (def.isBoss) {
    materialOpts.emissive = def.meshColor
    materialOpts.emissiveIntensity = 0.5
  } else if (def.isMiniBoss) {
    materialOpts.emissive = def.meshColor
    materialOpts.emissiveIntensity = 0.3
  }
  const material = new THREE.MeshStandardMaterial(materialOpts)

  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.position.set(x, enemyTerrainY + halfH, z)
  sceneManager.addMesh(eid, mesh)

  return eid
}
