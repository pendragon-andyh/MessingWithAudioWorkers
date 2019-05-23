export class SmoothMoves {
	constructor(value, sampleRate) {
		this.currentValue=value;
		this.targetValue=value;
		this.sampleRate=sampleRate;
	}

	// Private.
	stepSize=0.0;
	onMoveComplete=null;

	setValue(value) {
		this.targetValue=value;
		this.currentValue=value;
	}

	linearRampToValueAtTime(value, duration, onComplete) {
		this.targetValue=value;
		if(duration) {
			this.stepSize=(value-this.currentValue)/(duration*sampleRate);
			this.onMoveComplete=onComplete;
		} else {
			this.currentValue=value;
		}
	}

	getValue() {
		let value=this.currentValue;
		if(value!==this.targetValue) {
			value+=this.stepSize;
			if(Math.sign(this.targetValue-value)*Math.sign(this.targetValue-this.currentValue)<=0){
				value=this.targetValue;
				if(this.onMoveComplete!=null) { this.onMoveComplete(); }
			}
			this.currentValue=value;
		}
		return value;
	}
}
