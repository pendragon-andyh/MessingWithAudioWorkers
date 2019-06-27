import { BaseInstrumentProcessor } from "BaseInstrumentProcessor.js"
import { Juno60SynthImplementation } from "Juno60SynthImplementation.js"

/**
 * Worklet-processor for a Juno60-like synthesisor.
 * This class is only responsible for hosting the instrument-implementation and
 * shuttling messages to-and-from the front-end audio-node.
 * @private
 */
class Juno60SynthProcessor extends BaseInstrumentProcessor{
  /**
   * Create the instrument using the initial-patch and the implementation-class-type.
   * @param {Object} patch - Object that represents the initial patch.
   */
  constructor(patch) {
    // All of the audio calculations are delegated to an instance of the instrument-implementation.
    super(patch, Juno60SynthImplementation)
  }
}

registerProcessor("Juno60SynthProcessor", Juno60SynthProcessor)
