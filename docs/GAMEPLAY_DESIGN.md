# Megabonk Clone — Gameplay Design Document

## Game Summary

A **3D roguelike auto-attack survivor** inspired by Megabonk / Vampire Survivors. The player navigates procedurally generated 3D terrain, automatically attacking waves of enemies while focusing on movement, positioning, and upgrade decisions. Runs last ~10 minutes per stage with escalating difficulty, culminating in a boss fight and Final Swarm.

---

## Core Loop

```
START RUN → Select Character
  │
  ▼
EXPLORE & SURVIVE (10 min timer counting down)
  │  ├── Enemies spawn in waves, scaling over time
  │  ├── Player auto-attacks (weapons fire automatically)
  │  ├── Defeated enemies drop XP gems
  │  ├── Collect XP → Level up → Choose upgrade (Tome or Weapon upgrade)
  │  ├── Find & charge Shrines for bonus stats
  │  ├── Break pots/crates for silver coins + minor loot
  │  ├── Mini-bosses & swarm events at timed intervals
  │  └── Locate Boss Portal (red threads guide you)
  │
  ▼
BOSS FIGHT (player-initiated via portal)
  │  ├── Unique boss with attack patterns
  │  └── Defeating boss triggers Final Swarm
  │
  ▼
FINAL SWARM (endless escalation)
  │  ├── Ghosts spawn infinitely with increasing strength
  │  ├── Survive as long as possible for bonus rewards
  │  └── Death = run ends
  │
  ▼
RUN SUMMARY → Silver earned → Unlock shop → NEXT RUN
```

---

## Movement & Controls

### Player Movement
- **WASD** — move in 3D space (relative to camera)
- **Space** — jump (can gain extra jumps via upgrades)
- **Shift** — slide/dash (short cooldown, ~2s)
- **No attack button** — weapons fire automatically on cooldown

### Movement Philosophy
Movement is the primary skill expression. The player never directly attacks — instead they position themselves to maximize weapon coverage and avoid damage. The 3D terrain (hills, ramps, platforms, cliffs) adds verticality that differentiates this from 2D survivors.

### Camera
- Third-person follow camera, slightly elevated
- Camera stays behind player with smooth lerp
- Screen shake on big hits, boss attacks, level-ups
- Slight zoom-out as more enemies appear on screen

---

## Run Timeline (Per Stage — ~10 minutes)

