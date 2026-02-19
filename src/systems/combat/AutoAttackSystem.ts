import { defineQuery } from 'bitecs'
import { AutoAttack } from '../../components/combat'
import { Transform } from '../../components/spatial'
import { IsPlayer } from '../../components/tags'
import { createSwordSlash } from '../../prefabs/projectiles'
import type { GameWorld } from '../../world'

const playerAttackQuery = defineQuery([AutoAttack, Transform, IsPlayer])

/**
 * Ticks auto-attack cooldowns and fires weapons when ready.
 */
export function autoAttackSystem(world: GameWorld, dt: number): void {
  const entities = playerAttackQuery(world)

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]

    // Tick cooldown
    AutoAttack.cooldownTimer[eid] -= dt

    if (AutoAttack.cooldownTimer[eid] <= 0) {
      // Reset cooldown
      AutoAttack.cooldownTimer[eid] = AutoAttack.cooldown[eid]

      const pattern = AutoAttack.pattern[eid]

      if (pattern === 1) {
        // Forward / sword slash
        const rotY = Transform.rotY[eid]
        const dirX = Math.sin(rotY)
        const dirZ = Math.cos(rotY)

        const spawnDist = 1.5
        const px = Transform.x[eid] + dirX * spawnDist
        const py = Transform.y[eid] + 0.5
        const pz = Transform.z[eid] + dirZ * spawnDist

        const damage = AutoAttack.damage[eid]
        const knockback = AutoAttack.knockback[eid]

        createSwordSlash(world, px, py, pz, dirX, dirZ, damage, knockback)
      }
    }
  }
}
