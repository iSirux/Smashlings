import { defineQuery, hasComponent } from 'bitecs'
import { IsPlayer } from '../../components/tags'
import { Health } from '../../components/combat'
import { PlayerStats } from '../../components/stats'
import type { GameWorld } from '../../world'

const playerQuery = defineQuery([IsPlayer, Health])

export function regenSystem(world: GameWorld, dt: number): void {
  const players = playerQuery(world)
  for (let i = 0; i < players.length; i++) {
    const eid = players[i]
    if (!hasComponent(world, PlayerStats, eid)) continue
    const regen = PlayerStats.regen[eid]
    if (regen > 0 && Health.current[eid] < Health.max[eid]) {
      Health.current[eid] = Math.min(Health.max[eid], Health.current[eid] + regen * dt)
    }
  }
}
