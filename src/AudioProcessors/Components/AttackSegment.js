export class AttackSegment {
  /**
  * Create an envelope attack segment.
  * @param {number} sampleRate - Samples-per-second for the current audio context.
  * @param {number} attackTCO - For analog this is often "Math.exp(-1.5)".
  * @param {number} target - Target level at-which this segment should stop.
  */
  constructor(sampleRate, attackTCO, target) {
    this._sampleRate=sampleRate;
    this._attackTCO=attackTCO;
    this.target=target;
  }
  /**
   * Configure the segment so that it would attack from 0 to +1 in the specified number of seconds.
   * @param {number} seconds - Planned duration of the segment (if the segment runs from 0 to +1)
   */
  setDuration(duration) {
    const samples=this._sampleRate*duration;
    this._attackCoeff=Math.exp(-Math.log((1.0+this._attackTCO)/this._attackTCO)/samples);
    this._attackOffset=(1.0+this._attackTCO)*(1.0-this._attackCoeff);
  }
  /**
   * Calculate the next value of this segment of the envelope.
   * @param {number} previousValue - Previous value of the envelope.
   * @returns {number} - Next value of the envelope
   */
  process(previousValue) {
    return (previousValue*this._attackCoeff)+this._attackOffset;
  }
  
  /**
   * @param {number} value - Value to test.
   * @returns {bool} - True if the value if the segment is now complete.
   */
  isComplete=(value) => value>this.target;
}
