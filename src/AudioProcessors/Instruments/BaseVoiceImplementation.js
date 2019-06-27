import { BaseEnvelope } from "../Components/BaseEnvelope.js"

/**
 * Base implementation of an instrument voice.
 * @abstract
 */
export class BaseVoiceImplementation {
  /**
   * @protected
   * @param {number} sampleRate - Samples-per-second for the current audio context.
   * @param {Object} patch - Object containing the instrument's initial patch.
   * @param {BaseEnvelope[]} envelopes - List of envelope-like objects (that can be triggered and released). First is the primary VCA envelope.
   */
  constructor(sampleRate, patch, envelopes) {
    this._sampleRate=sampleRate

    /** @protected */
    this._envelopes=envelopes

    this.update(patch)
  }

  /**
   * Current note number (set from the noteOn method).
   */
  noteNumber=-1

  /**
   * Trigger velocity of the note (set from the noteOn method).
   * Velocity-sensitive instruments may use this in their "update(patch)" method.
   */
  triggerVelocity=64

  /**
   * Timestamp for the latest note-trigger event.
   * May be used for prioritising voice allocation.
   * */
  triggerTimestamp=-1.0

  /**
   * Release velocity of the note (set from the noteOff method).
   * Velocity-sensitive instruments may use this in their "update(patch)" method.
   */
  releaseVelocity=64

  /**
   * Timestamp for the latest note-release event.
   * May be used for prioritising voice allocation.
   */
  releaseTimestamp=-1.0
  
  /**
   * Current patch values.
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
   * @param {number} currentTime - Current time of the audio-context.
   */
  noteOn(noteNumber, velocity, currentTime) {
    this.noteNumber=noteNumber
    this.attackVelocity=velocity
    this.releaseVelocity=64
    this.triggerTimestamp=currentTime
    this.releaseTimestamp=-1.0

    // Update the voice configuration to reflect the potentially-changed state of the voice.
    this.update(_currentPatch)

    // Trigger all of the envelopes.
    for(let env of this._envelopes) {
      env.trigger()
    }
  }

  /**
   * Release the current note.
   * @param {number} velocity - The release Velocity of the note.
   * @param {number} currentTime - Current time of the audio-context.
   */
  noteOff(velocity, currentTime) {
    this.releaseVelocity=velocity
    this.releaseTimestamp=currentTime

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
