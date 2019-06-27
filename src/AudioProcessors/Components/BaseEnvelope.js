/**
 * Base implementation of an envelope.
 */
export class BaseEnvelope {
  /**
   * Set of segments that form the envelope.
   * Must be configured in sub-classes.
   * @protected
   * @property
   */
  _segments=[];

  /**
   * Index of the current segment of the envelope (-1 = not currently active).
   * @protected
   * @property
   */
  _currentPhase=-1;

  /**
   * Current value of the envelope.
   * @protected
   * @property
   */
  _currentValue=0.0;

  /**
   * Returns true if the envelope is currently active.
   */
  isActive=() => this._currentPhase!==-1;

  /**
   * Returns true if the envelope is active, and has been released or shutdown.
   */
  isReleased=() => this.currentPhase!==0&&this.currentPhase!==1;

  /**
   * Returns true if the envelope is currently shutting-down.
   */
  isShuttingDown=() => this.currentPhase===this._segments.length-1;

  /**
   * Trigger (or retrigger) the envelope.
   */
  trigger() {
    this._currentPhase=0;
  }

  /**
   * Release the current note.
   * @virtual
   */
  release() {
    if(this._currentPhase!==-1) {
      this._currentPhase=this._segments.length-2;
    }
  }

  /**
   * Shutdown the envelope (when you need all notes to stop quickly, or when you are stealing voices).
   */
  shutdown() {
    if(this._currentPhase!==-1) {
      this._currentPhase=this._segments.length-1;
    }
  }

  /**
   * Calculate the next value of the envelope.
   */
  process() {
    if(this._currentPhase!==-1) {
      while(this._currentPhase<this._segments.length) {
        // Calculate the next value of the current segment.
        const segment=this._segments[this._currentPhase];
        const nextValue=segment.process(this._currentValue);
        if(segment.isComplete(nextValue)) {
          // Switch to next phase of the envelope.
          this._currentPhase++;
          if(this._currentPhase>=this._segments.length) {
            // All phases are complete, so update to "not-active".
            this._currentValue=0.0;
            this._currentPhase=-1;
            break;
          }
        }
        else {
          // Otherwise the calculate value was good.
          this._currentValue=nextValue;
          break;
        }
      }
    }
    return this._currentValue;
  }
}
