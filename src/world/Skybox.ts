import * as THREE from 'three'

export function createForestSky(): THREE.Color {
  return new THREE.Color(0x87CEEB) // light sky blue
}

export function createDesertSky(): THREE.Color {
  return new THREE.Color(0xF5DEB3) // wheat color, hazy
}

// Optional: create a fog for atmosphere
export function createForestFog(): THREE.Fog {
  return new THREE.Fog(0x87CEEB, 80, 250) // start fading at 80 units, fully fogged at 250
}

export function createDesertFog(): THREE.Fog {
  return new THREE.Fog(0xF5DEB3, 60, 200)
}
