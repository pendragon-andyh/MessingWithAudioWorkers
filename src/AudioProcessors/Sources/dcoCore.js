import { SmoothMoves } from '../smoothMoves.js'
import { convertNoteNumberToFrequency } from '../Utils/convertNoteNumberToFrequency.js';

export class DcoCore {
  constructor(noteNumber, sampleRate) {
    //The instrument/voice classes are responsible for setting these to good values.
    this.note = new SmoothMoves(noteNumber, sampleRate)
    this.pitchLfoModDepth = new SmoothMoves(0.0, sampleRate) //1=+/-note.
    this.pitchEnvModDepth = new SmoothMoves(0.0, sampleRate) //1=+/-note.
    this.pitchTranspose = new SmoothMoves(0.0, sampleRate) //12=+octave, -12=-octave.
    this.pitchOffset=new SmoothMoves(0.0, sampleRate) //Hz offset from main note. Normally used for detuning against another osc.
    
    /**
     * How much the pitch-bend lever impacts the pitch of the current note.
     */
    this.pitchBendModDepth = new SmoothMoves(0.0, sampleRate) //12=+/-octave.

    this._timePerSample = 1.0 / sampleRate
  }

  calcPhaseIncrement(lfoValue, envValue, bendValue) {
    const noteNumber=this.note.getNextValue()+
      this.pitchTranspose.getNextValue()+
      (lfoValue*this.pitchLfoModDepth.getNextValue())+
      (envValue*this.pitchEnvModDepth.getNextValue())+
      (bendValue * this.pitchBendModDepth.getNextValue())
    const noteFreq = convertNoteNumberToFrequency(noteNumber) + this.pitchOffset.getNextValue()
    return noteFreq * this._timePerSample
  }

  calcPolyBLEP2(phase, inc, height) {
    let result = 0.0
    if (phase < inc) {
      // Right side of transition.
      const t = phase / inc
      result = height * (t + t - t * t - 1.0)
    } else if (phase + inc > 1.0) {
      // Left side of transition.
      const t = (phase - 1.0) / inc
      result = height * (t * t + (t + t) + 1.0)
    }

    return result
  }
}
