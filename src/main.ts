// Main game initialization and loop
// Ties together the ECS world, systems, UI, and game loop.

import { addComponent, hasComponent, defineQuery } from 'bitecs'
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
import { entityCollisionSystem } from './systems/movement/EntityCollisionSystem'

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
import { cameraSystem, cameraInputSystem } from './systems/rendering/CameraSystem'
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
import { createPlayer, createWeaponEntity } from './prefabs/player'
import { createShrine, createChest } from './prefabs/interactables'

// Components
import { PlayerStats } from './components/stats'
import { AutoAttack, Health, Invincible } from './components/combat'
import { PlayerControlled } from './components/movement'
import { Transform } from './components/spatial'
import { IsEnemy, DestroyFlag } from './components/tags'

// UI
import { HUD } from './ui/HUD'
import { UpgradeMenu } from './ui/UpgradeMenu'
import { DeathScreen } from './ui/DeathScreen'
import { DamageNumbers } from './ui/DamageNumbers'
import { CharacterSelect } from './ui/CharacterSelect'
import { QuestLog } from './ui/QuestLog'
import { DebugPanel } from './ui/DebugPanel'

// Data
import { TOMES, TomeDef } from './data/tomes'
import { CHARACTERS, CharacterDef } from './data/characters'
import { WEAPONS } from './data/weapons'
import {
  WEAPON_DAMAGE_PER_LEVEL,
  WEAPON_PROJ_MILESTONE,
  WEAPON_COOLDOWN_MILESTONE,
  WEAPON_COOLDOWN_REDUCTION,
  MAX_WEAPON_LEVEL,
  MAX_TOME_LEVEL,
  LEVELUP_CHOICE_COUNT,
} from './data/balance'

// ── Level-Up Choice Types ───────────────────────────────────────────────────

export type LevelUpChoice =
  | { type: 'weapon_upgrade'; weaponKey: string; weaponEid: number; currentLevel: number }
  | { type: 'new_weapon'; weaponKey: string }
  | { type: 'tome_upgrade'; tomeId: string; currentLevel: number }
  | { type: 'new_tome'; tome: TomeDef }

/**
 * Build the pool of possible level-up choices and pick LEVELUP_CHOICE_COUNT random ones.
 */
function generateChoices(world: GameWorld): LevelUpChoice[] {
  const pool: LevelUpChoice[] = []

  // 1. Weapon upgrades: occupied slots with level < MAX
  for (const slot of world.player.weaponSlots) {
    if (slot && slot.level < MAX_WEAPON_LEVEL) {
      pool.push({ type: 'weapon_upgrade', weaponKey: slot.weaponKey, weaponEid: slot.eid, currentLevel: slot.level })
    }
  }

  // 2. New weapons: if any weapon slot is empty, add one choice per unequipped weapon
  const hasEmptyWeaponSlot = world.player.weaponSlots.some(s => s === null)
  if (hasEmptyWeaponSlot) {
    const equippedWeapons = new Set(
      world.player.weaponSlots.filter(s => s !== null).map(s => s!.weaponKey)
    )
    for (const key of Object.keys(WEAPONS)) {
      if (!equippedWeapons.has(key)) {
        pool.push({ type: 'new_weapon', weaponKey: key })
      }
    }
  }

  // 3. Tome upgrades: occupied slots with level < MAX
  for (const slot of world.player.tomeSlots) {
    if (slot && slot.level < MAX_TOME_LEVEL) {
      pool.push({ type: 'tome_upgrade', tomeId: slot.id, currentLevel: slot.level })
    }
  }

  // 4. New tomes: if any tome slot is empty, add one choice per unequipped tome
  const hasEmptyTomeSlot = world.player.tomeSlots.some(s => s === null)
  if (hasEmptyTomeSlot) {
    const equippedTomes = new Set(
      world.player.tomeSlots.filter(s => s !== null).map(s => s!.id)
    )
    for (const tome of TOMES) {
      if (!equippedTomes.has(tome.id)) {
        pool.push({ type: 'new_tome', tome })
      }
    }
  }

  // Pick random from pool
  const count = Math.min(LEVELUP_CHOICE_COUNT, pool.length)
  const copy = pool.slice()
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (copy.length - i))
    const tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy.slice(0, count)
}

/**
 * Recompute all weapon entity stats based on slot levels + player tome bonuses.
 */
export function recomputeWeaponStats(world: GameWorld): void {
  const playerEid = world.player.eid
  if (playerEid < 0) return

  for (const slot of world.player.weaponSlots) {
    if (!slot) continue
    const weid = slot.eid
    const weapon = WEAPONS[slot.weaponKey]
    if (!weapon) continue
    const level = slot.level

    const baseDamage = weapon.damage * (1 + WEAPON_DAMAGE_PER_LEVEL * (level - 1))
    const baseProjCount = weapon.projectileCount + Math.floor((level - 1) / WEAPON_PROJ_MILESTONE)
    const baseCooldown = weapon.cooldown * Math.max(0.2, 1 - WEAPON_COOLDOWN_REDUCTION * Math.floor((level - 1) / WEAPON_COOLDOWN_MILESTONE))
    const baseProjSpeed = weapon.projectileSpeed

    AutoAttack.damage[weid] = baseDamage
    AutoAttack.projectileCount[weid] = baseProjCount + PlayerStats.projCountBonus[playerEid]
    AutoAttack.cooldown[weid] = baseCooldown * Math.max(0.1, PlayerStats.cooldownMult[playerEid])
    AutoAttack.projectileSpeed[weid] = baseProjSpeed * PlayerStats.projSpeedMult[playerEid]
  }
}

