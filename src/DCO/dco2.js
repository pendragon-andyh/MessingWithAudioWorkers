import { SmoothMoves } from "./smoothMoves";

export default class DCO {
	constructor(noteNumber, sampleRate) {
		this.note=new SmoothMoves(noteNumber, sampleRate);

		this.sawLevel=new SmoothMoves(1.0, sampleRate);
		this.pulseLevel=new SmoothMoves(0.0, sampleRate);
		this.subLevel=new SmoothMoves(0.0, sampleRate);

		this.pitchBendModDepth=new SmoothMoves(0.0, sampleRate);
		this.pitchLfoModDepth=new SmoothMoves(0.0, sampleRate);
		this.pitchEnvModDepth=new SmoothMoves(0.0, sampleRate);
		this.pitchTranspose=new SmoothMoves(0.0, sampleRate);
		this.pitchOffset=new SmoothMoves(0.0, sampleRate);

		this.pwmWidth=new SmoothMoves(0.0, sampleRate);
		this.pwmLfoModDepth=new SmoothMoves(0.0, sampleRate);
		this.pwmEnvModDepth=new SmoothMoves(0.0, sampleRate);

		this.sampleRate=sampleRate;
		this.anchorFreqFactor=1/sampleRate;
	}

	// Public.
	onCycleComplete=null;
	currentPhase=0.0;

	// Private.
	sawOutput=0.0;
	pulseOutput=0.0;
	subOutput=0.0;
	
	process(lfoValue, envValue, bendValue) {
		const phaseIncrement=this.calcPhaseIncrement(lfoValue, envValue, bendValue);
		const pwmComparisonLevel=this.calcPwmComparisonLevel(lfoValue, envValue);

		// Increment phase [0-1]. Wrap-around if the cycle is complete.
		this.currentPhase+=phaseIncrement;
		let newSubOutput=this.subOutput;
		if(this.currentPhase>1.0) {
			this.currentPhase-=1.0;
			if(this.onCycleComplete) { this.onCycleComplete(); }
			newSubOutput=-Math.sign(newSubOutput);
		}

		// Sawtooth is curved (like a charging capacitor). Also reduces aliasing.
		// TODO - Tune the curve to match the Juno.
		let x=1.0-this.currentPhase;
		const newSawOutput=x*x*-2.0+1.0;
		
		// Pulse uses a comparator against the sawtooth.
		// TODO - Implement leakage for this and the sub-osc.
		// TODO - Use phase instead of level?
		let newPulseOutput=this.sawOutput>pwmComparisonLevel? 1.0:-1.0;

		// Smear the previous and current values to reduce aliasing at the wrap-around points.
		this.subOutput=(this.subOutput*0.5)+(newSubOutput*0.5);
		this.sawOutput=(this.sawOutput*0.5)+(newSawOutput*0.5);
		this.pulseOutput=(this.pulseOutput*0.5)+(newPulseOutput*0.5);
		
		// Return the mixed-down output.
		return (this.sawOutput*this.settings.sawLevel.getValue())+
			(this.pulseOutput*this.settings.pulseLevel.getValue())+
			(this.subOutput*this.settings.subLevel.getValue());
	}

	// For syncing one oscillator to the cycle of another.
	resetPhase(phase) {
		this.currentPhase=phase;
	}

	calcPhaseIncrement(lfoValue, envValue, bendValue) {
		let noteNumber=this.note.getValue()+this.pitchTranspose.getValue();

		if(lfoValue!==0.0) { noteNumber+=lfoValue*this.pitchLfoModDepth.getValue(); }
		if(envValue!==0.0) { noteNumber+=envValue*this.pitchEnvModDepth.getValue(); }
		if(bendValue!==0.0) { noteNumber+=bendValue*this.pitchBendModDepth.getValue(); }
		
		var noteFreq=(440.0*Math.pow(2, (noteNumber-69)/12))+this.pitchOffset.getValue();
		
		return this.anchorFreqFactor*noteFreq;
	}
	
	calcPwmComparisonLevel(lfoValue, envValue) {
		let pwmComparisonLevel=this.pwmWidth.getValue();

		if(lfoValue!==0.0) { pwmComparisonLevel+=lfoValue*this.pwmLfoModDepth.getValue(); }
		if(envValue!==0.0) { pwmComparisonLevel+=envValue*this.pwmEnvModDepth.getValue(); }

		if(pwmComparisonLevel<0.0) {
			pwmComparisonLevel=0.0;
		}
		else if(pwmComparisonLevel>0.98) {
			pwmComparisonLevel=0.98;
		}

		return pwmComparisonLevel;
	}
}