| Time Remaining | Event |
|----------------|-------|
| 10:00 | Stage begins. Basic enemies spawn. |
| 9:00–8:00 | Enemy density increases. First pots/shrines appear. |
| 8:00 | **Mini-boss OR Swarm** spawns (random order). |
| 7:00 | **Mini-boss OR Swarm** spawns (whichever didn't spawn at 8:00). |
| 6:00 | **Swarm** — large burst wave of enemies. |
| 5:00 | Enemy scaling ramps up. Elite enemies begin appearing. |
| 4:00 | **Swarm** — second burst wave. |
| 3:00 | **Mini-boss OR Swarm** spawns. |
| 2:00 | **Mini-boss** — final mini-boss before the boss fight. |
| 1:00 | Enemy density peaks. Red threads appear guiding to boss portal. |
| 0:00 | If boss not triggered, Final Swarm begins automatically. |

The player should ideally trigger the Boss Portal around the 5–2 minute mark when their build is strong but before being overwhelmed.

---

## Character System

### Structure
Each character has:
- **Base stats** (HP, move speed, armor, etc.)
- **Starting weapon** (unique to the character)
- **Passive ability** (scales per level, defines build identity)

### Starter Characters (2 unlocked by default)

| Character | Starting Weapon | Passive | Description |
|-----------|----------------|---------|-------------|
| **Knight** | Sword | Reinforced: +1% Armor per level | Tanky beginner. Forgiving, learns you the game. |
| **Fox** | Bow | Lucky: +1% Luck per level | Luck scaling → better drops over time. |

### Unlockable Characters (examples for clone scope)

| Character | Starting Weapon | Passive | Unlock Condition |
|-----------|----------------|---------|-----------------|
| **Gunslinger** | Revolver | Crit Happens: +1% Crit per level | Kill 7,500 total enemies + buy Revolver |
| **Skeleton** | Bone Toss | Rattled: +1% Attack Speed per level | Survive 10 min as Knight |
| **Aura Chad** | Aura | Flex: Ignore damage if not hit recently | Clear Forest Tier 1 |
| **Speed Demon** | Katana | Speed Freak: Damage scales with move speed | Clear Desert Tier 1 |
| **Dice Lord** | Dice | Gamble: Rolling 6 on level-up permanently increases crit | Beat any Tier 2 boss |
| **Ninja** | Dagger | Shadow: Execute enemies after evading | Get 500 evasions in one run |

---

## Stats System

### Player Stats
| Stat | Description | Base Range |
|------|-------------|------------|
| HP | Health pool | 50–150 |
| HP Regen | HP recovered per second | 0–5 |
| Armor | Flat damage reduction (diminishing returns) | 0–50% |
| Evasion | % chance to dodge an attack entirely | 0–50% |
| Move Speed | Movement velocity | 3–10 |
| Lifesteal | % chance to heal 1 HP per attack | 0–100%+ |
| Thorns | Reflect % of damage taken back to attacker | 0–50% |
| Luck | Affects rarity of upgrade offerings & chest drops | 0–100% |
| Crit Chance | % chance for 2x damage | 5–100%+ |
| Crit Damage | Multiplier on crits (base 2x) | 2x–5x |
| XP Gain | Bonus XP multiplier | 1.0–3.0x |
| Gold Gain | Bonus gold multiplier | 1.0–3.0x |
| Pickup Range | Radius for auto-collecting XP/gold | 2–10 |

### Weapon Stats (per weapon)
| Stat | Description |
|------|-------------|
| Damage | Base hit damage |
| Attack Speed | Cooldown between attacks |
| Projectile Count | Number of projectiles per attack |
| Projectile Speed | Velocity of projectiles |
| Pierce | How many enemies a projectile passes through |
| Knockback | Push force on hit |
| Size | Area/hitbox scale of the weapon |
| Duration | How long projectiles/effects persist |
| Bounce | Number of times projectiles bounce between enemies |

---

## Weapons

Weapons auto-fire. The player does not aim. Targeting depends on the weapon's **pattern**.

### Attack Patterns
| Pattern | Behavior |
|---------|----------|
| **Nearest** | Targets closest enemy |
| **Forward** | Fires in movement direction |
| **Forward Spread** | Fan of projectiles in move direction |
| **Radial** | Fires in all directions |
| **Orbit** | Projectiles circle the player |
| **Aura** | Passive damage zone around player |
| **Trail** | Leaves damaging area behind player |
| **Random** | Fires in random directions |
| **Homing** | Projectiles seek nearest enemy |

### Weapon List (clone scope — 10–12 weapons)

| Weapon | Type | Base Dmg | Pattern | Special |
|--------|------|----------|---------|---------|
| Sword | Melee | 8 | Forward | Wide arc, knockback |
| Bow | Ranged | 6 | Nearest | Pierce 2 |
| Revolver | Ranged | 5 | Nearest | 6 projectiles, bounce |
| Bone Toss | Ranged | 8 | Nearest | High knockback |
| Aura | Magic | 3/tick | Aura | Constant circle damage |
| Katana | Melee | 4 | Forward | Very fast attack speed |
| Lightning Staff | Magic | 7 | Nearest | Chain to 3 enemies |
| Flamewalker | Magic | 5 | Trail | Fire trail behind player |
| Frostwalker | Magic | 9 | Aura | Freeze + damage |
| Shotgun | Ranged | 4 | Forward Spread | 5 pellets, 30° spread |
| Dice | Magic | 1–6 | Random | Random damage per hit |
| Boomerang | Ranged | 6 | Forward | Returns to player |

---

## Tomes (Stat Upgrades)

Tomes are **stackable passive stat upgrades** chosen on level-up. Each tome boosts a single stat. Can be stacked up to level 99. Presented as 3 random choices on level-up.

### Tome List

| Tome | Stat | Per Level | Unlock |
|------|------|-----------|--------|
| Damage Tome | Base Damage | +10% (multiplicative) | Default |
| Attack Speed Tome | Cooldown Reduction | -4% | Default |
| Movement Tome | Move Speed | +7% | Default |
| HP Tome | Max HP | +8% | Default |
| Regen Tome | HP Regen | +0.5/s | Default |
| Crit Tome | Crit Chance | +7% | Default |
| Knockback Tome | Knockback | +10% | Default |
| Projectile Speed Tome | Proj Speed | +8% | Default |
| Gold Tome | Gold Gain | +7% | Default |
| Evasion Tome | Evasion | +2% | Default |
| XP Tome | XP Gain | +7% | Break 20 pots |
| Armor Tome | Armor | +3% | Reach level 20 |
| Luck Tome | Luck | +7% | Kill enemy w/ 0.01% drop |
| Quantity Tome | Projectile Count | +1 | Kill 5000 enemies |
| Cursed Tome | Difficulty + Drops | +3.5% difficulty | Kill 10,000 enemies |
| Lifesteal Tome | Lifesteal | +3% | Heal 350 HP via lifesteal |
| Duration Tome | Effect Duration | +8% | Complete 10 runs |
| Size Tome | Weapon Size | +10% | Kill a boss w/ Aura |
| Thorns Tome | Thorns | +5% | Kill 1000 w/ thorns |

### Level-Up Flow
1. Player collects enough XP to level up
2. Game pauses briefly
3. 3 random options shown (mix of Tome upgrades and Weapon upgrades)
4. Rarity system: Common / Rare / Epic / Legendary (affected by Luck stat)
5. Higher rarity = bigger stat boost per selection
6. Player picks one → stats applied immediately → game resumes

---

## Items (Passive Equipment)

Items are **found in chests, dropped by bosses, or purchased at shops**. Unlike Tomes, items have unique mechanics and effects. Limited inventory slots (start with 6, expand via upgrades).

### Example Items (clone scope — ~20 items)

| Item | Rarity | Effect |
|------|--------|--------|
| Sucky Magnet | Common | Periodically pulls all XP toward player |
| Turbo Socks | Common | +15% Move Speed |
| Anvil | Rare | All weapons gain +1 upgrade level |
| Moldy Cheese | Common | Poison cloud on enemy hit |
| Giant Fork | Rare | Crits become Megacrits (3x → 5x) |
| Spiky Shield | Common | +5 Thorns, +5% Armor |
| Kevin | Rare | Damages you over time, triggers on-hit effects |
| Mirror | Rare | Brief invincibility when taking damage |
| Leeching Crystal | Uncommon | +10% Lifesteal |
| Boss Buster | Rare | +50% damage to bosses and elites |
| Forbidden Juice | Epic | +25% Crit Damage, -10% Max HP |
| Battery | Common | +10% Attack Speed |
| Echo Shard | Uncommon | XP collected also damages nearby enemies |
| Idle Juice | Epic | +100% Damage while standing still |
| Credit Card | Rare | Free reroll on level-up choices |
| Gym Sauce | Common | +20 Max HP |
| Phantom Shroud | Rare | +15% Evasion, brief speed boost on dodge |
| Soul Harvester | Legendary | Survive Final Swarm 6 min to unlock. Kills extend timer. |
| The Key | Uncommon | +1 item from every chest |
| Cursed Doll | Epic | +30% all damage, +15% damage taken |

---

## Enemies

### Spawn System
- Enemies spawn at map edges, outside camera view
- Spawn rate increases over time (controlled by wave timer)
- **Difficulty stat** (from Cursed Tome or shrines) increases: spawn rate, enemy HP, enemy damage, enemy speed
- Enemy types are weighted by spawn budget: cheap fodder enemies early, expensive elites later

### Enemy Types (Forest)

| Enemy | HP | Speed | Damage | Behavior | XP |
|-------|-----|-------|--------|----------|-----|
| Goblin | 15 | 3.5 | 5 | Walks toward player | 3 |
| Goblin Brute | 40 | 2.5 | 12 | Slow but tanky | 8 |
| Bat | 8 | 5.0 | 3 | Fast, erratic movement | 2 |
| Mushroom | 25 | 1.5 | 8 | Stationary, explodes on proximity | 5 |
| Wolf | 20 | 4.5 | 7 | Charges in straight line | 4 |
| Tree Ent | 60 | 1.0 | 15 | Very slow, very tanky | 12 |
| Ghost | 30 | 3.0 | 10 | Phases through terrain | 6 |

### Enemy Types (Desert)

| Enemy | HP | Speed | Damage | Behavior | XP |
|-------|-----|-------|--------|----------|-----|
| Scorpion | 20 | 3.0 | 8 | Melee, poison on hit | 4 |
| Cactus | 35 | 0 | 6 | Stationary, shoots spines | 5 |
| Sand Worm | 50 | 2.0 | 15 | Burrows, surfaces under player | 10 |
| Skeleton | 18 | 3.5 | 6 | Basic walker | 3 |
| Skeleton Ball | 80 | 4.0 | 20 | Rolling boulder, blocks paths | 15 |
| Mummy | 45 | 2.0 | 12 | Slow, spawns minions on death | 8 |
| Dust Devil | 15 | 6.0 | 4 | Very fast, pushes player | 3 |

### Elite Enemies
After ~5 minutes, elite variants spawn. Elites are:
- 3x HP, 2x Damage, 1.5x Size
- Glow effect + slightly different color
- Drop guaranteed gold + higher XP

### Mini-Bosses
| Mini-Boss | Map | HP | Mechanic |
|-----------|-----|-----|---------|
| Stone Golem | Forest | 500 | Slow, ground-slam AoE, rock throw |
| Chunkham | Forest | 400 | Charges at player, leaves fire trail |
| Sand Golem | Desert | 550 | Ground-slam, spawns sand minions |
| Scorpionussy | Desert | 450 | Fast, tail swipe, poison pools |

---

## Bosses

Bosses appear when the player activates the Boss Portal. Each map has tiered bosses that scale with difficulty tier.

### Forest Bosses
| Boss | Tier | HP | Key Mechanic |
|------|------|-----|-------------|
| Lil Bark | 1 | 2,000 | Stationary tree. Slam attacks, root AoE. Kite in circles. |
| Chadbark | 2 | 8,000 | Mobile tree. Charges, spawns adds, slam combos. |
| Bark Vader | 3 | 18,000 | **Deletes all weapons except starting weapon.** Shield pylons that heal it. Must destroy pylons while dodging. |

### Desert Bosses
| Boss | Tier | HP | Key Mechanic |
|------|------|-----|-------------|
| Lil Anubis | 1 | 2,500 | Laser barrages, requires high mobility. |
| Anubruh | 2 | 10,000 | Rotating laser, must stay near feet to avoid. |
| Juge Anubis | 3 | 22,000 | All laser attacks + ice attacks + teleportation. |

### Boss Mechanics
- Bosses have **telegraphed attacks** (ground indicators, wind-up animations)
- Bosses spawn additional regular enemies during the fight
- Higher tier bosses gain shields that block lifesteal
- Boss portals are located via **red threads** visible in the sky

---

## Final Swarm

After defeating a boss, the Final Swarm begins:

| Time into Swarm | Enemies |
|-----------------|---------|
| 0–1 min | Normal ghosts (equivalent to late-game regular enemies) |
| 1–6 min | Ghost density increases. Map gets crowded. |
| 6+ min | **Purple ghosts** — 3x damage, 2x HP, faster |
| 12+ min | **Red ghosts** — extreme damage, very tanky. Death incarnate. |

The Final Swarm is the endurance test. Surviving 6 minutes unlocks special rewards. Most runs end within 1–3 minutes of the swarm.

---

## Map & World

### Map Structure
- Procedurally generated 3D terrain
- ~500m × 500m playable area per stage
- Bounded by invisible walls or kill zones

### Forest Map Features
- Rolling hills and valleys
- Trees, rocks as collision objects
- Medieval structures (ruined walls, towers)
- Ramps and natural platforms for verticality
- Dense foliage — enemies can blend in

### Desert Map Features
- Flat, open terrain with scattered dunes
- Rock outcroppings for cover
- Tornadoes that launch player vertically
- Periodic sandstorms (reduce visibility)
- Cactus clusters, ruins

### Interactables

| Object | Effect |
|--------|--------|
| Pots/Crates | Break for silver coins, small XP, +luck scaling |
| Charge Shrine | Stand in zone for ~5s → random stat boost. 15 per stage. |
| Greed Shrine | Increases difficulty + increases gold/XP drops |
| Boss Curse Shrine | Spawns extra boss clone during boss fight (+1 chest reward) |
| Chest (Gold) | Contains 1 item (rarity scales with Luck) |
| Chest (Silver) | Contains silver coins |
| Shop NPC | Spend gold for items mid-run |
| Moai Statue | Challenge encounter → reward |

---

## Progression (Meta / Between Runs)

### Silver Coins
- Earned during runs from: pots, chests, enemies, Final Swarm survival
- Spent in the **Shop** between runs to unlock:
  - New characters
  - New weapons (added to the pool)
  - New items (added to the pool)
  - New tomes

### Quests
- 240 quests that auto-complete during play
- Examples: "Kill 5000 enemies", "Open 25 chests", "Survive 10 minutes"
- Reward: Silver + unlocks (items, characters, weapons)

### Item Pool Management
- Every unlocked item enters the random pool
- More unlocks = more dilution (harder to get specific items)
- **Toggler** (unlock): allows disabling items from the pool

---

## Difficulty Tiers

| Tier | Stages | Difficulty | Unlock |
|------|--------|-----------|--------|
| 1 | 1 stage | Normal | Default |
| 2 | 2 stages | Hard (portal between stages) | Clear Tier 1 |
| 3 | 3 stages | Very Hard (final boss encounter) | Clear Tier 2 |

Each stage within a tier has its own 10-minute timer, shrines, and boss.

---

## Damage Formula

```
Base Weapon Damage
  × Damage Tome Multiplier (1.0 + 0.1 × tome_level)
  × Crit Multiplier (if crit: base 2.0 + crit_damage_bonus)
  × Boss/Elite Multiplier (if applicable, from items)
  - Target Armor (flat reduction, diminishing returns)
  = Final Damage
```

### Attack Speed
```
Effective Cooldown = Base Cooldown × (1 - attack_speed_bonus)
  (capped at some minimum like 0.1s)
```

### Armor (Diminishing Returns)
```
Damage Reduction = armor / (armor + 100)
  At 50 armor → 33% reduction
  At 100 armor → 50% reduction
  At 200 armor → 67% reduction
```

---

## VFX & Juice Targets

| Event | Visual | Audio |
|-------|--------|-------|
| Enemy hit | Flash white, knockback, small particle burst | Synth thwack (pitch varies with damage) |
| Enemy death | Dissolve shader + XP gem burst | FM pop + noise tail |
| Crit | Larger particle burst + screen flash | Higher pitch hit + sparkle |
| Level up | Screen flash, scale bounce, particle ring | Rising arpeggio chord |
| Pickup XP | Gems fly toward player, absorbed with glow | Chirp (pitch = XP value) |
| Boss spawn | Ground rumble, dark vignette, camera zoom | Low drone + bass hit |
| Boss death | Slow-mo, massive particle explosion, screen shake | Dramatic synth stab |
| Dash/Slide | Motion blur trail, dust particles | Filtered noise whoosh |
| Take damage | Red vignette flash, camera shake | Distorted square pulse |
| Final Swarm start | Sky color change, fog rolls in | Tension drone rises |

---

## Clone Scope (MVP)

For a hobby project, prioritize building in this order:

### Phase 1 — Core Loop
- [ ] Player movement (WASD + jump + dash) in 3D terrain
- [ ] Auto-attacking weapon system (1 weapon: Sword)
- [ ] Basic enemy spawner (Goblins only)
- [ ] XP gems + collection
- [ ] Level-up menu (3 random Tomes)
- [ ] Basic HUD (HP, XP bar, timer)
- [ ] 10-minute timer

### Phase 2 — Combat Depth
- [ ] 4–5 weapons with different patterns
- [ ] Weapon upgrades on level-up
- [ ] 3–4 enemy types
- [ ] Mini-boss
- [ ] Boss portal + 1 boss fight
- [ ] Knockback, crits, damage numbers

### Phase 3 — Progression
- [ ] Character select (2–3 characters with different passives)
- [ ] Items system (chests, 5–10 items)
- [ ] Shrines (Charge Shrine at minimum)
- [ ] Silver coins + between-run shop
- [ ] Final Swarm after boss

### Phase 4 — Polish & Juice
- [ ] Procedural terrain generation
- [ ] Particle effects (hit, death, level-up)
- [ ] Procedural audio (Tone.js)
- [ ] Post-processing (bloom, chromatic aberration)
- [ ] Screen shake, slow-mo on boss kills
- [ ] Second map (Desert)

### Phase 5 — Meta
- [ ] More characters (5–6 total)
- [ ] Full weapon roster (10–12)
- [ ] Full item roster (20+)
- [ ] Quests system
- [ ] Difficulty tiers
- [ ] Toggler for item pool