/**
 * Apply a tome bonus to the player's stats/components.
 * Weapon-affecting stats (attackSpeed, projectileCount, projSpeed) now only set
 * PlayerStats multipliers — actual weapon values are applied by recomputeWeaponStats.
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
      PlayerStats.projCountBonus[eid] = Math.floor(val * tomeLevel)
      break
    case 'lifesteal':
      PlayerStats.lifesteal[eid] = val * tomeLevel
      break
    case 'goldGain':
      PlayerStats.goldGain[eid] = 1.0 + val * tomeLevel
      break
    case 'projSpeed':
      PlayerStats.projSpeedMult[eid] = 1.0 + val * tomeLevel
      break
  }
}

/**
 * Apply a level-up choice to the world.
 */
function applyChoice(world: GameWorld, choice: LevelUpChoice): void {
  switch (choice.type) {
    case 'weapon_upgrade': {
      for (const slot of world.player.weaponSlots) {
        if (slot && slot.eid === choice.weaponEid) {
          slot.level++
          break
        }
      }
      recomputeWeaponStats(world)
      break
    }
    case 'new_weapon': {
      const idx = world.player.weaponSlots.indexOf(null)
      if (idx !== -1) {
        const weid = createWeaponEntity(world, choice.weaponKey, idx, world.player.eid)
        world.player.weaponSlots[idx] = { eid: weid, weaponKey: choice.weaponKey, level: 1 }
        recomputeWeaponStats(world)
      }
      break
    }
    case 'tome_upgrade': {
      for (const slot of world.player.tomeSlots) {
        if (slot && slot.id === choice.tomeId) {
          slot.level++
          const tomeDef = TOMES.find(t => t.id === choice.tomeId)
          if (tomeDef) applyTome(world, tomeDef, slot.level)
          break
        }
      }
      recomputeWeaponStats(world)
      break
    }
    case 'new_tome': {
      const idx = world.player.tomeSlots.indexOf(null)
      if (idx !== -1) {
        world.player.tomeSlots[idx] = { id: choice.tome.id, level: 1 }
        applyTome(world, choice.tome, 1)
        recomputeWeaponStats(world)
      }
      break
    }
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

  // 7. Create player with selected character (also creates starter weapon entity)
  createPlayer(world, 0, 0, selectedCharacter)

  // 8. Spawn interactables (shrines, chests)
  spawnInteractables(world)

  // 9. Create UI
  const hud = new HUD()
  const upgradeMenu = new UpgradeMenu()
  const deathScreen = new DeathScreen()
  const damageNumbers = new DamageNumbers()
  const questLog = new QuestLog()

  // 9b. Debug panel
  const debugEnemyQuery = defineQuery([IsEnemy])
  let godModeActive = false

  const debugPanel = new DebugPanel({
    skipTime(seconds: number) {
      world.time.gameTimer = Math.max(0, world.time.gameTimer - seconds)
      world.time.elapsed += seconds
    },
    addXP(amount: number) {
      world.player.xp += amount
    },
    addGold(amount: number) {
      world.player.gold += amount
    },
    healPlayer() {
      const eid = world.player.eid
      if (eid >= 0) Health.current[eid] = Health.max[eid]
    },
    killAllEnemies() {
      const enemies = debugEnemyQuery(world)
      for (const eid of enemies) {
        addComponent(world, DestroyFlag, eid)
      }
      world.player.kills += enemies.length
    },
    toggleGodMode() {
      godModeActive = !godModeActive
    },
  })

  // 10. Create VFX managers
  const particleManager = new ParticleManager()
  const _postProcessing = new PostProcessingManager()

  // 11. Set up event listeners

  // Level-up flow: pause, show mixed choices, apply selection, resume
  eventBus.on('player:levelup', (_data) => {
    world.paused = true
    gameLoop.pause()

    const choices = generateChoices(world)

    upgradeMenu.show(choices, (selected: LevelUpChoice) => {
      // Apply the choice
      applyChoice(world, selected)

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
          recomputeWeaponStats(world)
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
    cameraInputSystem()
    playerInputSystem(world, dt)
    aiFollowSystem(world, dt)
    movementSystem(world, dt)
    entityCollisionSystem(world, dt)
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

    // God mode: keep player invincible and at full HP
    if (godModeActive && world.player.eid >= 0) {
      const eid = world.player.eid
      Health.current[eid] = Health.max[eid]
      if (!hasComponent(world, Invincible, eid)) {
        addComponent(world, Invincible, eid)
      }
      Invincible.timer[eid] = 1.0
    }

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
    debugPanel.update(world)
    sceneManager.render()
  }

  // 14. Pointer lock on canvas click for camera control
  const canvas = sceneManager.renderer.domElement
  canvas.addEventListener('click', () => {
    if (!input.isPointerLocked) {
      input.requestPointerLock(canvas)
    }
  })

  // 15. Start game loop
  gameLoop.setCallbacks(update, render)
  gameLoop.start()
}

main()
