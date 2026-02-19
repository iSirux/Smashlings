import { defineQuery } from 'bitecs'
import { Transform, Velocity } from '../../components/spatial'
import { PlayerControlled } from '../../components/movement'
import { IsPlayer } from '../../components/tags'
import { input } from '../../core/InputManager'
import { sceneManager } from '../../core/SceneManager'
import { GRAVITY } from '../../data/balance'
import type { GameWorld } from '../../world'

const playerQuery = defineQuery([PlayerControlled, Transform, Velocity, IsPlayer])

/** Half capsule height + ground plane offset. Entity is grounded at or below this Y. */
const GROUND_Y = 1.0

/**
 * Reads keyboard input and drives the player entity's velocity, jumping,
 * dashing, gravity, and ground detection each fixed-step tick.
 */
export function playerInputSystem(world: GameWorld, dt: number): void {
  const entities = playerQuery(world)

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]

    // ── Read raw input ────────────────────────────────────────────────
    const rawX = input.moveDirection.x   // strafe: -1 left, +1 right
    const rawZ = -input.moveDirection.y  // forward mapped to -Z (Three.js convention)

    // ── Camera-relative movement ──────────────────────────────────────
    // We only rotate the input vector around the camera's Y rotation so
    // "forward" always means "away from the camera".
    const camY = sceneManager.camera.rotation.y
    const sinCam = Math.sin(camY)
    const cosCam = Math.cos(camY)

    const moveX = rawX * cosCam - rawZ * sinCam
    const moveZ = rawX * sinCam + rawZ * cosCam

    const moveSpeed = PlayerControlled.moveSpeed[eid]

    // ── Dash timer bookkeeping ────────────────────────────────────────
    if (PlayerControlled.dashTimer[eid] > 0) {
      PlayerControlled.dashTimer[eid] -= dt
    }
    if (PlayerControlled.dashDuration[eid] > 0 && PlayerControlled.isDashing[eid] === 1) {
      PlayerControlled.dashDuration[eid] -= dt
      if (PlayerControlled.dashDuration[eid] <= 0) {
        PlayerControlled.isDashing[eid] = 0
      }
    }

    // ── Dash activation ───────────────────────────────────────────────
    if (input.dashPressed && PlayerControlled.dashTimer[eid] <= 0) {
      PlayerControlled.isDashing[eid] = 1
      PlayerControlled.dashTimer[eid] = PlayerControlled.dashCooldown[eid]
      // Reset duration so it counts down fresh each dash
      PlayerControlled.dashDuration[eid] = PlayerControlled.dashCooldown[eid] > 0
        ? PlayerControlled.dashDuration[eid] // already set by component init
        : 0.15 // fallback
      // The duration was already decremented above; give it a fresh start.
      // We re-read the design value from dashSpeed as a stand-in; a proper
      // fix would store the *initial* dashDuration on the component. For now
      // we use a fixed 0.15s if the field was already drained.
      if (PlayerControlled.dashDuration[eid] <= 0) {
        PlayerControlled.dashDuration[eid] = 0.15
      }
    }

    // ── Apply velocity ────────────────────────────────────────────────
    if (PlayerControlled.isDashing[eid] === 1) {
      // During dash: override horizontal velocity to dash direction * dashSpeed
      const dashSpeed = PlayerControlled.dashSpeed[eid]
      // Use the current movement direction; if player isn't pressing anything,
      // dash in the direction they're facing.
      const hasMoveInput = moveX !== 0 || moveZ !== 0
      if (hasMoveInput) {
        const len = Math.sqrt(moveX * moveX + moveZ * moveZ)
        Velocity.x[eid] = (moveX / len) * dashSpeed
        Velocity.z[eid] = (moveZ / len) * dashSpeed
      } else {
        // Dash forward based on current facing rotation
        const rot = Transform.rotY[eid]
        Velocity.x[eid] = Math.sin(rot) * dashSpeed
        Velocity.z[eid] = Math.cos(rot) * dashSpeed
      }
    } else {
      // Normal movement
      Velocity.x[eid] = moveX * moveSpeed
      Velocity.z[eid] = moveZ * moveSpeed
    }

    // ── Jumping ───────────────────────────────────────────────────────
    if (input.jumpPressed && PlayerControlled.jumpsRemaining[eid] > 0) {
      Velocity.y[eid] = PlayerControlled.jumpForce[eid]
      PlayerControlled.jumpsRemaining[eid]--
    }

    // ── Gravity ───────────────────────────────────────────────────────
    Velocity.y[eid] += GRAVITY * dt

    // ── Rotation: face movement direction ─────────────────────────────
    if (moveX !== 0 || moveZ !== 0) {
      Transform.rotY[eid] = Math.atan2(moveX, moveZ)
    }

    // ── Ground check ──────────────────────────────────────────────────
    if (Transform.y[eid] <= GROUND_Y) {
      Transform.y[eid] = GROUND_Y
      if (Velocity.y[eid] < 0) {
        Velocity.y[eid] = 0
      }
      PlayerControlled.isGrounded[eid] = 1
      PlayerControlled.jumpsRemaining[eid] = PlayerControlled.maxJumps[eid]
    } else {
      PlayerControlled.isGrounded[eid] = 0
    }
  }
}
