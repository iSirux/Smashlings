import * as THREE from 'three'

export interface TerrainConfig {
  width: number      // 500
  depth: number      // 500
  segments: number   // 128
  maxHeight: number  // 3
  color: number      // 0x2E7D32
}

export function generateForestTerrain(config: TerrainConfig): THREE.Mesh {
  // Create PlaneGeometry
  const geo = new THREE.PlaneGeometry(config.width, config.depth, config.segments, config.segments)
  geo.rotateX(-Math.PI / 2)

  // Vertex displacement using layered sine waves as cheap noise
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)

    // Multi-octave pseudo-noise using sin/cos combinations
    let h = 0
    h += Math.sin(x * 0.02) * Math.cos(z * 0.02) * config.maxHeight * 0.5
    h += Math.sin(x * 0.05 + 1.3) * Math.cos(z * 0.07 + 2.1) * config.maxHeight * 0.3
    h += Math.sin(x * 0.13 + 5.7) * Math.cos(z * 0.11 + 3.4) * config.maxHeight * 0.15

    // Flatten center area (spawn zone) - within 20 unit radius
    const distFromCenter = Math.sqrt(x * x + z * z)
    const flattenFactor = Math.min(1, Math.max(0, (distFromCenter - 20) / 30))
    h *= flattenFactor

    pos.setY(i, h)
  }

  geo.computeVertexNormals()

  const mat = new THREE.MeshStandardMaterial({
    color: config.color,
    flatShading: true, // low-poly look
  })

  const mesh = new THREE.Mesh(geo, mat)
  mesh.receiveShadow = true

  return mesh
}

export function generateDesertTerrain(config: TerrainConfig): THREE.Mesh {
  // Similar but flatter with sand dunes
  const geo = new THREE.PlaneGeometry(config.width, config.depth, config.segments, config.segments)
  geo.rotateX(-Math.PI / 2)

  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)

    // Gentle rolling dunes
    let h = 0
    h += Math.sin(x * 0.01 + z * 0.015) * config.maxHeight * 0.4
    h += Math.sin(x * 0.03 - z * 0.02) * config.maxHeight * 0.2

    const distFromCenter = Math.sqrt(x * x + z * z)
    const flattenFactor = Math.min(1, Math.max(0, (distFromCenter - 20) / 30))
    h *= flattenFactor

    pos.setY(i, h)
  }

  geo.computeVertexNormals()

  const mat = new THREE.MeshStandardMaterial({
    color: 0xD2B48C,
    flatShading: true,
  })

  const mesh = new THREE.Mesh(geo, mat)
  mesh.receiveShadow = true
  return mesh
}

// Helper: get terrain height at world position (bilinear interpolation on grid)
export function getTerrainHeight(terrain: THREE.Mesh, x: number, z: number): number {
  // Simple approximation using the geometry directly
  const geo = terrain.geometry as THREE.PlaneGeometry
  const params = geo.parameters
  const halfW = params.width / 2
  const halfD = params.height / 2
  const segW = params.widthSegments
  const segD = params.heightSegments

  // Map world coords to grid indices
  const gx = ((x + halfW) / params.width) * segW
  const gz = ((z + halfD) / params.height) * segD

  const ix = Math.floor(Math.max(0, Math.min(segW - 1, gx)))
  const iz = Math.floor(Math.max(0, Math.min(segD - 1, gz)))

  const pos = geo.attributes.position
  const idx = iz * (segW + 1) + ix

  if (idx >= 0 && idx < pos.count) {
    return pos.getY(idx)
  }
  return 0
}
