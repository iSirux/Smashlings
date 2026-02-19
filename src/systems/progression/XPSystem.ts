import { defineQuery, addComponent, hasComponent } from 'bitecs'
import { IsPickup, IsXPGem, DestroyFlag } from '../../components/tags'
import { Transform, Velocity } from '../../components/spatial'
import { XPValue } from '../../components/lifecycle'
import { PlayerStats } from '../../components/stats'
import { distanceSq } from '../../utils/math'
import { eventBus } from '../../core/EventBus'
import {
  XP_MAGNET_SPEED,
  BASE_XP,
  XP_SCALING,
} from '../../data/balance'
import type { GameWorld } from '../../world'

const xpGemQuery = defineQuery([IsPickup, IsXPGem, Transform, XPValue])

/**
 * Handles XP gem attraction, collection, and player level-up logic.
 */
export function xpSystem(world: GameWorld, dt: number): void {
  const playerEid = world.player.eid
  if (playerEid < 0) return

  const plx = Transform.x[playerEid]
  const plz = Transform.z[playerEid]

  const pickupRange = PlayerStats.pickupRange[playerEid]
  const pickupRangeSq = pickupRange * pickupRange
  // Magnet range is always at least pickup range (pull starts outside collection)
  const magnetRange = pickupRange + 3
  const magnetRangeSq = magnetRange * magnetRange

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
    if (dSq < pickupRangeSq) {
      const baseAmount = XPValue.amount[eid]
      const xpGain = PlayerStats.xpGain[playerEid] || 1.0
      const diffXpMult = world.difficulty.xpMult
      const cursed = PlayerStats.cursedMult[playerEid] || 0
      const amount = baseAmount * xpGain * diffXpMult * (1 + cursed)
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
    if (dSq < magnetRangeSq && dSq > 0.0001) {
      const dist = Math.sqrt(dSq)
      const nx = (plx - gx) / dist
      const nz = (plz - gz) / dist

      Velocity.x[eid] = nx * XP_MAGNET_SPEED
      Velocity.z[eid] = nz * XP_MAGNET_SPEED
    }
  }
}
