import { Transform, Velocity } from '../../components/spatial'
import { eventBus } from '../../core/EventBus'
import { sceneManager } from '../../core/SceneManager'
import {
  CAMERA_DISTANCE,
  CAMERA_HEIGHT,
  CAMERA_LERP,
  CAMERA_LOOK_AHEAD,
} from '../../data/balance'
import { _v1, lerp } from '../../utils/math'
import type { GameWorld } from '../../world'

// ── Screen shake state ────────────────────────────────────────────────
let shakeIntensity = 0
let shakeDuration = 0
let shakeTimer = 0

/**
 * Trigger a camera screen shake effect.
 * @param intensity — maximum displacement in world units
 * @param duration — how long the shake lasts in seconds
 */
export function triggerScreenShake(intensity: number, duration: number): void {
  shakeIntensity = intensity
  shakeDuration = duration
  shakeTimer = duration
}

// ── Auto-shake on game events ─────────────────────────────────────────
eventBus.on('entity:damaged', (data) => {
  // Bigger shake for critical hits
  if (data.isCrit) {
    triggerScreenShake(0.3, 0.2)
  }
})

eventBus.on('player:levelup', () => {
  triggerScreenShake(0.2, 0.15)
})

/**
 * Follows the player entity with a smooth third-person camera.
 *
 * The desired camera position sits behind and above the player. A look-ahead
 * offset is applied in the player's horizontal movement direction so the
 * camera leads slightly ahead of the action. Position is smoothed via lerp
 * to avoid jarring snaps. Supports screen shake for impacts and level-ups.
 */
export function cameraSystem(world: GameWorld, dt: number): void {
  const camera = sceneManager.camera
  const playerEid = world.player.eid

  // ── Player position ─────────────────────────────────────────────────
  const px = Transform.x[playerEid]
  const py = Transform.y[playerEid]
  const pz = Transform.z[playerEid]

  // ── Look-ahead based on horizontal velocity ─────────────────────────
  const vx = Velocity.x[playerEid]
  const vz = Velocity.z[playerEid]
  const hSpeedSq = vx * vx + vz * vz

  let lookAheadX = 0
  let lookAheadZ = 0

  if (hSpeedSq > 0.01) {
    const hSpeed = Math.sqrt(hSpeedSq)
    lookAheadX = (vx / hSpeed) * CAMERA_LOOK_AHEAD
    lookAheadZ = (vz / hSpeed) * CAMERA_LOOK_AHEAD
  }

  // ── Desired camera position (behind + above player) ─────────────────
  const desiredX = px + lookAheadX
  const desiredY = py + CAMERA_HEIGHT
  const desiredZ = pz + CAMERA_DISTANCE + lookAheadZ

  // ── Smooth interpolation ────────────────────────────────────────────
  camera.position.x = lerp(camera.position.x, desiredX, CAMERA_LERP)
  camera.position.y = lerp(camera.position.y, desiredY, CAMERA_LERP)
  camera.position.z = lerp(camera.position.z, desiredZ, CAMERA_LERP)

  // ── Screen shake ────────────────────────────────────────────────────
  if (shakeTimer > 0) {
    shakeTimer -= dt || (1 / 60) // dt might be 0 in render calls
    const t = shakeTimer / shakeDuration
    const currentIntensity = shakeIntensity * t
    camera.position.x += (Math.random() - 0.5) * currentIntensity
    camera.position.y += (Math.random() - 0.5) * currentIntensity * 0.5
    camera.position.z += (Math.random() - 0.5) * currentIntensity

    if (shakeTimer <= 0) {
      shakeTimer = 0
      shakeIntensity = 0
    }
  }

  // ── Look at the player (with a slight Y offset for a better angle) ──
  _v1.set(px, py + 1.5, pz)
  camera.lookAt(_v1)
}
