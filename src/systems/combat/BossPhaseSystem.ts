import { defineQuery, hasComponent } from 'bitecs'
import { IsEnemy, IsPlayer, DestroyFlag } from '../../components/tags'
import { BossPhase, Health, EnemyRangedAttack } from '../../components/combat'
import { EnemyType } from '../../components/lifecycle'
import { Transform } from '../../components/spatial'
import { ENEMY_INDEX } from '../../data/enemies'
import {
  createBossAoE,
  createEnemyProjectile,
  createPoisonCloud,
} from '../../prefabs/enemyProjectiles'
import { createEnemy } from '../../prefabs/enemies'
import type { GameWorld } from '../../world'

const bossQuery = defineQuery([IsEnemy, BossPhase, Health, EnemyType, Transform])
const playerQuery = defineQuery([IsPlayer, Transform])

// Enemy indices (looked up once)
const STONE_GOLEM_IDX = ENEMY_INDEX['stone_golem'] ?? -1
const CHUNKHAM_IDX = ENEMY_INDEX['chunkham'] ?? -1
const LIL_BARK_IDX = ENEMY_INDEX['lil_bark'] ?? -1
const GOBLIN_IDX = ENEMY_INDEX['goblin'] ?? 0

/** Phase thresholds per boss type (HP ratio below which phase advances) */
const PHASE_THRESHOLDS: Record<number, number[]> = {
  [STONE_GOLEM_IDX]: [0.5],
  [CHUNKHAM_IDX]: [0.5],
  [LIL_BARK_IDX]: [0.75, 0.5, 0.25],
}

/**
 * Checks HP ratios to advance boss phases, then dispatches
 * boss-specific attack patterns based on EnemyType.id.
 */
export function bossPhaseSystem(world: GameWorld, dt: number): void {
  const bosses = bossQuery(world)
  const players = playerQuery(world)
  if (players.length === 0) return

  const playerId = players[0]
  const plx = Transform.x[playerId]
  const plz = Transform.z[playerId]

  for (let i = 0; i < bosses.length; i++) {
    const eid = bosses[i]
    if (hasComponent(world, DestroyFlag, eid)) continue

    const enemyIdx = EnemyType.id[eid]
    const hpRatio = Health.current[eid] / Health.max[eid]
    const thresholds = PHASE_THRESHOLDS[enemyIdx]

    // Advance phase based on HP ratio
    if (thresholds) {
      let targetPhase = 0
      for (let t = 0; t < thresholds.length; t++) {
        if (hpRatio <= thresholds[t]) {
          targetPhase = t + 1
        }
      }
      if (targetPhase > BossPhase.phase[eid]) {
        BossPhase.phase[eid] = targetPhase
      }
    }

    const phase = BossPhase.phase[eid]
    if (phase === 0) continue // No active boss phase

    // Tick attack timer
    BossPhase.attackTimer[eid] -= dt
    if (BossPhase.attackTimer[eid] > 0) continue

    const bx = Transform.x[eid]
    const by = Transform.y[eid]
    const bz = Transform.z[eid]

    // ── Stone Golem: phase 1 → ground slam AoE every 5s ──────────
    if (enemyIdx === STONE_GOLEM_IDX) {
      BossPhase.attackTimer[eid] = 5.0
      const damage = hasComponent(world, EnemyRangedAttack, eid)
        ? EnemyRangedAttack.damage[eid] * 1.5
        : 20
      createBossAoE(world, bx, by + 0.1, bz, damage, 4.0, 0x8D6E63)
    }

    // ── Chunkham: phase 1 → 8 radial projectiles every 6s ───────
    else if (enemyIdx === CHUNKHAM_IDX) {
      BossPhase.attackTimer[eid] = 6.0
      const damage = 12
      const speed = 10
      for (let p = 0; p < 8; p++) {
        const angle = (p / 8) * Math.PI * 2
        const dirX = Math.cos(angle)
        const dirZ = Math.sin(angle)
        createEnemyProjectile(world, bx, by + 0.5, bz, dirX, dirZ, damage, speed, 0xFF5722)
      }
    }

    // ── Lil Bark: multi-phase boss ───────────────────────────────
    else if (enemyIdx === LIL_BARK_IDX) {
      if (phase >= 3) {
        // Phase 3: spawn 3 goblins every 8s
        BossPhase.attackTimer[eid] = 8.0
        for (let g = 0; g < 3; g++) {
          const angle = Math.random() * Math.PI * 2
          const spawnDist = 3 + Math.random() * 2
          createEnemy(world, GOBLIN_IDX, bx + Math.cos(angle) * spawnDist, bz + Math.sin(angle) * spawnDist)
        }
      } else if (phase >= 2) {
        // Phase 2: 12-projectile radial burst every 4s
        BossPhase.attackTimer[eid] = 4.0
        const damage = 10
        const speed = 8
        for (let p = 0; p < 12; p++) {
          const angle = (p / 12) * Math.PI * 2
          createEnemyProjectile(world, bx, by + 0.5, bz, Math.cos(angle), Math.sin(angle), damage, speed, 0xAB47BC)
        }
      } else {
        // Phase 1: root eruptions — 3-5 AoE clouds around player
        BossPhase.attackTimer[eid] = 5.0
        const count = 3 + Math.floor(Math.random() * 3)
        const damage = 8
        for (let r = 0; r < count; r++) {
          const ox = plx + (Math.random() - 0.5) * 8
          const oz = plz + (Math.random() - 0.5) * 8
          createPoisonCloud(world, ox, by + 0.1, oz, damage)
        }
      }
    }

    // Unknown boss — just reset timer
    else {
      BossPhase.attackTimer[eid] = 5.0
    }
  }
}
