// Main game initialization and loop
// Ties together the ECS world, systems, UI, and game loop.

import { addComponent, hasComponent } from 'bitecs'
import { createGameWorld } from './world'
import type { GameWorld } from './world'
import { input } from './core/InputManager'
import { gameLoop } from './core/GameLoop'
import { eventBus } from './core/EventBus'
import { sceneManager } from './core/SceneManager'

// Systems — Input
import { playerInputSystem } from './systems/input/PlayerInputSystem'

// Systems — Movement
import { aiFollowSystem } from './systems/movement/AIFollowSystem'
import { movementSystem } from './systems/movement/MovementSystem'

// Systems — Combat
import { autoAttackSystem } from './systems/combat/AutoAttackSystem'
import { damageSystem } from './systems/combat/DamageSystem'
import { invincibilitySystem } from './systems/combat/InvincibilitySystem'
import { healthSystem } from './systems/combat/HealthSystem'
import { regenSystem } from './systems/combat/RegenSystem'

// Systems — Progression
import { xpSystem } from './systems/progression/XPSystem'
import { itemSystem } from './systems/progression/ItemSystem'
import { shrineSystem } from './systems/progression/ShrineSystem'

// Systems — Spawning
import { enemySpawnerSystem } from './systems/spawning/EnemySpawnerSystem'
import { bossSpawnSystem } from './systems/spawning/BossSpawnSystem'
import { finalSwarmSystem } from './systems/spawning/FinalSwarmSystem'

// Systems — Lifecycle
import { lifetimeSystem } from './systems/lifecycle/LifetimeSystem'

// Systems — Rendering
import { renderSyncSystem } from './systems/rendering/RenderSyncSystem'
import { cameraSystem } from './systems/rendering/CameraSystem'
import { flashSystem } from './systems/rendering/FlashSystem'
import { gameTimerSystem } from './systems/rendering/GameTimerSystem'
import { destroyCleanupSystem } from './systems/rendering/DestroyCleanupSystem'

// Systems — VFX
import { ParticleManager } from './systems/vfx/ParticleSystem'
import { PostProcessingManager } from './systems/vfx/PostProcessingSystem'

// Systems — Audio
import { initSFX } from './systems/audio/SFXSystem'
import { initMusic, updateMusic } from './systems/audio/MusicSystem'

// Systems — Quests
import { initQuestSystem, updateSurvivalQuests, updateGoldQuests } from './systems/progression/QuestSystem'

// Prefabs
import { createPlayer } from './prefabs/player'
import { createShrine, createChest } from './prefabs/interactables'

// Components
import { PlayerStats } from './components/stats'
import { AutoAttack, Health } from './components/combat'
import { PlayerControlled } from './components/movement'
import { Transform } from './components/spatial'

// UI
import { HUD } from './ui/HUD'
import { UpgradeMenu } from './ui/UpgradeMenu'
import { DeathScreen } from './ui/DeathScreen'
import { DamageNumbers } from './ui/DamageNumbers'
import { CharacterSelect } from './ui/CharacterSelect'
import { QuestLog } from './ui/QuestLog'

// Data
import { TOMES, TomeDef } from './data/tomes'
import { CHARACTERS, CharacterDef } from './data/characters'
import { WEAPONS } from './data/weapons'

/**
 * Pick `count` random items from an array with no duplicates.
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

/**
 * Apply a tome bonus to the player's stats/components.
 */
function applyTome(world: GameWorld, tome: TomeDef, tomeLevel: number): void {
  const eid = world.player.eid
  if (eid < 0) return

  const val = tome.perLevel

  switch (tome.stat) {
    case 'damage':
      PlayerStats.damageMult[eid] = 1.0 + val * tomeLevel
      break
    case 'attackSpeed':
      PlayerStats.cooldownMult[eid] = 1.0 - val * tomeLevel
      AutoAttack.cooldown[eid] = (WEAPONS[world.player.weaponId]?.cooldown ?? 1.2) * Math.max(0.1, PlayerStats.cooldownMult[eid])
      break
    case 'moveSpeed':
      PlayerStats.speedMult[eid] = 1.0 + val * tomeLevel
      PlayerControlled.moveSpeed[eid] = (CHARACTERS.find(c => c.id === world.player.characterId)?.baseSpeed ?? 6) * PlayerStats.speedMult[eid]
      break
    case 'maxHp': {
      const baseHp = CHARACTERS.find(c => c.id === world.player.characterId)?.baseHp ?? 100
      const newMax = baseHp * (1.0 + val * tomeLevel)
      const ratio = Health.current[eid] / Health.max[eid]
      Health.max[eid] = newMax
      Health.current[eid] = ratio * newMax // preserve HP ratio
      break
    }
    case 'regen':
      PlayerStats.regen[eid] = val * tomeLevel
      break
    case 'crit':
      PlayerStats.critChance[eid] = 0.05 + val * tomeLevel
      break
    case 'knockback':
      PlayerStats.knockbackMult[eid] = 1.0 + val * tomeLevel
      break
    case 'evasion':
      PlayerStats.evasion[eid] = val * tomeLevel
      break
    case 'xpGain':
      PlayerStats.xpGain[eid] = 1.0 + val * tomeLevel
      break
    case 'armor': {
      const baseArmor = CHARACTERS.find(c => c.id === world.player.characterId)?.baseArmor ?? 0
      Health.armor[eid] = baseArmor + baseArmor * val * tomeLevel + val * tomeLevel * 100
      break
    }
    case 'luck':
      PlayerStats.luck[eid] = val * tomeLevel
      break
    case 'projectileCount':
      AutoAttack.projectileCount[eid] = (WEAPONS[world.player.weaponId]?.projectileCount ?? 1) + Math.floor(val * tomeLevel)
      break
    case 'lifesteal':
      PlayerStats.lifesteal[eid] = val * tomeLevel
      break
    case 'thorns':
      PlayerStats.thorns[eid] = val * tomeLevel
      break
    case 'goldGain':
      PlayerStats.goldGain[eid] = 1.0 + val * tomeLevel
      break
    case 'projSpeed':
      AutoAttack.projectileSpeed[eid] = (WEAPONS[world.player.weaponId]?.projectileSpeed ?? 12) * (1.0 + val * tomeLevel)
      break
  }
}

