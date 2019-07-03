import { BaseVoiceImplementation } from "../BaseVoiceImplementation.js"
import { Juno60Dco } from "./Juno60Dco.js";
import { Noise } from "../../Sources/noise.js";
import { Juno60Envelope } from "./Juno60Envelope.js";

/**
 * Implementation of a single Juno60-like voice.
 */
export class Juno60VoiceImplementation extends BaseVoiceImplementation {
  /**
   * Create a new instance of a Juno60-like voice. 
   * @param {number} sampleRate - Samples-per-second for the current audio context.
   * @param {number} voiceIndex - Index of the voice.
   * @param {Object} patch - Object containing the instrument's initial patch.
   */
  constructor(sampleRate, voiceIndex, patch) {
    this._dco=new Juno60Dco(sampleRate)
    this._noise=new Noise(sampleRate)
    this._lpf=new DiodeLadderFilter(sampleRate)
    this._modEnvelope=new Juno60Envelope(sampleRate)
    this._vcaEnvelope=new Juno60Envelope(sampleRate)

    
    super(sampleRate, voiceIndex, patch, [ this._vcaEnvelope, this._modEnvelope ])
  }

  /**
   * Apply processing for a single tick of the audio clock.
   * @param {number} lfoValue - Current value of the LFO (-1.0 to +1.0).
   * @param {number} pitchBendValue - Current value of the pitch-bend.
   * @returns {number} - Output.
   */
  process(lfoValue, pitchBendValue) {
    const vcaEnvValue=this._vcaEnvelope.process()
    if(!this._vcaEnvelope.isActive()) {
      return 0.0
    }
    
    const filterEnvValue=this._modEnvelope.process()

    let output=this.dco.process(lfoValue, filterEnvValue, pitchBendValue)
    output+=this._noise.process()
    
    // TODO - add filter

    return output*vcaEnvValue
  }

  /**
   * Apply an update of the patch settings.
   * @override
   * @param {Object} patch - Object containing the instrument's new patch.
   * @param {string} patch.name - Name of the patch.
   * @param {number} patch.vca - Amplitude (between 0.0 and +1.0) of the voice.
   * @param {string} patch.vcaType - Envelope mode for the VCA ("gate" or "env")
   * @param {number} patch.dco.subAmount - Amount (between 0.0 and +1.0) of sub-oscilator audible within the voice.
   * @param {Object} patch.dco
   * @param {boolean} patch.dco.saw - True if the sawtooth-oscillator is audible.
   * @param {boolean} patch.dco.pulse - True if the pulse-oscillator is audible.
   * @param {boolean} patch.dco.sub - True if the sub-oscillator is audible.
   * @param {number} patch.dco.subAmount - Amount (between 0.0 and +1.0) of sub-oscilator audible within the voice.
   * @param {number} patch.dco.noise - Amount (between 0.0 and +1.0) of noise audible within the voice.
   * @param {number} patch.dco.pwm - Width (between 0.0 and +1.0) of the pulse-width.
   * @param {string} patch.dco.pwmMod - Type of modulation for the pulse-width ("l"=LFO, "e"=Envelope, "m"=Manual).
   * @param {number} patch.dco.lfo - Amount (between 0.0 and +1.0) that the LFO modulation the pitch of the voice.
   * @param {Object} patch.env
   * @param {number} patch.env.attack - Amount between 0.0 (fast-attack) and +1.0 (slow-attack) for the envelope.
   * @param {number} patch.env.decay - Amount between 0.0 (fast-decay) and +1.0 (slow-decay) for the envelope.
   * @param {number} patch.env.sustain - Amount (between 0.0 and +1.0) for the sustain-level of the envelope.
   * @param {number} patch.env.release - Amount between 0.0 (fast-release) and +1.0 (slow-release) for the envelope.
   */
  update(patch) {
    super.update(patch)

    let changeDuration=this.vcaEnvelope.isActive()? 128.0/this.sampleRate:0.0

    this.dco.note.linearRampToValueAtTime(this.noteNumber, changeDuration)

    const dco=patch.dco
    this.dco.pitchBendModDepth.linearRampToValueAtTime(0, changeDuration) // TODO - patches don't include this.
    this.dco.pitchLfoModDepth.linearRampToValueAtTime(dco.lfo, changeDuration)
    this.dco.pitchTranspose.linearRampToValueAtTime(0, changeDuration) // TODO - dco.range

    this.dco.pwmWidth.linearRampToValueAtTime(dco.pwmMod==="m"? dco.pwm*0.49:0.0, changeDuration)
    this.dco.pwmLfoModDepth.linearRampToValueAtTime(dco.pwmMod==="l"? dco.pwm*0.49:0.0, changeDuration) // TODO - what happens for negative ve?
    this.dco.pwmEnvModDepth.linearRampToValueAtTime(dco.pwmMod==="e"? dco.pwm*0.49:0.0, changeDuration)

    this.dco.sawLevel.linearRampToValueAtTime(dco.saw? 0.25:0.0, changeDuration)
    this.dco.pulseLevel.linearRampToValueAtTime(dco.pulse? 0.25:0.0, changeDuration)
    this.dco.subLevel.linearRampToValueAtTime(dco.sub? dco.subAmount*0.25:0.0, changeDuration)

    this.noise.level.linearRampToValueAtTime(dco.noise*0.25, changeDuration)

    const patchEnv=patch.env
    let attackDuration=0.001+(Math.exp(patchEnv.attack*5.0)-1)/(Math.exp(5.0)-1)*3.25
    let decayDuration=0.002+(Math.exp(patchEnv.decay*4.0)-1)/(Math.exp(4.0)-1)*patchEnv.decay*17.46
    let sustainLevel=patchEnv.sustain
    let releaseDuration=0.002+(Math.exp(patchEnv.release*4.0)-1)/(Math.exp(4.0)-1)*patchEnv.release*17.46
    if(patch.vcaType==="gate") {
      this._vcaEnvelope.setValues(0.003, 10.0, 1.0, 0.006)
      if(this._vcaEnvelope.isActive()&&!this._vcaEnvelope.isReleased()) {
        this._vcaEnvelope.doTrigger()
      }
    } else {
      this._vcaEnvelope.setValues(attackDuration, decayDuration, sustainLevel, releaseDuration)
    }

    this._modEnvelope.setValues(attackDuration, decayDuration, sustainLevel, releaseDuration)
  }
}
