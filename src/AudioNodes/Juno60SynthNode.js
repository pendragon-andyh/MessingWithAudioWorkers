import './BaseInstrumentNode.js'

export class Juno60SynthNode extends BaseInstrumentNode {
  /**
   * Create a new instance of a Juno60-like synthesisor.
   * @param {BaseAudioContext} ac - The audio-context that the new node will operate within.
   * @param {Object=} patch - Initial patch.
   */
  constructor(ac, patch) {
    super(ac, "Juno60SynthProcessor", patch|defaultPatch)
  }
}

const defaultPatch={
  name: 'Brass',
  vca: 0.7,
  vcaType: 'env',
  lfo: { autoTrigger: true, frequency: 0.5, delay: 0.6 },
  dco: { range: 1, saw: true, pulse: false, sub: false, subAmount: 0, noise: 0, pwm: 0, pwmMod: 'm', lfo: 0.1 },
  hpf: 0,
  vcf: { frequency: 0, resonance: 0, modPositive: true, envMod: 0.8, lfoMod: 0, keyMod: 0.4 },
  env: { attack: 0.2, decay: 0.4, sustain: 0.6, release: 0.2 },
  chorus: 1
}
