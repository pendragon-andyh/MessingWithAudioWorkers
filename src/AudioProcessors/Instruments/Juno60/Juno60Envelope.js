import { BaseEnvelope } from "../../Components/BaseEnvelope";
import { ShutdownSegment } from "../../Components/ShutdownSegment";
import { DecaySegment } from "../../Components/DecaySegment";
import { AttackSegment } from "../../Components/AttackSegment";

/**
 * Specific implementation of the Juno60 envelope.
 */
export class Juno60Envelope extends BaseEnvelope {
  /**
   * Create a Juno-60 envelope.
   * @param {number} sampleRate - Samples-per-second for the current audio context.
   */
  constructor(sampleRate) {
    this._segments=[
      this.attack=new AttackSegment(sampleRate, 0.632, 1.0),
      this.decay=new DecaySegment(sampleRate, -0.02, 0.0, true),
      this.release=new DecaySegment(sampleRate, -0.02, 0.0, false),
      this.shutdown=new ShutdownSegment(sampleRate, 0.002)
    ];
  }
  /**
   * Configure the segements of the envelope.
   * @param {number} attackDuration - Number of seconds for the duration of the attack phase.
   * @param {number} decayDuration - Number of seconds for the duration of the decay phase.
   * @param {number} sustainLevel - Level of the sustain phase.
   * @param {number} releaseDuration - Number of seconds for the duration of the release phase.
   */
  setValues(attackDuration, decayDuration, sustainLevel, releaseDuration) {
    this.attack.setDuration(attackDuration);
    this.decay.target=sustainLevel;
    this.decay.setDuration(decayDuration);
    this.release.setDuration(releaseDuration);
  }
}
