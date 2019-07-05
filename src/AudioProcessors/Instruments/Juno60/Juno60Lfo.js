import { BaseEnvelope } from "../../Components/BaseEnvelope.js";
import { DelaySegment } from "../../Components/DelaySegment.js";
import { AttackSegment } from "../../Components/AttackSegment.js";
import { DecaySegment } from "../../Components/DecaySegment.js";
import { ShutdownSegment } from "../../Components/ShutdownSegment.js";

/**
 * Specific implementation of the Juno60 envelope.
 */
export class Juno60Lfo {
  /**
   * Create a Juno-60 envelope.
   * @param {number} sampleRate - Samples-per-second for the current audio context.
   */
  constructor(sampleRate) {
    this._sampleRate=sampleRate
    this._env=new BaseEnvelope()
    this._env._segments=[
      this._env.delay=new DelaySegment(sampleRate),
      this._env.attack=new AttackSegment(sampleRate, 0.03, 1.0, true),
      this._env.release=new DecaySegment(sampleRate, 0.025, 0.0, false),
      this._env.shutdown=new ShutdownSegment(sampleRate, 0.001)
    ];
    this._env.release.setDuration(0.1)
  }

  static curveFromRateSliderToFreq=Float64Array.from([0.3, 0.85, 3.39, 11.49, 22.22])
  static curveFromDelaySliderToDelay=Float64Array.from([0.0, 0.0639, 0.85, 1.2, 2.685])
  static curveFromDelaySliderToAttack=Float64Array.from([0.0, 0.053, 0.188, 0.348, 1.15])

  /** Current phase of the LFO (0.0 to 1.0) */
  currentPhase=1.0

  /** Current value of the LFO. */
  currentValue=0.0

  /** Has the LFO's cycled in the latest sample? This is useful when you want to automatically retrigger the envelope. */
  isRestarted=false

  /** Waveform ("none", "triangle", "square", "sine", "random", "noise") */
  waveform="triangle"

  /**
   * Returns true if the envelope is currently active.
   */
  isActive=() => this._env.isActive()

  /**
   * Trigger (or retrigger) the envelope.
   */
  doTrigger() {
    if(!this._env.isActive()) {
      this.currentPhase=1.0
      this.currentValue=0.0
    }
    this._env.doTrigger()
  }

  /**
   * Release the current note.
   * @virtual
   */
  doRelease() {
    this._env.doRelease()
  }

  /**
   * Shutdown the envelope (when you need all notes to stop quickly, or when you are stealing voices).
   */
  shutdown() {
    this._env.shutdown()
  }

  process() {
    if(!this._env.isActive()) {
      return 0.0
    }

    // Increment the phase of the LFO.
    this.isRestarted=false
    this.currentPhase+=this._phaseIncrement
    if(this.currentPhase>1.0) {
      this.isRestarted=true
      this.currentPhase-=1.0
    }

    // Calculate the envelope (as determined by the "delay" setting).
    const envValue=this._env.process()
    if(envValue===0.0) {
      // If no value then we can bail-out here.
      return 0.0
    }

    // Convert the phase into the output waveform.
    let value=0.0
    switch(this.waveform) {
      case "none":
        value=this.isRestarted
        break
      case "sine":
        value=Math.sin(this.currentPhase*2*Math.PI)
        break
      case "square":
        value=this.currentPhase>0.5?-1.0:1.0
        break
      case "random":
        value=this.isRestarted?(Math.random()*2.0-1.0):this.currentValue
        break
      case "noise":
        value=Math.random()*2.0-1.0
        break
      default:
        // Default to triangle.
        value=this.currentPhase*4
        if(value>1.0) { value=2.0-value }
        if(value<-1.0) { value=-2.0-value }
        break
      }

    this.currentValue=value

    return envValue*value
  }

  /**
   * Configure the LFO from direct values.
   * @param {number} frequency - Frequency of the LFO (cycles per second).
   * @param {number} delayDuration - Number of seconds for the duration of the delay phase.
   * @param {number} attackDuration - Number of seconds for the duration of the attack phase.
   */
  setValues(frequency, delayDuration, attackDuration) {
    this._phaseIncrement=frequency/this._sampleRate
    this._env.delay.setDuration(delayDuration)
    this._env.attack.setDuration(attackDuration)
  }

  /**
   * Configure the LFO from the Juno60's slider values.
   * @param {number} rateSlider - Value of the rate slider (0.0 to 1.0).
   * @param {number} delaySlider - Value of the delay slider (0.0 to 1.0).
   */
  setValuesFromJuno60Sliders(rateSlider, delaySlider) {
    const frequency=interpolatedLookup(rateSlider*(curveFromRateSliderToFreq.length-1), curveFromRateSliderToFreq)
    const delayDuration=interpolatedLookup(delaySlider*(curveFromDelaySliderToDelay.length-1), curveFromDelaySliderToDelay)
    const attackDuration=interpolatedLookup(delaySlider*(curveFromDelaySliderToAttack.length-1), curveFromDelaySliderToAttack)
    this.setValues(frequency, delayDuration, attackDuration)
  }
}
