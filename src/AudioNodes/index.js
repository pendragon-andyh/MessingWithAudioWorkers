import * as juno60 from "./Juno60SynthNode.js"

export default {
  /**
   * Load the AudioWorklet processors into memory.
   * @param {AudioContext} ac 
   */
  loadWorklet: function(ac) {
    return ac.audioWorklet.addModule("../AudioProcessors/Instruments/index.js")
  },

  juno60
}
