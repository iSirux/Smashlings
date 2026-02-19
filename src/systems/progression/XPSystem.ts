import { defineQuery, addComponent, hasComponent } from 'bitecs'
import { IsPickup, IsXPGem, DestroyFlag } from '../../components/tags'
import { Transform, Velocity } from '../../components/spatial'
import { XPValue } from '../../components/lifecycle'
import { distanceSq } from '../../utils/math'
import { eventBus } from '../../core/EventBus'
import {
  XP_MAGNET_RANGE,
  XP_MAGNET_SPEED,
  PICKUP_RANGE,
  BASE_XP,
  XP_SCALING,
} from '../../data/balance'
import type { GameWorld } from '../../world'

const xpGemQuery = defineQuery([IsPickup, IsXPGem, Transform, XPValue])

const MAGNET_RANGE_SQ = XP_MAGNET_RANGE * XP_MAGNET_RANGE
const PICKUP_RANGE_SQ = PICKUP_RANGE * PICKUP_RANGE

/**
 * Handles XP gem attraction, collection, and player level-up logic.
 */
export function xpSystem(world: GameWorld, dt: number): void {
  const playerEid = world.player.eid
  if (playerEid < 0) return

  const plx = Transform.x[playerEid]
  const plz = Transform.z[playerEid]

  const gems = xpGemQuery(world)

  for (let i = 0; i < gems.length; i++) {
    const eid = gems[i]

    if (hasComponent(world, DestroyFlag, eid)) continue

    // Apply gravity and ground clamping to gems
    Velocity.y[eid] -= 20 * dt
    if (Transform.y[eid] <= 0.3) {
      Transform.y[eid] = 0.3
      Velocity.y[eid] = 0
    }

    const gx = Transform.x[eid]
    const gz = Transform.z[eid]

    const dSq = distanceSq(plx, plz, gx, gz)

    // Collection check (innermost range first for efficiency)
    if (dSq < PICKUP_RANGE_SQ) {
      const amount = XPValue.amount[eid]
      world.player.xp += amount

      addComponent(world, DestroyFlag, eid)

      eventBus.emit('pickup:collected', {
        eid,
        type: 'xp',
        value: amount,
      })

      // Check for level-up (can level up multiple times in one frame)
      while (world.player.xp >= world.player.xpToNext) {
        world.player.xp -= world.player.xpToNext
        world.player.level++
        world.player.xpToNext = Math.floor(
          BASE_XP * (1 + XP_SCALING * world.player.level),
        )

        eventBus.emit('player:levelup', {
          level: world.player.level,
        })
      }

      continue
    }

    // Magnet pull check
    if (dSq < MAGNET_RANGE_SQ && dSq > 0.0001) {
      const dist = Math.sqrt(dSq)
      const nx = (plx - gx) / dist
      const nz = (plz - gz) / dist

      Velocity.x[eid] = nx * XP_MAGNET_SPEED
      Velocity.z[eid] = nz * XP_MAGNET_SPEED
    }
  }
}
