/**
 * Model a "shutdown" segment (where we want to shutdown all notes, or where we need to steal voices)
 */
export class ShutdownSegment {
  /**
   * Create an envelope shutdown segment.
   * @param {number} sampleRate - Samples-per-second for the current audio context.
   * @param {number} seconds - Planned duration of the segment (if the segment runs from +1 to 0)
   */
  constructor(sampleRate, seconds) {
    this._shutdownRate=seconds/sampleRate;
  }
  /**
   * Calculate the next value of this segment of the envelope.
   * @param {number} previousValue - Previous value of the envelope.
   * @returns {number} - Next value of the envelope
   */
  process(previousValue) {
    let result=previousValue-this._shutdownRate;
    if(this.value<this.target) {
      result=this.target;
    }
    return result;
  }
  /**
   * @param {number} value - Value to test.
   * @returns {bool} - True if the value if the segment is now complete.
   */
  isComplete=(value) => value<=this.target;
}