/**
 * Spawn shrines and chests randomly across the map.
 */
function spawnInteractables(world: GameWorld): void {
  const mapRadius = 120
  // 15 shrines
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = 30 + Math.random() * (mapRadius - 30)
    createShrine(world, Math.cos(angle) * dist, Math.sin(angle) * dist)
  }
  // 10 chests
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = 20 + Math.random() * (mapRadius - 20)
    createChest(world, Math.cos(angle) * dist, Math.sin(angle) * dist)
  }
}

async function main(): Promise<void> {
  // 1. Get container element
  const container = document.getElementById('app')!

  // 2. Initialize SceneManager
  sceneManager.init(container)

  // 3. Initialize audio (deferred until user interaction)
  initSFX()
  initMusic()

  // 4. Initialize quest system
  initQuestSystem()

  // 5. Show character select screen
  const characterSelect = new CharacterSelect()

  const selectedCharacter = await new Promise<CharacterDef>((resolve) => {
    characterSelect.show((char) => {
      characterSelect.hide()
      resolve(char)
    })
  })

  // 6. Create game world
  const world: GameWorld = createGameWorld()
  world.player.characterId = selectedCharacter.id
  world.player.weaponId = selectedCharacter.startingWeapon

  // 7. Create player with selected character
  createPlayer(world, 0, 0, selectedCharacter)

  // 8. Spawn interactables (shrines, chests)
  spawnInteractables(world)

  // 9. Create UI
  const hud = new HUD()
  const upgradeMenu = new UpgradeMenu()
  const deathScreen = new DeathScreen()
  const damageNumbers = new DamageNumbers()
  const questLog = new QuestLog()

  // 10. Create VFX managers
  const particleManager = new ParticleManager()
  const _postProcessing = new PostProcessingManager()

  // ── Stat tracking for applied tomes ────────────────────────────────
  const appliedTomes: Record<string, number> = {}

  // 11. Set up event listeners

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

      // Actually apply the stat bonus
      applyTome(world, selected, appliedTomes[selected.id])

      // Apply character passive (if any)
      const charDef = CHARACTERS.find(c => c.id === world.player.characterId)
      if (charDef?.passive.perLevel) {
        const eid = world.player.eid
        const passiveStat = charDef.passive.stat
        const passiveVal = charDef.passive.perLevel * world.player.level
        if (passiveStat === 'armor') Health.armor[eid] += passiveVal
        else if (passiveStat === 'luck') PlayerStats.luck[eid] = passiveVal
        else if (passiveStat === 'crit') PlayerStats.critChance[eid] += passiveVal
        else if (passiveStat === 'attackSpeed') {
          PlayerStats.cooldownMult[eid] = Math.max(0.1, 1.0 - passiveVal)
        }
      }

      upgradeMenu.hide()
      world.paused = false
      gameLoop.resume()
    })
  })

  // Death flow: show the death screen with final stats
  eventBus.on('player:died', (data) => {
    world.paused = true
    gameLoop.pause()

    // Update survival quests
    updateSurvivalQuests(data.timeAlive)
    updateGoldQuests(world.player.gold)

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

  // 12. Update function (fixed timestep, called at 60 Hz)
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
    regenSystem(world, dt)
    xpSystem(world, dt)
    itemSystem(world, dt)
    shrineSystem(world, dt)
    enemySpawnerSystem(world, dt)
    bossSpawnSystem(world, dt)
    finalSwarmSystem(world, dt)
    lifetimeSystem(world, dt)
    gameTimerSystem(world, dt)

    // Update music intensity
    updateMusic(world.time.elapsed, world.time.gameTimer)

    // Reset input edge triggers at end of fixed step
    input.resetEdgeTriggers()
  }

  // 13. Render function (called every rAF frame, variable rate)
  function render(_alpha: number): void {
    renderSyncSystem(world, 0)
    cameraSystem(world, 0)
    flashSystem(world, world.time.delta)
    damageNumbers.update(world.time.delta)

    // Update particles
    const px = Transform.x[world.player.eid] || 0
    const py = Transform.y[world.player.eid] || 0
    const pz = Transform.z[world.player.eid] || 0
    particleManager.update(world.time.delta, px, py, pz)

    destroyCleanupSystem(world, 0)
    hud.update(world)
    sceneManager.render()
  }

  // 14. Start game loop
  gameLoop.setCallbacks(update, render)
  gameLoop.start()
}

main()
