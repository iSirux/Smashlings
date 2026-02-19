import * as THREE from 'three'
import { generateForestTerrain, getTerrainHeight, TerrainConfig } from '../world/MapGenerator'
import { createForestFog } from '../world/Skybox'

/**
 * Manages the Three.js scene, camera, renderer, and entity-to-mesh mappings.
 * Systems access the scene graph through this singleton.
 */
class SceneManagerClass {
  scene!: THREE.Scene
  camera!: THREE.PerspectiveCamera
  renderer!: THREE.WebGLRenderer

  // Procedural terrain mesh
  terrain: THREE.Mesh | null = null

  // eid -> THREE.Object3D mapping
  private meshes: Map<number, THREE.Object3D> = new Map()

  // Instanced meshes for enemies by type index
  private enemyInstancedMeshes: Map<number, THREE.InstancedMesh> = new Map()
  private enemyInstanceCount: Map<number, number> = new Map()

  // Instanced mesh for XP gems
  xpGemInstanced: THREE.InstancedMesh | null = null
  xpGemCount: number = 0

  /**
   * Create the scene, camera, renderer, lights, and ground plane.
   * Appends the renderer canvas to the given container element.
   */
  init(container: HTMLElement): void {
    // ── Scene ──────────────────────────────────────────────────────────
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87CEEB) // sky blue

    // ── Camera ─────────────────────────────────────────────────────────
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      500,
    )
    this.camera.position.set(0, 10, 15)
    this.camera.lookAt(0, 0, 0)

    // ── Renderer ───────────────────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(this.renderer.domElement)

    // ── Lights ─────────────────────────────────────────────────────────
    const dirLight = new THREE.DirectionalLight(0xFFF5E1, 1.2)
    dirLight.position.set(10, 20, 10)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 80
    dirLight.shadow.camera.left = -40
    dirLight.shadow.camera.right = 40
    dirLight.shadow.camera.top = 40
    dirLight.shadow.camera.bottom = -40
    this.scene.add(dirLight)

    const ambientLight = new THREE.AmbientLight(0x404060, 0.5)
    this.scene.add(ambientLight)

    // ── Procedural Terrain ─────────────────────────────────────────────
    const terrainConfig: TerrainConfig = {
      width: 500,
      depth: 500,
      segments: 128,
      maxHeight: 3,
      color: 0x2E7D32,
    }
    this.terrain = generateForestTerrain(terrainConfig)
    this.scene.add(this.terrain)

    // ── Fog ──────────────────────────────────────────────────────────────
    this.scene.fog = createForestFog()

    // ── Window resize handler ──────────────────────────────────────────
    window.addEventListener('resize', this.onResize)
  }

  /**
   * Get the terrain height at a given world (x, z) position.
   * Returns 0 if no terrain is loaded.
   */
  getTerrainHeight(x: number, z: number): number {
    if (!this.terrain) return 0
    return getTerrainHeight(this.terrain, x, z)
  }

  /**
   * Get the Three.js Object3D associated with an entity id.
   */
  getMesh(eid: number): THREE.Object3D | undefined {
    return this.meshes.get(eid)
  }

  /**
   * Register a Three.js Object3D for an entity and add it to the scene.
   */
  addMesh(eid: number, mesh: THREE.Object3D): void {
    this.meshes.set(eid, mesh)
    this.scene.add(mesh)
  }

  /**
   * Remove the mesh associated with an entity from the scene and the map.
   * Disposes geometry and materials to free GPU memory.
   */
  removeMesh(eid: number): void {
    const mesh = this.meshes.get(eid)
    if (!mesh) return

    this.scene.remove(mesh)

    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose()
        const mat = child.material
        if (Array.isArray(mat)) {
          for (const m of mat) m.dispose()
        } else if (mat) {
          mat.dispose()
        }
      }
    })

    this.meshes.delete(eid)
  }

  /**
   * Get an instanced mesh for a specific enemy type index.
   */
  getEnemyInstancedMesh(typeIndex: number): THREE.InstancedMesh | undefined {
    return this.enemyInstancedMeshes.get(typeIndex)
  }

  /**
   * Register an instanced mesh for a specific enemy type index.
   */
  setEnemyInstancedMesh(typeIndex: number, mesh: THREE.InstancedMesh): void {
    this.enemyInstancedMeshes.set(typeIndex, mesh)
    this.enemyInstanceCount.set(typeIndex, 0)
    this.scene.add(mesh)
  }

  /**
   * Get the current instance count for an enemy type.
   */
  getEnemyInstanceCount(typeIndex: number): number {
    return this.enemyInstanceCount.get(typeIndex) ?? 0
  }

  /**
   * Set the instance count for an enemy type.
   */
  setEnemyInstanceCount(typeIndex: number, count: number): void {
    this.enemyInstanceCount.set(typeIndex, count)
  }

  /**
   * Handle browser window resize.
   */
  resize(): void {
    this.onResize()
  }

  /**
   * Render the scene from the camera's perspective.
   */
  render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Clean up event listeners and renderer resources.
   */
  dispose(): void {
    window.removeEventListener('resize', this.onResize)
    this.renderer.dispose()
  }

  // ── Internal ─────────────────────────────────────────────────────────

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
}

export const sceneManager = new SceneManagerClass()
