import { SmoothMoves } from "./smoothMoves.js";

export class DcoCore {
	constructor(noteNumber, sampleRate) {
    //The instrument/voice classes are responsible for setting these to good values.
		this.note=new SmoothMoves(noteNumber, sampleRate);
		this.pitchLfoModDepth=new SmoothMoves(0.0, sampleRate); //1=+/-note.
		this.pitchEnvModDepth=new SmoothMoves(0.0, sampleRate); //1=+/-note.
		this.pitchTranspose=new SmoothMoves(0.0, sampleRate); //12=+octave, -12=-octave.
		this.pitchOffset=new SmoothMoves(0.0, sampleRate); //Hz offset from main note. Normally used for detuning against another osc.
		this.pitchBendModDepth=new SmoothMoves(0.0, sampleRate); //12=+/-octave.

		this.sampleRate=sampleRate;
		this.timePerSample=1/sampleRate;
	}
  
	calcPhaseIncrement(lfoValue, envValue, bendValue) {
		let noteNumber=this.note.getValue()+this.pitchTranspose.getValue();

		if(lfoValue!==0.0) { noteNumber+=lfoValue*this.pitchLfoModDepth.getValue(); }
		if(envValue!==0.0) { noteNumber+=envValue*this.pitchEnvModDepth.getValue(); }
		if(bendValue!==0.0) { noteNumber+=bendValue*this.pitchBendModDepth.getValue(); }
		
		var noteFreq=(440.0*Math.pow(2, (noteNumber-69)/12))+this.pitchOffset.getValue();
		
		return noteFreq*this.timePerSample;
  }
  
	calcPolyBLEP2(phase, inc, height) {
    let result=0.0;
    if(phase<inc) {
			// Right side of transition.
			const t=phase/inc;
			result=height*((t+t)-(t*t)-1.0);
		}
		else if(phase+inc>1.0) {
			// Left side of transition.
			const t=(phase-1.0)/inc;
			result=height*((t*t)+(t+t)+1.0);
		}

		return result;
	}
}
