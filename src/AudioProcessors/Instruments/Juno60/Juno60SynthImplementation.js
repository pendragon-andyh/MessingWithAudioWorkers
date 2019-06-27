import { BaseInstrumentImplementation } from "../BaseInstrumentImplementation.js"
import { Juno60VoiceImplementation } from "./Juno60VoiceImplementation.js";
import { SmoothMoves } from "../../smoothMoves.js"

export class Juno60SynthImplementation extends BaseInstrumentImplementation{
  constructor(patch, sampleRate, postMessageFunc) {
    for(var i=0; i<6; i++) {
      this.voices.push(new Juno60VoiceImplementation(i))
    }

    this.vcaLevel = new SmoothMoves(0.5, sampleRate)
    this.hpfCutoff=new SmoothMoves(0.0, sampleRate)
    
    super(patch, sampleRate, postMessageFunc)
  }

  /**
   * @param {Float32Array[][]} inputs - List of inputs
   * @param {Float32Array[][]} outputs - List of outputs.
   * @param {Float32Array[]} parameters - List of audio parameter values.
   * @param {object[]} messageQueue - Queue of messages posted from the front-end node.
   */
  process(inputs, outputs, parameters, messageQueue) {
    this.processMessages(messageQueue)

    const output=outputs[0]
    const left=output[0], right=output[1]

    for(let i=0; i<left.lenght; i++){
      // TODO - LFO

      const bendValue=this.pitchBend.getNextValue()
      
      let monoOut=0.0
      for(let voice of this.voices) {
        monoOut+=voice.process(lfoValue, bendValue)

        if(this.waitingNotes.length&&voice.isActive()) {
          const waitingNote=this.waitingNotes.shift()
          voice.noteOn(waitingNote.noteNumber, waitingNote.velocity)
          monoOut+=voice.process(lfoValue, bendValue)
        }
      }

      monoOut*=this.vcaLevel.getNextValue()

      // TODO - HPF
      // TODO - Chorus

      left[i]=monoOut
      right[i]=monoOut

      return true
    }
  }

  allocateVoices(waitingNotes, voices) {
    // TODO
  }

  updatePatch(patch) {
    
  }
}
