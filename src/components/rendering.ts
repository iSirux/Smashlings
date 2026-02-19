import { defineComponent, Types } from 'bitecs'

/**
 * Stores an index into the SceneManager's mesh array so we can map
 * an ECS entity back to its Three.js Object3D.
 */
export const MeshRef = defineComponent({
  meshIndex: Types.ui32,
})

/**
 * For instanced mesh rendering (large groups of identical geometry).
 * `instancedMeshId` selects which InstancedMesh group this entity belongs to.
 * `instanceIndex` is the entity's slot within that group's instance array.
 */
export const InstancedRef = defineComponent({
  instancedMeshId: Types.ui8,
  instanceIndex: Types.ui32,
})

/** Damage-flash timer. While > 0 the mesh material is swapped to white. */
export const FlashTimer = defineComponent({
  remaining: Types.f32,
})
