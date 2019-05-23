// Triangle-wave LFO that emulates the Juno 60 LFO.
export class Lfo {
  direction=1;
  rateFactor=0;
  value=0;
  
  constructor(sampleRate) {
    this.anchorRate=1.2/sampleRate;
  }

  // TODO - Move this to synth implementation (because different synths map their slider-settings differently).
  // This would mean the synth is directly poking this.rateFactor into instances of this object.
  setRate(lfoSlider) {
    // Convert Juno slider position to the "rateFactor" that represents the frequency.
    // 0 => 0.3Hz, 5 => 3.5Hz, 10 => 21Hz
    this.rateFactor=this.anchorRate
      *Math.pow(1.53, lfoSlider)
      *(1+(Math.sin(Math.PI*lfoSlider/10)*0.39));
  }

  process() {
    let oldValue=this.value, newValue=oldValue;

    if(this.direction===1) {
      newValue+=this.rateFactor;
      if(newValue>1) {
        this.direction=-1;
        newValue=oldValue-this.rateFactor;
      }
    } else {
      newValue-=this.rateFactor;
      if(newValue<-1) {
        this.direction=1;
        newValue=oldValue+this.rateFactor;
      }
    }

    return this.value=newValue;
  }
}
