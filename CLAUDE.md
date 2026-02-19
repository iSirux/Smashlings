# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — Type-check with `tsc` then bundle with Vite
- `npm run preview` — Preview the production build locally
- No test runner or linter is configured

## Deployment

Pushes to `main` auto-deploy to GitHub Pages via `.github/workflows/deploy.yml`. The Vite `base` is `/smashlings/`.

## Architecture

This is a **Vampire Survivors-style 3D browser game** built with:
- **bitecs** — Entity Component System (ECS) for game state
- **Three.js** — 3D rendering
- **Rapier3D** — Physics (dependency present, not yet integrated)
- **Vite + TypeScript** — Build toolchain

### ECS Pattern

All game state lives in bitecs SoA (struct-of-arrays) components. Entity behavior is driven by **systems** — pure functions with signature `(world: GameWorld, dt: number) => void`. Systems are called in explicit order each fixed tick from `main.ts`.

**Components** (`src/components/`): Define data schemas via `defineComponent`. Tags (zero-size components like `IsPlayer`, `IsEnemy`) mark entity roles. Data components use typed arrays (`Types.f32`, `Types.ui8`, etc.).

**Systems** (`src/systems/`): Organized by domain — `input/`, `movement/`, `combat/`, `progression/`, `spawning/`, `lifecycle/`, `rendering/`. Each system queries entities by component composition and mutates SoA arrays directly.

**Prefabs** (`src/prefabs/`): Factory functions (`createPlayer`, `createEnemy`, `createSwordSlash`, `createXPGem`) that compose an entity from components, set initial values from data tables, and attach a Three.js mesh via `SceneManager`.

### Core Singletons (`src/core/`)

- **GameLoop** — Fixed-timestep update at 60 Hz with variable-rate rendering. Systems run in the fixed step; rendering runs every rAF.
- **SceneManager** — Owns the Three.js scene, camera, renderer, and the `eid → Object3D` mesh map. Prefabs register meshes here; `DestroyCleanupSystem` removes them.
- **InputManager** — Keyboard input with action bindings (WASD/arrows + space/shift). Exposes `moveDirection` vector and edge-triggered flags (`jumpPressed`, `dashPressed`).
- **EventBus** — Typed pub/sub (`GameEvents` map in `EventBus.ts`). Used for cross-cutting concerns: `player:levelup`, `player:died`, `entity:damaged`, `entity:died`, `pickup:collected`.

### Game World (`src/world.ts`)

`GameWorld` extends bitecs `IWorld` with extra fields: `time` (elapsed, delta, gameTimer countdown), `player` (eid, level, xp, kills, gold), and `paused` flag. Passed to every system.

### Data Tables (`src/data/`)

- `balance.ts` — Tuning constants (player stats, spawn rates, XP curve, camera, physics)
- `enemies.ts` — `EnemyDef[]` with stats, spawn weights, mesh appearance
- `weapons.ts` — `WeaponDef` records (currently just sword)
- `tomes.ts` — `TomeDef[]` upgrade choices shown on level-up

### UI (`src/ui/`)

DOM-based overlay classes (`HUD`, `UpgradeMenu`, `DeathScreen`, `DamageNumbers`) that read ECS state or respond to EventBus events. Not part of the ECS.

### Key Conventions

- **No allocations in hot paths** — `src/utils/math.ts` provides pre-allocated temp vectors (`_v1`, `_v2`, `_v3`). Use `distanceSq` instead of sqrt when comparing distances.
- **Entity destruction** — Add `DestroyFlag` component; `DestroyCleanupSystem` handles removal from both bitecs and SceneManager at end of frame.
- **System execution order matters** — Input → Movement → Combat → Progression → Spawning → Lifecycle → Rendering → Cleanup (see `main.ts` update/render functions).
