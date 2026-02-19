# Smashlings — Project Brief

> The single source of truth for the project. Claude Code should reference this file first.

## What Is This?

**Smashlings** is a Megabonk-inspired 3D roguelike auto-attack survivor, built as a hobby/prototype project. It runs in the browser and is deployed to GitHub Pages.

- **Repo name:** `smashlings`
- **Live URL:** `https://<username>.github.io/smashlings/`

## Related Design Docs

| Document | Contents |
|----------|----------|
| `ARCHITECTURE.md` | ECS architecture, project structure, system execution order, component definitions, tech stack details |
| `GAMEPLAY_DESIGN.md` | Full gameplay mechanics, characters, weapons, tomes, items, enemies, bosses, progression, damage formulas, MVP phasing |

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| Vite | Build tool, HMR, dev server |
| TypeScript | All source code (strict mode) |
| Three.js | Rendering, shaders, post-processing |
| bitECS | Entity Component System |
| Rapier WASM | Physics, collision detection |
| Tone.js | Procedural audio synthesis |
| GitHub Actions | Auto-deploy to GitHub Pages on push to `main` |

### Setup Commands
```bash
npm create vite@latest smashlings -- --template vanilla-ts
cd smashlings
npm install three @dimforge/rapier3d tone bitecs
npm install -D @types/three
```

### Vite Config
```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/smashlings/',
  build: {
    target: 'esnext',
  },
})
```

### GitHub Actions Deploy
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## Art Style

### Approach: Fully Procedural Geometry
No external assets. Everything is built from Three.js primitives.

### Entity Visual Language

| Entity Type | Shape | Size | Color |
|-------------|-------|------|-------|
| Player | Capsule (CapsuleGeometry) | 1.0 tall, 0.4 radius | `#4FC3F7` (bright blue) |
| Goblin (basic enemy) | Box (0.6 × 0.8 × 0.6) | small | `#66BB6A` (green) |
| Brute enemy | Box (1.0 × 1.2 × 1.0) | large | `#43A047` (dark green) |
| Fast enemy (bat/wolf) | Small sphere (0.3 radius) | tiny | `#EF5350` (red) |
| Tank enemy (ent/golem) | Large box (1.2 × 1.6 × 1.2) | big | `#8D6E63` (brown) |
| Elite variant | Same shape, 1.5x scale | larger | Original color + emissive glow |
| Mini-boss | Sphere (1.5 radius) | very large | `#FF7043` (orange) |
| Boss | Sphere/box (3.0+) | massive | `#AB47BC` (purple) + pulsing emissive |
| Projectile (player) | Small sphere (0.15) | tiny | `#FFF176` (yellow) |
| Projectile (enemy) | Small sphere (0.12) | tiny | `#EF5350` (red) |
| XP Gem | Icosahedron (0.2) | small | `#CE93D8` (light purple), rotates |
| Gold Coin | Cylinder (0.15 × 0.05) | small | `#FFD54F` (gold), rotates |
| Chest | Box (0.8 × 0.6 × 0.6) | medium | `#FFD54F` (gold) |
| Pot/Crate | Box (0.5 × 0.5 × 0.5) | small | `#A1887F` (tan) |
| Shrine | Cylinder (0.5 × 1.5) | tall | `#80CBC4` (teal) + glow |

### Materials
- Use `MeshStandardMaterial` for most entities
- Emissive properties for glowing objects (shrines, elites, bosses, gems)
- `MeshBasicMaterial` for projectiles and particles (cheaper, no lighting needed)
- Hit flash: temporarily swap to white `MeshBasicMaterial` for 50ms

### Terrain
- Ground plane with subtle vertex displacement for hills (Forest)
- Flat plane for Desert
- Color: `#2E7D32` (forest green) / `#D2B48C` (sand)
- Grid or subtle noise texture via shader for visual interest

### Lighting
- Single directional light (sun) — warm white, slight angle
- Ambient light — low intensity, cool tint
- No shadows initially (performance). Add later as polish.

