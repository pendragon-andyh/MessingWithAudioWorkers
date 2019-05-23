export class JunoChorus {
  // Public
  leftOutputValue=0.0;          //Left output.
  rightOutputValue=0.0;         //Right output.

  // Private (and for testing).
  currentWetFactor=0.0;         //Current wet/dry mix.
  targetWetFactor=0.0;          //Required amount of wet/dry mix.

  isMono=0;                     //Mode3 is mono.

  delayRingBuffer=null;         //Ring-buffer for holding delayed samples.
  writeIndex=0;                 //Current "write" position of ring-buffer.
  readOffset=0.0;               //Offset of "read" position from the current write position.

  lfoCurrentDelayOffset=0.0;    //Current position of LFO cycle.
  lfoRateFactor=0;              //Amount of change for each LFO sample.
  lfoDirection=1;               //Current direction of the LFO triangle wave.

  pendingChanges=null;          //Method to execute when it is safe to change sensitive parameters.

  // Tuning.
  maxWetFactorDelta=0.001;      // Maximum rate that the "currentWetFactor" can move towards "targetWetFactor"
                                // to reduce pops due to parameter changes.

  constructor(sampleRate) {
    this.sampleRate=sampleRate;
    this.delayRingBuffer=new Float32Array(sampleRate*0.0054); //Set size of ring-buffer to max needed.
    this.readOffset=0.003505*sampleRate; //All Juno's chorus settings modulate AROUND this delay offset.
    this.setMode0(); //Initialize to "off" settings.
  }

  setMode(mode) {
    switch(mode) {
      case 0: this.setMode0();
      case 1: this.setMode1();
      case 2: this.setMode2();
      case 3: this.setMode3();
    }
  }

  setMode0 = () => this.initializeMode(0.5, 0.001845, false, 0.0);
  setMode1 = () => this.initializeMode(0.5, 0.001845, false, 0.5);
  setMode2 = () => this.initializeMode(1.0, 0.001845, false, 0.5);
  setMode3 = () => this.initializeMode(14.0, 0.00002, true, 0.5);

  initializeMode(sweepFreq, maxLfoDelayOffset, isMono, wetFactor) {
    // Callback-method to be used when it is safe to change pop-sensitive values.
    this.pendingChanges=() =>
      {
        this.isMono=isMono;
        this.targetWetFactor=wetFactor;
        this.maxLfoDelayOffset=maxLfoDelayOffset*this.sampleRate;
        this.lfoRateFactor=this.maxLfoDelayOffset*sweepFreq/this.sampleRate;
        this.pendingChanges=null;
      };

    if(this.currentWetFactor===0) {
      // Safe to immediately apply changes.
      this.pendingChanges();
    }
    else {
      // Delay until "currentWetFactor" reaches zero.
      this.targetWetFactor=0.0;
    }
  }

  process(inputDryValue) {
    // Insert the new input value to the delay line.
    this.writeSampleToDelayLine(inputDryValue);

    // Get the current wet/dry mix.
    let wetFactor=this.currentWetFactor;
    if(currentWetFactor!==this.targetWetFactor) {
      // If wet/dry mix has just changed then ease into it to avoid pop.
      wetFactor+=(wetFactor>this.targetWetFactor)?maxWetFactorDelta:-maxWetFactorDelta;
      this.currentWetFactor=wetFactor;
    }

    // If no wet then we can return early.
    if(wetFactor===0) {
      if(this.pendingChanges!==null) { this.pendingChanges(); }
      this.leftOutputValue=this.rightOutputValue=inputDryValue;
      return;
    }

    // Calculate LFO modulation of the delay-period.
    let lfoDelayOffset=this.calculateLfoDelayOffset();

    // Calculate left/right channel outputs.
    let leftWetValue=this.readInterpolatedValueFromDelayLine(this.readOffset-lfoDelayOffset);
    let rightWetValue=this.isMono ? leftWetValue : this.readInterpolatedValueFromDelayLine(this.readOffset+lfoDelayOffset);

    // TODO - Consider applying saturation/LPF to "leftWetValue" and "rightWetValue":
    // * The Juno's DCA is before the chorus. It was possible to "overdrive" the chorus.
    // * Often (but not on the Juno) you put a LPF before a BBD delay-line.

    // Mix wet/dry signals together.
    let dryOutputValue=inputDryValue*(1-wetFactor);
    this.leftOutputValue=leftOutputValue+(leftWetValue*wetFactor);
    this.rightOutputValue=dryOutputValue+(rightWetValue*wetFactor);

    return;
  }

  calculateLfoDelayOffset() {
    let lfoRateFactor=this.lfoRateFactor;
    let currentOffset=this.lfoCurrentDelayOffset;
    if(this.lfoDirection===1) {
      currentOffset+=lfoRateFactor;
      if(currentOffset>this.maxLfoDelayOffset) {
        lfoDirection=-1;
        currentOffset=this.lfoCurrentDelayOffset-lfoRateFactor;
      }
    }
    else {
      currentOffset-=lfoRateFactor;
      if(currentOffset<this.maxLfoDelayOffset) {
        lfoDirection=1;
        currentOffset=this.lfoCurrentDelayOffset+lfoRateFactor;
      }
    }

    this.lfoCurrentDelayOffset=currentOffset;
    return currentOffset;
  }

  writeSampleToDelayLine(value) {
    this.delayRingBuffer[this.writeIndex++]=value;
    if(this.writeIndex>=this.delayRingBuffer.length) {
      this.writeIndex=0;
    }
  }

  readInterpolatedValueFromDelayLine(index) {
    let intIndex=index|0;
    let fractionalIndex=index-intIndex;
    if(fractionalIndex<0) {
      intIndex--;
      fractionalIndex=index-intIndex;
    }

    var v1=this.readSampleFromDelayLine(intIndex);
    var v2=this.readSampleFromDelayLine(intIndex+1);

    return (v1*(1-fractionalIndex))+(v2*fractionalIndex);
  }

  readSampleFromDelayLine(index) {
    if(index>=this.delayRingBuffer.length) {
      index-this.delayRingBuffer.length;
    }
    return this.delayRingBuffer[index];
  }
}
