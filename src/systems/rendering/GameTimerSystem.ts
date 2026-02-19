import type { GameWorld } from '../../world'

/**
 * Counts down the global game timer each frame.
 *
 * The game timer starts at 600 seconds (10 minutes).  When it reaches
 * zero the "Final Swarm" phase would begin -- for the MVP we simply
 * clamp it to 0 and stop decrementing.
 */
export function gameTimerSystem(world: GameWorld, dt: number): void {
  if (world.time.gameTimer <= 0) return

  world.time.gameTimer -= dt

  if (world.time.gameTimer < 0) {
    world.time.gameTimer = 0
  }
}