---

## Color Palette

| Role | Hex | Name |
|------|-----|------|
| Player | `#4FC3F7` | Light Blue |
| Enemies (forest) | `#66BB6A` | Green |
| Enemies (desert) | `#FFB74D` | Amber |
| Damage / danger | `#EF5350` | Red |
| XP / magic | `#CE93D8` | Purple |
| Gold / loot | `#FFD54F` | Gold |
| UI accent | `#29B6F6` | Cyan |
| Ground (forest) | `#2E7D32` | Forest Green |
| Ground (desert) | `#D2B48C` | Tan |
| UI background | `#1A1A2E` | Dark Navy |
| UI text | `#E0E0E0` | Light Gray |

---

## Audio Style: Bassy / Modern / Punchy

All audio is procedural via Tone.js. No audio files loaded.

### Synth Patches

| Sound | Synthesis | Notes |
|-------|-----------|-------|
| **Hit (weak)** | Noise burst (50ms) + sine sweep down (200→80Hz, 100ms) | Pitch up for higher damage |
| **Hit (strong/crit)** | Same as hit + additional FM bass stab (60Hz, 80ms) + distortion | Layered for impact |
| **Enemy death** | Short FM pop (150Hz→50Hz, 120ms) + filtered noise tail (200ms) | Satisfying "pop" |
| **XP pickup** | Sine chirp (400→800Hz, 60ms) | Pitch scales with gem value |
| **Level up** | Major triad arpeggio (C-E-G, sawtooth, 300ms) + sub bass (60Hz, 200ms) | Triumphant feel |
| **Dash/slide** | Band-pass filtered white noise (1kHz center, 150ms) + pitch sweep down | Whoosh |
| **Player hurt** | Distorted square wave pulse (100Hz, 80ms) + noise burst | Punchy pain |
| **Boss spawn** | Low sub rumble (30Hz drone, 2s fade in) + rising tension (filtered saw, 100→2kHz, 3s) | Ominous |
| **Boss death** | Reverse crash (noise, 500ms) + massive sub drop (80→20Hz, 1s) + silence gap + chord stab | Dramatic |
| **Chest open** | Rising sine sweep (200→1200Hz, 200ms) + sparkle (high filtered noise, 300ms) | Rewarding |
| **Shrine charge** | Pulsing tone (440Hz, tremolo at 8Hz) that increases in speed as charge completes | Tension/payoff |

### Background Music
- Layered procedural drones (filtered sawtooth, very low volume)
- Intensity scales with wave count / difficulty
- Layer 1 (always): Sub bass drone, 40Hz, slow LFO
- Layer 2 (after 3 min): Pad chord, minor key, slow filter sweep
- Layer 3 (after 6 min): Arpeggiated pulse, eighth notes, adds urgency
- Layer 4 (boss fight): Percussion hits (noise-based kick + hi-hat pattern)
- Layer 5 (Final Swarm): All layers at max intensity + distortion

---

## Control Feel Targets

| Parameter | Value | Notes |
|-----------|-------|-------|
| Move speed (base) | 6 units/s | Feels responsive but not twitchy |
| Sprint speed | 9 units/s | Hold shift while moving (optional, or just dash) |
| Jump height | 3 units | Enough to clear small enemies/obstacles |
| Jump count | 1 (upgradeable to 2–3) | Double jump is a desirable upgrade |
| Dash distance | 5 units | Quick burst |
| Dash cooldown | 2 seconds | Short enough to feel spammable, long enough to matter |
| Dash duration | 200ms | Snappy, not floaty |
| Gravity | -20 units/s² | Slightly heavier than realistic. Snappy landings. |
| Camera follow speed | lerp factor 0.08 | Smooth but not laggy |
| Camera distance | 15 units behind, 10 units up | See enough of the battlefield |
| Camera look-ahead | 3 units in move direction | Player sees more of what's ahead |

