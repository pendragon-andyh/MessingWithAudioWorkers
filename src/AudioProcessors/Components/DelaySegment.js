export class DelaySegment {
  /**
  * Create an envelope delay segment.
  * @param {number} sampleRate - Samples-per-second for the current audio context.
  */
  constructor(sampleRate) {
    this._sampleRate=sampleRate
  }

  _delaySampleCount=0
  _currentRemaining=0

  /**
   * Configure the segment so that it will delay for the specified number of seconds.
   * @param {number} seconds - Planned duration of the segment.
   */
  setDuration(duration) {
    const delaySampleCount=(this._sampleRate*duration)|0
    this._currentRemaining+=(delaySampleCount-this._delaySampleCount)
    this._delaySampleCount=delaySampleCount
  }

  /**
   * Reset the segment.
   */
  reset() {
    this._currentRemaining=this._delaySampleCount
  }

  /**
   * Calculate the next value of this segment of the envelope.
   * @param {number} previousValue - Previous value of the envelope.
   * @returns {number} - Next value of the envelope.
   */
  process(previousValue) {
    this._currentRemaining--
    return previousValue
  }
  
  /**
   * Test if the segment is now complete.
   * @returns {bool} - True if the value if the segment is now complete.
   */
  isComplete=() => this._currentRemaining<=0
}
