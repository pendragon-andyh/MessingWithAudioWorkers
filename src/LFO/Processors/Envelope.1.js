// Envelope generator that emulates the Juno 60 ADSR envelope.
export class Envelope {
  phases={
    off: 0,
    attack: 1,
    decay: 2,
    sustain: 3,
    release: 4,
    shutdown: 5
  };

  phase=0;
  attackFactor=0;
  decayFactor=0;
  releaseFactor=0;
  sustainLevel=0
  targetAboveOne=1.41;
  targetBelowZero=-0.024;
  value=0;
  
  constructor(sampleRate) {
    this.attackAnchorRate=882.0/sampleRate;
    this.decayAnchorRate=0.22/sampleRate;
  }

  setAttackRate(slider) {
    // Convert slider position to approx Juno 60 "attackFactor".
    // 0 => 0.001s, 2.5 => 0.03s, 5 => 0.24s, 7.5 => 0.65, 10 => 3.25.
    this.attackFactor=this.attackAnchorRate*Math.pow(0.45738, slider);
    if(this.attackFactor<=0) {
      throw `Invalid attack-factor ${this.attackFactor} calculated for slider position ${slider}.`
    }
  }

  setDecayRate(slider) {
    // Convert slider position to approx Juno 60 "decayFactor".
    // 0 => 0.002s, 2.5 => 0.096s, 5 => 0.984s, 7.5 => 4.449, 10 => 19.783.
    this.decayFactor=this.decayAnchorRate*Math.pow(13600, (10-slider)*0.07);
    if(this.decayFactor<=0) {
      throw `Invalid decay-factor ${this.decayFactor} calculated for slider position ${slider}.`
    }
  }

  setReleaseRate(slider) {
    // Convert slider position to approx Juno 60 "releaseFactor".
    // 0 => 0.002s, 2.5 => 0.096s, 5 => 0.984s, 7.5 => 4.449, 10 => 19.783.
    this.releaseFactor=this.decayAnchorRate*Math.pow(13600, (10-slider)*0.07);
    if(this.releaseFactor<=0) {
      throw `Invalid release-factor ${this.decayFactor} calculated for slider position ${slider}.`
    }
  }

  process() {
    let oldValue=this.value, newValue=oldValue;

    if (this.phase===1) {
      let distToFullyCharged=this.targetAboveOne-oldValue;
      let inc=distToFullyCharged*this.attackFactor;
      newValue=oldValue+inc;
      if(newValue>=1) {
        this.phase++;
      }
    }

    if (this.phase===2) {
      let distToSustainLevel=(oldValue-this.sustainLevel)-this.targetBelowZero;
      let inc=distToSustainLevel*this.decayFactor;
      newValue=oldValue-inc;
      if(newValue<=this.sustainLevel) {
        newValue=this.sustainLevel
        this.phase++;
      }
    }

    if (this.phase===4) {
      let distToFullyDischarged=oldValue-this.targetBelowZero;
      let inc=distToFullyDischarged*this.releaseFactor;
      newValue=oldValue-inc;
      if(newValue<=0) {
        newValue=0;
        this.phase=0;
      }
    }

    return this.value=newValue;
  }
}
