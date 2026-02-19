# Megabonk Clone — Architecture Design

## Stack

- **Vite + TypeScript** — HMR, fast builds, GitHub Pages deploy
- **Three.js** — rendering, shaders, post-processing
- **Rapier WASM** — physics, collision detection
- **Tone.js** — procedural audio synthesis
- **bitECS** — lightweight ECS framework (typed arrays, fast queries)

---

## Why bitECS

Rather than hand-rolling ECS, we use [bitECS](https://github.com/NateTheGreatt/bitECS). It gives us:
- Components as typed arrays (cache-friendly, fast iteration over 1000+ entities)
- Archetypes and queries built-in
- ~5kb gzipped, zero dependencies
- Simple API that Claude Code can generate mechanically

---

## Project Structure

```
src/
├── main.ts                     # Init renderer, world, start game loop
├── world.ts                    # bitECS world + Rapier physics world creation
│
├── core/
│   ├── GameLoop.ts             # Fixed timestep (60hz) + variable render
│   ├── InputManager.ts         # Keyboard/mouse/gamepad → action map
│   ├── EventBus.ts             # Typed pub/sub for decoupled communication
│   ├── EntityFactory.ts        # Prefab functions: createPlayer(), createEnemy(), etc.
│   └── SceneManager.ts         # Three.js scene, manages mesh ↔ entity mapping
│
├── components/
│   ├── spatial.ts              # Transform, Velocity, AngularVelocity
│   ├── physics.ts              # RigidBody, Collider (refs into Rapier world)
│   ├── combat.ts               # Health, Damage, AutoAttack, DamageOnContact, Knockback
│   ├── movement.ts             # PlayerControlled, AIFollow, AIWander, Homing
│   ├── lifecycle.ts            # Lifetime, DestroyFlag, SpawnCooldown
│   ├── loot.ts                 # XPValue, DropTable, Pickup, Magnet
│   ├── rendering.ts            # MeshRef, ParticleEmitter, FlashOnHit, ScaleAnim
│   ├── tags.ts                 # Tag components: IsPlayer, IsEnemy, IsProjectile, IsBoss, IsPickup
│   └── upgrades.ts             # WeaponSlots, PassiveEffects, StatModifiers
│
├── systems/
│   ├── input/
│   │   └── PlayerInputSystem.ts        # InputManager → Velocity for PlayerControlled entities
│   │
│   ├── movement/
│   │   ├── MovementSystem.ts           # Transform += Velocity * dt
│   │   ├── AIFollowSystem.ts           # AIFollow entities → set Velocity toward target
│   │   ├── AIWanderSystem.ts           # Random movement for idle enemies
│   │   └── HomingSystem.ts             # Homing projectiles steer toward nearest enemy
│   │
│   ├── physics/
│   │   ├── PhysicsSyncSystem.ts        # Write Transform → Rapier bodies (pre-step)
│   │   ├── PhysicsStepSystem.ts        # Rapier world.step()
│   │   ├── PhysicsReadSystem.ts        # Read Rapier bodies → Transform (post-step)
│   │   └── CollisionEventSystem.ts     # Read Rapier contact events → EventBus
│   │
│   ├── combat/
│   │   ├── AutoAttackSystem.ts         # Ticks cooldowns, spawns projectiles via EntityFactory
│   │   ├── DamageSystem.ts             # On collision: apply Damage, reduce Health, emit events
│   │   ├── KnockbackSystem.ts          # Apply impulse on hit
│   │   ├── HealthSystem.ts             # Check Health ≤ 0 → set DestroyFlag, emit "entity:died"
│   │   └── InvincibilitySystem.ts      # Brief i-frames after taking damage
│   │
│   ├── spawning/
│   │   ├── WaveSystem.ts               # Wave timer, difficulty curve, spawn budgets
│   │   ├── EnemySpawnerSystem.ts       # Picks types from budget, calls EntityFactory
│   │   └── BossSpawnSystem.ts          # Boss triggers at wave thresholds
│   │
│   ├── progression/
│   │   ├── XPSystem.ts                 # Pickup XP → accumulate → emit "player:levelup"
│   │   ├── UpgradeSystem.ts            # On levelup: pause, present choices, apply StatModifiers
│   │   └── PickupMagnetSystem.ts       # Nearby pickups accelerate toward player
│   │
│   ├── rendering/
│   │   ├── RenderSyncSystem.ts         # Transform → Three.js mesh position/rotation
│   │   ├── CameraSystem.ts             # Follow player, screen shake, zoom
│   │   ├── FlashSystem.ts              # FlashOnHit → briefly swap material
│   │   ├── ScaleAnimSystem.ts          # Juice: bounce on spawn/pickup
│   │   └── DestroyCleanupSystem.ts     # DestroyFlag → remove mesh, remove Rapier body, remove entity
│   │
│   ├── vfx/
│   │   ├── ParticleSystem.ts           # GPU instanced particles, shader-driven
│   │   ├── TrailSystem.ts              # Ribbon trails on projectiles
│   │   └── PostProcessingSystem.ts     # Bloom, chromatic aberration, vignette
│   │
│   └── audio/
│       ├── SFXSystem.ts                # EventBus → Tone.js synth triggers (hit, kill, pickup, levelup)
│       └── MusicSystem.ts              # Procedural ambient layers, intensity follows wave count
│
├── prefabs/
│   ├── player.ts               # createPlayer(world, characterDef) → eid
│   ├── enemies.ts              # createGoblin(), createSkeleton(), etc → eid
│   ├── projectiles.ts          # createBullet(), createBone(), createFireball() → eid
│   ├── pickups.ts              # createXPGem(), createChest() → eid
│   └── props.ts                # createCrate(), createPot() → eid
│
├── data/
│   ├── characters.ts           # { name, baseStats, passive, startingWeapon }
│   ├── weapons.ts              # { name, damage, speed, pattern, projectilePrefab }
│   ├── items.ts                # { name, statModifiers, description, rarity }
│   ├── enemies.ts              # { name, health, speed, damage, xp, spawnWeight }
│   ├── waves.ts                # { waveNumber, budget, enemyPool, bossAt }
│   └── balance.ts              # Tuning constants: XP curve, scaling factors
│
├── ui/
│   ├── HUD.ts                  # HTML overlay: HP bar, XP bar, timer, kill count, level
│   ├── UpgradeMenu.ts          # Level-up card selection (3 choices), pauses game loop
│   ├── MainMenu.ts             # Title screen, character select
│   ├── DeathScreen.ts          # Run summary: time survived, kills, items collected
│   └── DamageNumbers.ts        # Floating damage numbers (CSS transforms, pooled)
│
├── world/
│   ├── MapGenerator.ts         # Procedural heightmap terrain with ramps, platforms
│   ├── PropPlacer.ts           # Scatter destructible props across map
│   └── Skybox.ts               # Simple procedural gradient or cubemap
│
├── shaders/
│   ├── particle.vert           # GPU particle vertex shader
│   ├── particle.frag           # GPU particle fragment shader
│   ├── dissolve.frag           # Enemy death dissolve effect
│   └── outline.frag            # Pickup/item glow outline
│
└── utils/
    ├── math.ts                 # lerp, clamp, randomRange, vec3 helpers
    ├── pool.ts                 # Object pool for frequent alloc (damage numbers, particles)
    └── debug.ts                # FPS counter, entity count, toggle wireframes
```

---

## System Execution Order

Each frame runs systems in this exact order. Order matters — earlier systems produce data that later systems consume.

```
1.  PlayerInputSystem          # Read input → set player velocity
2.  AIFollowSystem             # AI decides velocity
3.  AIWanderSystem             # Idle AI movement
4.  HomingSystem               # Steer homing projectiles
5.  MovementSystem             # Apply velocity to transform
6.  PhysicsSyncSystem          # Push transforms → Rapier
7.  PhysicsStepSystem          # Rapier solves constraints
8.  PhysicsReadSystem          # Pull Rapier results → transforms
9.  CollisionEventSystem       # Emit collision events
10. AutoAttackSystem           # Tick cooldowns, spawn projectiles
11. DamageSystem               # Process collisions → apply damage
12. KnockbackSystem            # Apply hit impulses
13. InvincibilitySystem        # Tick i-frames
14. HealthSystem               # Check deaths, set DestroyFlag
15. XPSystem                   # Process pickups
16. PickupMagnetSystem         # Pull nearby pickups
17. UpgradeSystem              # Handle level-ups (may pause)
18. WaveSystem                 # Advance wave timer
19. EnemySpawnerSystem         # Spawn enemies for current wave
20. BossSpawnSystem            # Spawn boss if threshold met
21. LifetimeSystem             # Decrement Lifetime, flag expired
22. --- RENDER BOUNDARY ---
23. RenderSyncSystem           # Transform → Three.js meshes
24. CameraSystem               # Update camera follow + shake
25. FlashSystem                # Hit flash materials
26. ScaleAnimSystem            # Bounce/scale juice
27. ParticleSystem             # Update GPU particles
28. TrailSystem                # Update ribbon trails
29. PostProcessingSystem       # Screen-wide effects
30. DestroyCleanupSystem       # Remove flagged entities from everything
31. --- AUDIO (async, non-blocking) ---
32. SFXSystem                  # Trigger sounds from events
33. MusicSystem                # Adjust music intensity
```

---

## Component Definitions

All components are bitECS-style typed arrays. Each component is defined with `defineComponent()`.

```ts
// spatial.ts
export const Transform = defineComponent({
  x: Types.f32, y: Types.f32, z: Types.f32,
  rotX: Types.f32, rotY: Types.f32, rotZ: Types.f32,
  scaleX: Types.f32, scaleY: Types.f32, scaleZ: Types.f32,
})

export const Velocity = defineComponent({
  x: Types.f32, y: Types.f32, z: Types.f32,
})

// combat.ts
export const Health = defineComponent({
  current: Types.f32,
  max: Types.f32,
  armor: Types.f32,
})

export const AutoAttack = defineComponent({
  damage: Types.f32,
  range: Types.f32,
  cooldown: Types.f32,      // seconds between attacks
  cooldownTimer: Types.f32,  // current timer
  pattern: Types.ui8,        // enum: 0=nearest, 1=radial, 2=forward, 3=random
})

export const DamageOnContact = defineComponent({
  amount: Types.f32,
  knockback: Types.f32,
  pierce: Types.ui8,         // how many entities it can hit before dying
})

// movement.ts
export const PlayerControlled = defineComponent({
  moveSpeed: Types.f32,
  jumpForce: Types.f32,
  slideCooldown: Types.f32,
  slideTimer: Types.f32,
})

export const AIFollow = defineComponent({
  targetEid: Types.eid,
  speed: Types.f32,
  aggroRange: Types.f32,
})

// lifecycle.ts
export const Lifetime = defineComponent({
  remaining: Types.f32,
})

// Tags — zero-size, used for filtering queries
export const IsPlayer = defineComponent()
export const IsEnemy = defineComponent()
export const IsProjectile = defineComponent()
export const IsBoss = defineComponent()
export const IsPickup = defineComponent()
```

---

## Entity ↔ Three.js ↔ Rapier Mapping

bitECS entities are just integer IDs. We need to bridge them to Three.js meshes and Rapier bodies.

```ts
// SceneManager.ts
const meshMap = new Map<number, THREE.Object3D>()   // eid → mesh
const bodyMap = new Map<number, RapierRigidBody>()   // eid → physics body

// When creating an entity:
//   1. addEntity(world) → eid
//   2. addComponent(world, Transform, eid) + set values
//   3. Create Three.js mesh → meshMap.set(eid, mesh)
//   4. Create Rapier body → bodyMap.set(eid, body)

// RenderSyncSystem reads Transform, looks up meshMap, sets mesh.position
// PhysicsSyncSystem reads Transform, looks up bodyMap, sets body translation
// DestroyCleanupSystem removes from all maps + disposes mesh + removes body
```

---

## Data-Driven Content

All game content is pure config objects. No logic in data files.

```ts
// data/weapons.ts
export const WEAPONS: WeaponDef[] = [
  {
    id: "bone",
    name: "Bone Toss",
    damage: 8,
    cooldown: 1.2,
    pattern: "nearest",
    projectile: "bone",
    knockback: 1.5,
    upgrades: ["critChance", "critDamage", "cooldown"],
  },
  {
    id: "shotgun",
    name: "Shotgun",
    damage: 4,
    cooldown: 2.0,
    pattern: "forward_spread",
    projectile: "pellet",
    projectileCount: 5,
    spreadAngle: 30,
    knockback: 3.0,
    upgrades: ["damage", "projectileCount", "knockback"],
  },
  // ... more weapons
]

// data/enemies.ts
export const ENEMIES: EnemyDef[] = [
  {
    id: "goblin",
    name: "Goblin",
    health: 15,
    speed: 3.5,
    damage: 5,
    xpValue: 3,
    spawnWeight: 10,   // common
    mesh: "goblin",    // key into AssetManager
  },
  // ...
]
```

---

## Event Bus

Typed events keep systems decoupled.

```ts
type GameEvents = {
  "entity:died":       { eid: number, position: Vec3, wasEnemy: boolean }
  "entity:damaged":    { eid: number, amount: number, position: Vec3, isCrit: boolean }
  "player:levelup":    { level: number, xpTotal: number }
  "player:died":       { timeAlive: number, kills: number }
  "pickup:collected":  { eid: number, type: string, value: number }
  "wave:started":      { waveNumber: number }
  "wave:bossSpawned":  { bossId: string }
  "upgrade:selected":  { upgradeId: string }
}
```

VFX, audio, and UI systems subscribe to these — they never import combat or spawning code directly.

---

## Procedural Audio Design (Tone.js)

No audio files. Everything is synthesized.

```
Hit sounds:      Noise burst + low sine sweep (vary pitch by damage)
Kill sounds:     Short FM synth pop + noise tail
Pickup:          Rising sine chirp (pitch by XP value)
Level up:        Arpeggio chord stab (major triad)
Boss warning:    Low rumble drone + rising tension
Player hurt:     Distorted square pulse
Dash/slide:      Filtered white noise whoosh
Background:      Layered drones + arpeggios, intensity scales with wave number
```

---

## Performance Budget

Target: **60fps with 500+ enemies on screen**

- Enemies use InstancedMesh (one draw call per enemy type)
- Pickups use InstancedMesh (one draw call for all XP gems)
- Particles are GPU-driven (single Points mesh + custom shader)
- Rapier handles broad-phase; we only process narrow contacts
- bitECS typed arrays keep iteration cache-friendly
- Object pooling for damage numbers, projectiles, particles
- Frustum culling via Three.js built-in

---

## Deploy

```bash
# vite.config.ts
export default defineConfig({
  base: "/<repo-name>/",  # GitHub Pages subpath
})

# Build + deploy
vite build                 # → dist/
# Push dist/ to gh-pages branch (or use gh-pages npm package)
```

---

## Dev Workflow

```bash
npm create vite@latest megabonk-clone -- --template vanilla-ts
cd megabonk-clone
npm install three @dimforge/rapier3d tone bitecs
npm install -D @types/three
npm run dev                # HMR on localhost:5173
```
