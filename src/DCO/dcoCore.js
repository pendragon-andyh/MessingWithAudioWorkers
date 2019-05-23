import { SmoothMoves } from "./smoothMoves.js";

export class DcoCore {
	constructor(noteNumber, sampleRate) {
		this.note=new SmoothMoves(noteNumber, sampleRate);

		this.pitchBendModDepth=new SmoothMoves(0.0, sampleRate);
		this.pitchLfoModDepth=new SmoothMoves(0.0, sampleRate);
		this.pitchEnvModDepth=new SmoothMoves(0.0, sampleRate);
		this.pitchTranspose=new SmoothMoves(0.0, sampleRate);
		this.pitchOffset=new SmoothMoves(0.0, sampleRate);

		this.sampleRate=sampleRate;
		this.timePerSample=1/sampleRate;
	}
	
	calcPhaseIncrement(lfoValue, envValue, bendValue) {
		let noteNumber=this.note.getValue()+this.pitchTranspose.getValue();

		if(lfoValue!==0.0) { noteNumber+=lfoValue*this.pitchLfoModDepth.getValue(); }
		if(envValue!==0.0) { noteNumber+=envValue*this.pitchEnvModDepth.getValue(); }
		if(bendValue!==0.0) { noteNumber+=bendValue*this.pitchBendModDepth.getValue(); }
		
		var noteFreq=(440.0*Math.pow(2, (noteNumber-69)/12))+this.pitchOffset.getValue();
		
		return this.timePerSample*noteFreq;
	}
}
