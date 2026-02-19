// Main game initialization and loop
// Ties together the ECS world, systems, UI, and game loop.

import { createGameWorld } from './world'
import type { GameWorld } from './world'
import { input } from './core/InputManager'
import { gameLoop } from './core/GameLoop'
import { eventBus } from './core/EventBus'
import { sceneManager } from './core/SceneManager'

// Systems
import { playerInputSystem } from './systems/input/PlayerInputSystem'
import { aiFollowSystem } from './systems/movement/AIFollowSystem'
import { movementSystem } from './systems/movement/MovementSystem'
import { autoAttackSystem } from './systems/combat/AutoAttackSystem'
import { damageSystem } from './systems/combat/DamageSystem'
import { invincibilitySystem } from './systems/combat/InvincibilitySystem'
import { healthSystem } from './systems/combat/HealthSystem'
import { xpSystem } from './systems/progression/XPSystem'
import { enemySpawnerSystem } from './systems/spawning/EnemySpawnerSystem'
import { lifetimeSystem } from './systems/lifecycle/LifetimeSystem'
import { renderSyncSystem } from './systems/rendering/RenderSyncSystem'
import { cameraSystem } from './systems/rendering/CameraSystem'
import { flashSystem } from './systems/rendering/FlashSystem'
import { gameTimerSystem } from './systems/rendering/GameTimerSystem'
import { destroyCleanupSystem } from './systems/rendering/DestroyCleanupSystem'

// Prefabs
import { createPlayer } from './prefabs/player'

// UI
import { HUD } from './ui/HUD'
import { UpgradeMenu } from './ui/UpgradeMenu'
import { DeathScreen } from './ui/DeathScreen'
import { DamageNumbers } from './ui/DamageNumbers'

// Data
import { TOMES, TomeDef } from './data/tomes'

/**
 * Pick `count` random items from an array with no duplicates.
 * Uses Fisher-Yates partial shuffle on a copy.
 */
function pickRandom<T>(arr: readonly T[], count: number): T[] {
  const copy = arr.slice()
  const n = Math.min(count, copy.length)
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (copy.length - i))
    const tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy.slice(0, n)
}

async function main(): Promise<void> {
  // 1. Get container element
  const container = document.getElementById('app')!

  // 2. Initialize SceneManager (creates renderer, scene, camera, lights, ground)
  sceneManager.init(container)

  // 3. InputManager is auto-initialized in its constructor (binds key listeners)

  // 4. Create game world
  const world: GameWorld = createGameWorld()

  // 5. Create player at origin
  createPlayer(world, 0, 0)

  // 6. Create UI
  const hud = new HUD()
  const upgradeMenu = new UpgradeMenu()
  const deathScreen = new DeathScreen()
  const damageNumbers = new DamageNumbers()

  // ── Stat tracking for applied tomes ────────────────────────────────
  // Each key maps to the cumulative number of times the player has picked
  // that tome. Systems can later read this to compute final stats.
  const appliedTomes: Record<string, number> = {}

  // 7. Set up event listeners

  // Level-up flow: pause, show 3 random tomes, apply choice, resume
  eventBus.on('player:levelup', (_data) => {
    world.paused = true
    gameLoop.pause()

    const choices = pickRandom(TOMES, 3)

    upgradeMenu.show(choices, (selected: TomeDef) => {
      // Track the selection
      if (appliedTomes[selected.id] === undefined) {
        appliedTomes[selected.id] = 0
      }
      appliedTomes[selected.id]++

      console.log(
        `[Tome] ${selected.name} picked (level ${appliedTomes[selected.id]}): ` +
        `${selected.isPercent ? '+' + (selected.perLevel * 100).toFixed(0) + '%' : '+' + selected.perLevel} ${selected.stat}`
      )

      upgradeMenu.hide()
      world.paused = false
      gameLoop.resume()
    })
  })

  // Death flow: show the death screen with final stats
  eventBus.on('player:died', (data) => {
    world.paused = true
    gameLoop.pause()

    deathScreen.show({
      timeAlive: data.timeAlive,
      kills: data.kills,
      level: world.player.level,
      gold: world.player.gold,
    })
  })

  // Damage numbers: spawn a floating number at the hit position
  eventBus.on('entity:damaged', (data) => {
    damageNumbers.spawn(
      data.x,
      data.y,
      data.z,
      data.amount,
      data.isCrit,
      sceneManager.camera,
    )
  })

  // 8. Update function (fixed timestep, called at 60 Hz)
  function update(dt: number): void {
    if (world.paused) return

    world.time.delta = dt
    world.time.elapsed += dt

    // Run all systems in order
    input.update()
    playerInputSystem(world, dt)
    aiFollowSystem(world, dt)
    movementSystem(world, dt)
    autoAttackSystem(world, dt)
    damageSystem(world, dt)
    invincibilitySystem(world, dt)
    healthSystem(world, dt)
    xpSystem(world, dt)
    enemySpawnerSystem(world, dt)
    lifetimeSystem(world, dt)
    gameTimerSystem(world, dt)

    // Reset input edge triggers at end of fixed step
    input.resetEdgeTriggers()
  }

  // 9. Render function (called every rAF frame, variable rate)
  function render(_alpha: number): void {
    renderSyncSystem(world, 0)
    cameraSystem(world, 0)
    flashSystem(world, world.time.delta)
    damageNumbers.update(world.time.delta)
    destroyCleanupSystem(world, 0)
    hud.update(world)
    sceneManager.render()
  }

  // 10. Start game loop
  gameLoop.setCallbacks(update, render)
  gameLoop.start()
}

main()
