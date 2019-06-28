import './BaseInstrumentNode.js'

export class SynthNode extends BaseInstrumentNode {
  /**
   * Create a new instance of a Juno60-like synthesisor.
   * @param {BaseAudioContext} ac - The audio-context that the new node will operate within.
   * @param {Object=} patch - Initial patch.
   */
  constructor(ac, patch) {
    super(ac, "Juno60SynthProcessor", patch|defaultPatch)
  }
}

/**
 * Available names for the Juno's parameters.
 */
export const Param={
  /** Name of the patch. */
  name: "name",
  /** VCA level (number - 0.0 to 1.0). */
  vca: "vca",
  /** VCA envelope type (string - "gate" or "env"). */
  vcaType: "vcaType",
  /** True if the LFO is triggerd automatically by the first note (boolean). */
  lfoAutoTrigger: "lfo.autoTrigger",
  /** Rate of the LFO (number - 0.0 to 1.0). */
  lfoFrequency: "lfo.frequency",

  etc: "etc"
}

/**
 * Available modes for modulating the VCA.
 */
export const VcaType={
  gate: "gate",
  env: "env"
}

export 

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
