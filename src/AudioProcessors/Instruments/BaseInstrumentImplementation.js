import { SmoothMoves } from "../smoothMoves.js"
import { BaseVoiceImplementation } from "./BaseVoiceImplementation.js"

/**
 * Base implementation for instruments.
 * @abstract
 */
export class BaseInstrumentImplementation {
  /**
   * @protected
   * @param {number} sampleRate - Sample rate of the AudioContext.
   * @param {function} postMessageFunc - Method for posting messages back to the front-end node.
   */
  constructor(patch, sampleRate, postMessageFunc) {
    this.sampleRate=sampleRate
    this.postMessageFunc=postMessageFunc

    this.pitchBend=new SmoothMoves(0, sampleRate)

    this.updatePatch(patch)
  }

  _patch=null
  _isPatchChanged=false

  /**
   * List of voices.
   * @property
   * @type {BaseVoiceImplementation[]}
   * @protected
   */
  voices=[]

  /**
   * List of notes that are waiting to be played.
   * @property
   * @protected
   */
  waitingNotes=[]

  /**
   * Mapping of message-types to handler methods.
   * @property
   * @protected
   */
  messageTypeHandlerMap={
    noteOn: (data) => {
      for(const voice of this.voices) {
          // If the note is already active then restart it.
          if(voice.noteNumber===data.noteNumber&&voice.isActive()&&!voice.isShuttingDown()) {
          voice.noteOn(data.noteNumber, data.velocity, currentTime)
          return
        }
      }

      // Otherwise queue it for assignment to a voice.
      this.waitingNotes.push(data)
    },
    noteOff: (data) => {
      // If the note is already active then release it.
      for(let voice of this.voices) {
        if(voice.noteNumber===data.noteNumber&&voice.isActive()&&!voice.isShuttingDown()) {
          voice.noteOff(data.velocity, currentTime)
        }
      }

      // If the note is waiting then remove it.
      for(let i=0; i<this.waitingNotes.length; i++) {
        if(this.waitingNotes[i].noteNumber===data.noteNumber) {
          this.waitingNotes.splice(i, 1)
          break
        }
      }
    },
    shutdownAll: (data) => {
      for(let voice in this.voices) {
        voice.shutdown(data.duration)
      }
    },
    pitchBend: (data) => {
      this.pitchBend.linearRampToValueAtTime(data.value, 128/this.sampleRate)
    },
    updatePatch: this.updatePatch
  }

  /**
   * Process any messages that have been posted to the back-end processor.
   * @param {Object[]} messageQueue - Array of messages.
   * @param {function} voiceAllocationFunc - Function for allocating voices to waiting notes.
   * @param {number} currentTime - Current time of the audio-context.
   */
  processMessages(messageQueue, voiceAllocationFunc, currentTime) {
    // Process the messages.
    for(const message of messageQueue) {
      const handler=this.messageTypeHandlerMap[message.messageType]
      if(handler) {
        handler.call(this, message.data, currentTime)
      }
    }

    // Update the instrument's patch if necessary.
    if(this._isPatchChanged) {
      this.update(this._patch)
    }

    // Allocate voices to new notes.
    if(this.waitingNotes.length) {
      // Count the number of available voices.
      let availableCount=0
      for(let voice of this.voices) {
        if(!voice.isActive()||voice.isShuttingDown()) {
          availableCount++
        }
      }

      if(availableCount<this.waitingNotes.length) {
        // Instrument does not have enough voices for the waiting notes - so invoke note-stealing/allocation.
        // * Poly-instruments normally switch low-priority notes to their "shutdown" phase.
        //      The normal "process()"  will then allocate the waiting notes as the voices become free.
        // * Mono-instruments normally use "portamento" to slide from current note to waiting note.
        voiceAllocationFunc.call(this, this.waitingNotes, this.voices, currentTime)
      }
    }
  }

  /**
   * Update the instrument's patch details.
   * @param {object} patch 
   */
  updatePatch(patch) {
    this._patch=patch
    this._isPatchChanged=true
  }

  /**
   * Update the instrument's internal settings from the latest patch.
   * This method MUST be extended/overridden in sub-classes.
   * @virtual
   * @param {object} patch - Latest patch settings.
   */
  update(patch) {
    this._isPatchChanged=false
    for(let voice of this.voices) {
      voice.update(patch)
    }
  }
}