---

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│  [HP BAR ████████░░]  ♥ 78/100       ⏱ 7:23       │  ← top bar
│  [XP BAR ██████░░░░]  Lv 12                        │
│                                                     │
│                                                     │
│                                                     │
│                      (3D GAME)                      │
│                                                     │
│                                                     │
│                                                     │
│                                      🗡 Sword Lv3  │  ← bottom right: weapon
│  Kills: 342    Gold: 127             ⚡ x1.5 dmg   │  ← bottom: stats
└─────────────────────────────────────────────────────┘

Level-Up Overlay (pauses game):
┌─────────────────────────────────────────────────────┐
│                   LEVEL UP!                         │
│                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│   │ ⚔ Damage │  │ 🏃 Speed │  │ ❤ HP     │        │
│   │ Tome     │  │ Tome     │  │ Tome     │        │
│   │          │  │          │  │          │        │
│   │ +10% dmg │  │ +7% spd  │  │ +8% hp   │        │
│   │          │  │          │  │          │        │
│   │ [COMMON] │  │ [RARE]   │  │ [COMMON] │        │
│   └──────────┘  └──────────┘  └──────────┘        │
│                                                     │
│              Click a card to choose                 │
└─────────────────────────────────────────────────────┘
```

- All UI is **HTML/CSS overlay** on top of the Three.js canvas
- Damage numbers: CSS-positioned `<div>`s that float up and fade (object-pooled)
- HP/XP bars: simple `<div>` with width percentage
- Minimal font: system sans-serif or a single imported pixel font for flavor
- Colors follow the palette above

---

## Development Phases

Defined in `GAMEPLAY_DESIGN.md` under "Clone Scope (MVP)". Build in order:

1. **Phase 1 — Core Loop** (movement, sword, goblins, XP, level-up, HUD, timer)
2. **Phase 2 — Combat Depth** (more weapons, enemies, mini-boss, boss, crits)
3. **Phase 3 — Progression** (characters, items, shrines, silver, Final Swarm)
4. **Phase 4 — Polish & Juice** (terrain gen, particles, audio, post-processing)
5. **Phase 5 — Meta** (full roster, quests, tiers, toggler)

### Phase 1 Definition of Done
The game is playable when:
- [ ] Player moves with WASD + jump + dash on a flat green plane
- [ ] Sword auto-attacks nearest enemy every 1.2s
- [ ] Green box enemies spawn at edges, walk toward player
- [ ] Enemies drop purple XP gems on death
- [ ] Collecting XP fills a bar; full bar → level-up menu with 3 Tome choices
- [ ] HP bar depletes when enemies touch player
- [ ] 10-minute countdown timer on screen
- [ ] Player can die → shows death screen with stats
- [ ] Runs at 60fps with 50+ enemies

---

## Conventions for Claude Code

### Code Style
- **TypeScript strict mode** (`"strict": true` in tsconfig)
- **No classes for systems** — export functions: `export function movementSystem(world: World, dt: number)`
- **Components** as bitECS `defineComponent()` calls, grouped by domain in `src/components/`
- **Prefabs** as factory functions: `export function createGoblin(world: World, x: number, z: number): number`
- **Constants in UPPER_SNAKE_CASE** in data files
- **Events** as typed string literals via EventBus

### File Rules
- One system per file
- One component group per file (spatial.ts, combat.ts, etc.)
- Data files are pure config objects, no logic
- Shaders in `.vert` / `.frag` files, imported as raw strings
- UI components are vanilla TS classes that create/manage DOM elements

### Performance Rules
- Use `InstancedMesh` for enemies (one per enemy type)
- Use `InstancedMesh` for XP gems (one for all gems)
- Object pool anything created frequently (damage numbers, projectiles, particles)
- Never allocate `new THREE.Vector3()` in a per-frame loop — reuse temp vectors
- Rapier bodies created via factory, cleaned up in DestroyCleanupSystem

### Git Conventions
- Commit after each working feature
- Branch name: `phase-1/core-loop`, `phase-2/combat`, etc.
- PR to `main` triggers GitHub Pages deploy
