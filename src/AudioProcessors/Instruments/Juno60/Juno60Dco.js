import { DcoCore } from '../../Sources/dcoCore.js'
import { SmoothMoves } from '../../smoothMoves.js'

export class Juno60Dco extends DcoCore {
  /**
   * Create new Juno60-style DCO.
   * @param {number} noteNumber - Default note number.
   * @param {number} sampleRate - Samples-per-second for the current audio context.
   */
  constructor(noteNumber, sampleRate) {
    super(noteNumber, sampleRate)

    this.sawLevel=new SmoothMoves(0.25, sampleRate) // 0.25 = on.
    this.pulseLevel=new SmoothMoves(0.25, sampleRate) // 0.25 = on.
    this.subLevel=new SmoothMoves(0.25, sampleRate) // 0.25 = sub-slider at 10.
  }

  /** Pulse-modulation source ("m"anual, "l"fo, "e"nvelope). */
  pwmSource="m"

  /** Pulse-width (0.0 to 1.0 - where 0.0 is a square wave) */
  pwmWidth=0.0

  // Private.
  currentPhase=0.75 //Juno60 starts 3/4 way through cycle.
  subOutput=-1.0
  pwmComparisonLevel=0.5

  process(lfoValue, envValue, bendValue) {
    let origSubOutput=this.subOutput
    let newSubOutput=origSubOutput

    // Increment phase [0-1]. Wrap-around if the cycle is complete.
    const phaseIncrement=this.calcPhaseIncrement(lfoValue, envValue, bendValue)
    this.currentPhase+=phaseIncrement
    if(this.currentPhase>1.0) {
      this.currentPhase-=1.0
      this.pwmComparisonLevel=this.calcPwmComparisonLevel(lfoValue, envValue)
      newSubOutput=newSubOutput>0.0? -1.0:+1.0
      this.subOutput=newSubOutput
    }

    // Phat sawtooth (mimics charging capacitor).
    let newSawOutput=Math.tanh(this.currentPhase)*2.626-1.0
    newSawOutput-=this.calcPolyBLEP2(this.currentPhase, phaseIncrement, 1.0)

    // Pulse uses a comparator against the current phase.
    // TODO - Implement leakage for this and the sub-osc.
    let newPulseOutput=this.currentPhase>this.pwmComparisonLevel? 1.0:-1.0
    newPulseOutput-=this.calcPolyBLEP2(this.currentPhase, phaseIncrement, 1.0)
    const x=this.currentPhase-this.pwmComparisonLevel
    newPulseOutput+=this.calcPolyBLEP2(x<0.0? x+1.0:x, phaseIncrement, 1.0)
    newSubOutput-=this.calcPolyBLEP2(this.currentPhase, phaseIncrement, origSubOutput)

    // Return the mixed-down output.
    return (
      newSawOutput*this.sawLevel.getNextValue()+
      newPulseOutput*this.pulseLevel.getNextValue()+
      newSubOutput*this.subLevel.getNextValue()
    )
  }

  /**
   * Calculate the comparison level for pulse-waves.
   * @param {number} lfoValue - Current value of the LFO.
   * @param {number} envValue - Current value of the envelope.
   */
  calcPwmComparisonLevel(lfoValue, envValue) {
    let width=this.pwmWidth
    switch(this.pwmSource) {
      case "l":
        width*=(lfoValue+1.0)*0.5
        break
      case "e":
        width*=envValue
        break
    }
    return 0.5+width
  }
}
