import { Transform, Velocity } from '../../components/spatial'
import { eventBus } from '../../core/EventBus'
import { input } from '../../core/InputManager'
import { sceneManager } from '../../core/SceneManager'
import {
  CAMERA_DISTANCE,
  CAMERA_LERP,
  CAMERA_LOOK_AHEAD,
  CAMERA_MOUSE_SENSITIVITY,
  CAMERA_MIN_PITCH,
  CAMERA_MAX_PITCH,
  CAMERA_INITIAL_PITCH,
} from '../../data/balance'
import { _v1, lerp } from '../../utils/math'
import type { GameWorld } from '../../world'

// ── Orbital camera state ─────────────────────────────────────────────────
let cameraYaw = 0
let cameraPitch = CAMERA_INITIAL_PITCH

// Smoothed look-at target (absorbs discrete physics-tick jumps)
let smoothTargetX = 0
let smoothTargetY = 0
let smoothTargetZ = 0
let smoothTargetInit = false
const TARGET_LERP = 0.15


/** Returns the current camera yaw for camera-relative movement. */
export function getCameraYaw(): number {
  return cameraYaw
}

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
  if (data.isCrit) {
    triggerScreenShake(0.3, 0.2)
  }
})

eventBus.on('player:levelup', () => {
  triggerScreenShake(0.2, 0.15)
})

/**
 * Consume mouse deltas and update yaw/pitch. Must run in the fixed-step
 * update loop BEFORE playerInputSystem so getCameraYaw() is fresh.
 */
export function cameraInputSystem(): void {
  cameraYaw -= input.mouseX * CAMERA_MOUSE_SENSITIVITY
  cameraPitch += input.mouseY * CAMERA_MOUSE_SENSITIVITY
  cameraPitch = Math.max(CAMERA_MIN_PITCH, Math.min(CAMERA_MAX_PITCH, cameraPitch))
}

/**
 * Orbiting third-person camera that follows the player.
 *
 * Positions the camera at a spherical offset from the player based on the
 * current yaw/pitch (updated by cameraInputSystem). Smooth lerp following
 * and look-ahead in the movement direction. Supports screen shake.
 */
export function cameraSystem(world: GameWorld, dt: number): void {
  const camera = sceneManager.camera
  const playerEid = world.player.eid

  // ── Smoothed player position (absorbs discrete physics-tick jumps) ──
  const rawPx = Transform.x[playerEid]
  const rawPy = Transform.y[playerEid]
  const rawPz = Transform.z[playerEid]

  if (!smoothTargetInit) {
    smoothTargetX = rawPx
    smoothTargetY = rawPy
    smoothTargetZ = rawPz
    smoothTargetInit = true
  }
  smoothTargetX = lerp(smoothTargetX, rawPx, TARGET_LERP)
  smoothTargetY = lerp(smoothTargetY, rawPy, TARGET_LERP)
  smoothTargetZ = lerp(smoothTargetZ, rawPz, TARGET_LERP)

  const px = smoothTargetX
  const py = smoothTargetY
  const pz = smoothTargetZ

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

  // ── Compute orbital offset from spherical coordinates ────────────────
  const cosPitch = Math.cos(cameraPitch)
  const sinPitch = Math.sin(cameraPitch)
  const sinYaw = Math.sin(cameraYaw)
  const cosYaw = Math.cos(cameraYaw)

  const offsetX = CAMERA_DISTANCE * sinYaw * cosPitch
  const offsetY = CAMERA_DISTANCE * sinPitch
  const offsetZ = CAMERA_DISTANCE * cosYaw * cosPitch

  // ── Desired camera position (orbital offset + look-ahead) ───────────
  const desiredX = px + lookAheadX + offsetX
  let desiredY = py + offsetY
  const desiredZ = pz + lookAheadZ + offsetZ

  // ── Ground clamp — keep desired position above terrain ─────────────
  const groundY = sceneManager.getTerrainHeight(desiredX, desiredZ) + 1.5
  if (desiredY < groundY) {
    desiredY = groundY
  }

  // ── Smooth interpolation ────────────────────────────────────────────
  camera.position.x = lerp(camera.position.x, desiredX, CAMERA_LERP)
  camera.position.y = lerp(camera.position.y, desiredY, CAMERA_LERP)
  camera.position.z = lerp(camera.position.z, desiredZ, CAMERA_LERP)

  // ── Screen shake ────────────────────────────────────────────────────
  if (shakeTimer > 0) {
    shakeTimer -= dt || (1 / 60)
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
