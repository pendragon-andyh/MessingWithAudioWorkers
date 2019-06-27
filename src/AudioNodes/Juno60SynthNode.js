import './BaseInstrumentNode.js'

export class SynthNode extends BaseInstrumentNode {
  /**
   * Create a new instance of a Juno60-like synthesisor.
   * @param {AudioContext} ac 
   * @param {Object} patch 
   */
  constructor(ac, patch) {
    super(ac, "Juno60SynthProcessor", patch|patches.Init)
  }
}

export const patches={
  "Init": [1, 2, 3, 4],
  "Organ": [1, 2, 3, 4]
}

export default juno60={ SynthNode, patches }
