/**
 * Model a "decay" segment (where we want to "decay" or "release")
 */
export class DecaySegment {
  /**
   * Create an envelope decay segment.
   * @param {number} sampleRate - Samples-per-second for the current audio context.
   * @param {number} decayTCO - For analog this is often "Math.exp(-4.95)".
   * @param {number} target - Target level at-which this segment should stop.
   * @param {bool} isSustainAtEnd - Set to true if the end of the segment is the sustain phase.
   */
  constructor(sampleRate, decayTCO, target, isSustainAtEnd) {
    this._sampleRate=sampleRate;
    this._decayTCO=decayTCO;
    this.target=target;
    this._isSustainAtEnd=isSustainAtEnd;
  }
  /**
   * Configure the segment so that it would decay from +1 to 0 in the specified number of seconds.
   * @param {number} seconds - Planned duration of the segment (if the segment runs from +1 to 0)
   */
  setDuration(seconds) {
    const samples=this._sampleRate*seconds;
    this._decayCoeff=Math.exp(-Math.log((1.0+this._decayTCO)/this._decayTCO)/samples);
    this._decayOffset=(this.target-this._decayTCO)*(1.0-this._decayCoeff);
  }
  /**
   * Calculate the next value of this segment of the envelope.
   * @param {number} previousValue - Previous value of the envelope.
   * @returns {number} - Next value of the envelope
   */
  process(previousValue) {
    let result=(previousValue*this._decayCoeff)+this._decayOffset;
    if(this.value<this.target&&this._isSustainAtEnd) {
      result=this.target;
    }
    return result;
  }
  /**
   * @param {number} value - Value to test.
   * @returns {bool} - True if the value if the segment is now complete.
   */
  isComplete=(value) => value<this.target;
}
