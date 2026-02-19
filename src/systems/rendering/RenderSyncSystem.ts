import { defineQuery } from 'bitecs'
import { Transform } from '../../components/spatial'
import { sceneManager } from '../../core/SceneManager'
import type { GameWorld } from '../../world'

/**
 * Query every entity that has a Transform. We check sceneManager for the
 * mesh at runtime — entities without a mesh are skipped.
 */
const transformQuery = defineQuery([Transform])

/**
 * Synchronise ECS Transform data to Three.js Object3D properties.
 *
 * This is the critical bridge between the data-oriented ECS world and
 * Three.js's scene graph. Runs every frame after movement/physics and
 * before the renderer draws.
 */
export function renderSyncSystem(world: GameWorld, _dt: number): void {
  const entities = transformQuery(world)

  for (let i = 0, len = entities.length; i < len; i++) {
    const eid = entities[i]
    const mesh = sceneManager.getMesh(eid)
    if (!mesh) continue

    mesh.position.set(
      Transform.x[eid],
      Transform.y[eid],
      Transform.z[eid],
    )

    mesh.rotation.set(
      Transform.rotX[eid],
      Transform.rotY[eid],
      Transform.rotZ[eid],
    )

    mesh.scale.set(
      Transform.scaleX[eid],
      Transform.scaleY[eid],
      Transform.scaleZ[eid],
    )
  }
}
