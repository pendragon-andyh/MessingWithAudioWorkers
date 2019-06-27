/**
 * Base implementation of an instrument audio node that is backed by an AudioWorklet processor.
 * @abstract
 */
class BaseInstrumentNode extends AudioWorkletNode{
  /**
   * @protected
   * @param {AudioContext} ac 
   * @param {string} processorName 
   * @param {Object} patch 
   */
  constructor(ac, processorName, patch) {
    super(ac, processorName, patch)
    this.onprocessorerror=(event) => { console.log("Exception from processor: " + event)}
  }

  /**
   * This is used to buffer "noteOff" events if the sustain pedal is on.
   */
  _sustainedNotes=null

  /**
   * Default treatment of MIDI messages (maps MIDI message-type numbers to implementations).
   * @property
   * @protected
   */
  midiMessageTypeMap={
    8: (data) => { this.noteOff(data[1], data[2]) },
    9: (data) => { this.noteOn(data[1], data[2]) },
    11: (data) => { this.controlChange(data[1], data[2]) },
    14: (data) => { this.pitchBend(((data[2]<<7)+data[1])/8192-1) }
  }

  /**
   * Default treatment of MIDI "controlChange" events (maps MIDI control-type numbers to implementations).
   * @property
   * @protected
   */
  controlChangeMap={
    64: (value) => {
      if(value>=64) {
        this.sustainPedalOn()
      } else {
        this.sustainPedalOff()
      }
    },
    123: () => {
      this.shutdownAll()
    }
  }

  /**
   * Send message to the instrument processor.
   * @protected
   * @param {string} messageType - Name of the message-type.
   * @param {Object} data - Payload data for the message (depends on the message-type).
   */
  postMessage(messageType, data) {
    this.port.postMessage({ messageType, data })
  }

  /**
   * Start a note.
   * @param {number} noteNumber - MIDI note number (69 = middle-A).
   * @param {number} velocity - Trigger velocity (range is 0 to 127).
   */
  noteOn(noteNumber, velocity) {
    if(velocity!==0) {
      // Pass "noteOn" message to the processor.
      this.postMessage("noteOn", { noteNumber, velocity: velocity|64 })
      
      // Remove any notes that are held by the sustain-pedal.
      this._sustainedNotes[noteNumber]=0
    } else {
      // Some devices use "noteOn(x, 0)" to signify "noteOff".
      this.noteOff(noteNumber, 64)
    }
  }

  /**
   * Release a note.
   * @param {number} noteNumber - MIDI note number (69 = middle-A).
   * @param {number} velocity - Release velocity (range is 0 to 127).
   */
  noteOff(noteNumber, velocity) {
    if(this._sustainedNotes===null) {
      // Pass "noteOff" message to the processor.
      this.postMessage("noteOff", { noteNumber, velocity })
    } else {
      // Sustain pedal is "on" - so store "noteOff" until pedal is "off".
      this._sustainedNotes[noteNumber]=1
    }
  }

  /**
   * Change the pitch-bend value of the instrument.
   * @param {number} value - New value of the pitch-bend (range is -1 to +1).
   */
  pitchBend(value) {
    this.postMessage("pitchBend", { value })
  }

  /**
   * Change to "sustain-pedal on" mode.
   */
  sustainPedalOn() {
    if(this._sustainedNotes===null) {
      // All "noteOff" events are stored-up until the pedal is released.
      this._sustainedNotes={}
    }
  }

  /**
   * Change to "sustain-pedal off" mode.
   */
  sustainPedalOff() {
    const notesToDrain=this._sustainedNotes

    // Stop storing-up released notes.
    this._sustainedNotes=null

    // Release any previously-sustained notes.
    for(let noteNumber in notesToDrain) {
      if(notesToDrain[noteNumber]===1) {
        this.noteOff(noteNumber|0, 64)
      }
    }
  }

  controlChange(controlNumber, value) {
    const controlHandler=this.controlChangeMap[controlNumber]
    if(controlHandler) {
      controlHandler.call(this, value)
    } else {
      this.postMessage("controlChange", { controlNumber, value })
    }
  }

  /**
   * Shutdown all active notes.
   */
  shutdownAll() {
    this.postMessage("shutdownAll")
    this._sustainedNotes=null
  }

  changePatch(patchData) {
    this.shutdownAll()
    this.postMessage("changePatch", { patchData })
  }

  updateParameter(parameterIndex, value) {
    this.postMessage("updateParameter", { parameterIndex, value })
  }

  /**
   * Process a MIDI input event.
   * @param {MIDIMessageEvent} event - MIDI input message (from Web MIDI API).
   */
  onMidiMessage(event) {
    const data=event.data
    const messageType=data[0]>>4
    const messageHandler=this.midiMessageTypeMap[messageType]
    if(messageHandler) {
      // We know how to process this type of message.
      messageHandler.call(this, data, event)
    } else {
      // We don't know how to process this type of message - so pass it along.
      this.postMessage("midiMessage", { data })
    }
  }
}
