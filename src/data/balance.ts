// ── XP Curve ─────────────────────────────────────────────────────────────────
// xpToNext = BASE_XP * (1 + XP_SCALING * level)
export const BASE_XP = 10
export const XP_SCALING = 0.15
export const GAME_DURATION = 600 // 10 minutes in seconds

// ── Player Defaults ──────────────────────────────────────────────────────────
export const PLAYER_HP = 100
export const PLAYER_SPEED = 6
export const PLAYER_JUMP_FORCE = 10
export const PLAYER_DASH_SPEED = 25
export const PLAYER_DASH_DURATION = 0.2
export const PLAYER_DASH_COOLDOWN = 2.0
export const PLAYER_INVINCIBILITY_TIME = 0.5

// ── Spawn Settings ───────────────────────────────────────────────────────────
export const SPAWN_RADIUS = 40 // distance from player where enemies spawn
export const MAX_ENEMIES = 200
export const BASE_SPAWN_INTERVAL = 2.0 // seconds between spawns at start
export const MIN_SPAWN_INTERVAL = 0.3
export const SPAWN_SCALING = 0.95 // multiplier per wave

// ── Combat ───────────────────────────────────────────────────────────────────
export const CONTACT_DAMAGE_COOLDOWN = 0.5
export const XP_MAGNET_RANGE = 3
export const XP_MAGNET_SPEED = 15
export const PICKUP_RANGE = 1.5

// ── Physics ─────────────────────────────────────────────────────────────────
export const GRAVITY = -20

// ── Camera ───────────────────────────────────────────────────────────────────
export const CAMERA_DISTANCE = 15
export const CAMERA_HEIGHT = 10
export const CAMERA_LERP = 0.08
export const CAMERA_LOOK_AHEAD = 3
