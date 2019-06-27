/**
 * Base implementation of an instrument voice.
 * @abstract
 */
export class BaseVoiceImplementation {
  /**
   * @protected
   * @param {number} sampleRate - Samples-per-second for the current audio context.
   * @param {Object} patch - Object containing the instrument's initial patch.
   * @param {Object[]} envelopes - List of envelope-like objects (that can be triggered and released). First is the primary VCA envelope.
   */
  constructor(sampleRate, patch, envelopes) {
    this._sampleRate=sampleRate
    this._envelopes=envelopes

    this.update(patch)
  }

  /**
   * Current note number (set from the noteOn method).
   * @property
   */
  noteNumber=-1

  /**
   * Trigger velocity of the note (set from the noteOn method).
   * Velocity-sensitive instruments may use this in their "update(patch)" method.
   * @property
   */
  attackVelocity=64

  /**
   * Release velocity of the note (set from the noteOff method).
   * Velocity-sensitive instruments may use this in their "update(patch)" method.
   * @property
   */
  releaseVelocity=64

  /**
   * Current patch values.
   * @property
   * @protected
   */
  _currentPatch=null

  /**
   * Test if the voice is currently being used.
   * @returns {boolean} True if the envelope is currently active.
   */
  isActive() {
    return this._envelopes[0].isActive()
  }

  /**
   * Test if the voice is currently in its "release" phase.
   * @returns {boolean} True if the envelope is currently released.
   */
  isReleased() {
    return this._envelopes[0].isReleased()
  }

  /**
   * Test if the voice is currently in its "shutting-down" phase.
   * @returns {boolean} True if the envelope is currently shutting-down.
   */
  isShuttingDown() {
    return this._envelopes[0].isShuttingDown()
  }

  /**
   * Start (or retrigger) the specified note.
   * @param {number} noteNumber - Current note number.
   * @param {number} velocity - Attack velocity.
   */
  noteOn(noteNumber, velocity) {
    this.noteNumber=noteNumber
    this.attackVelocity=velocity
    this.releaseVelocity=64

    // Update the voice configuration to reflect the potentially-changed state of the voice.
    this.update(_currentPatch)

    // Trigger all of the envelopes.
    for(let env in this._envelopes) {
      env.trigger()
    }
  }

  /**
   * Release the current note.
   * @param {number} velocity - The release Velocity of the note.
   */
  noteOff(velocity) {
    this.releaseVelocity=velocity

    // Update the voice configuration to reflect the potentially-changed state of the voice.
    this.update(_currentPatch)
    
    // Release all of the envelopes.
    for(let env in this._envelopes) {
      env.release()
    }
  }

  /**
   * Shutdown the main VCA envelope (when you need all notes to stop quickly, or when you are stealing voices).
   */
  shutdown() {
    this._envelopes[0].shutdown()
  }

  /**
   * Apply an update of the patch settings.
   * Must be overridden in sub-classes.
   * @virtual
   * @param {Object} patch - Object containing the instrument's new patch.
   */
  update(patch) {
    this._currentPatch=patch
  }
}
