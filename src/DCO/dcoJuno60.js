import { DcoCore } from "./dcoCore.js";
import { SmoothMoves } from "./smoothMoves.js";

export class DcoJuno60 extends DcoCore {
	constructor(noteNumber, sampleRate) {
		super(noteNumber, sampleRate);

		this.sawLevel=new SmoothMoves(1.0, sampleRate);
		this.pulseLevel=new SmoothMoves(0.0, sampleRate);
		this.subLevel=new SmoothMoves(0.0, sampleRate);

		this.pwmWidth=new SmoothMoves(0.0, sampleRate);
		this.pwmLfoModDepth=new SmoothMoves(0.0, sampleRate);
		this.pwmEnvModDepth=new SmoothMoves(0.0, sampleRate);
	}

	// Public.
	onCycleComplete=null;
	currentPhase=0.29289;

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

		/*
		0=x*x*-2.0+1.0
		-1=x*x*-2
		0.5=x*x
		x=1
		0 => 1 => -1
		1 => 0 => +1
		0.707 => 0.29289 => 
		*/
		
		// Pulse uses a comparator against the sawtooth.
		// TODO - Implement leakage for this and the sub-osc.
		// TODO - Use phase instead of level?
		let newPulseOutput=this.sawOutput>pwmComparisonLevel? 1.0:-1.0;

		// Smear the previous and current values to reduce aliasing at the wrap-around points.
		this.subOutput=(this.subOutput*0.5)+(newSubOutput*0.5);
		this.sawOutput=(this.sawOutput*0.5)+(newSawOutput*0.5);
		this.pulseOutput=(this.pulseOutput*0.5)+(newPulseOutput*0.5);
		
		// Return the mixed-down output.
		return (this.sawOutput*this.sawLevel.getValue())+
			(this.pulseOutput*this.pulseLevel.getValue())+
			(this.subOutput*this.subLevel.getValue());
	}

	// For syncing one oscillator to the cycle of another.
	resetPhase(phase) {
		this.currentPhase=phase;
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
