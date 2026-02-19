import * as THREE from 'three'
import { sceneManager } from '../../core/SceneManager'

/**
 * Manages post-processing renderer enhancements.
 *
 * Currently applies ACES Filmic tone mapping for a richer visual look.
 * Full bloom / post-processing pipeline (EffectComposer, UnrealBloomPass)
 * can be added later by importing from three/examples/jsm/postprocessing.
 */
export class PostProcessingManager {
  private composer: unknown = null // Will be EffectComposer if available

  constructor() {
    // Enhance the renderer settings for a nicer look
    const renderer = sceneManager.renderer
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
  }

  render(): void {
    // If composer is set up, use it; otherwise fall through to normal render
    if (this.composer) {
      (this.composer as { render(): void }).render()
    }
    // Normal rendering is handled by sceneManager.render()
  }

  dispose(): void {
    // cleanup
  }
}
