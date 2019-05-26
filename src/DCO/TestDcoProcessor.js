import { DcoJuno60 } from './dcoJuno60.js';

class TestDcoProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.dco=new DcoJuno60(31, sampleRate);

    this.isComplete=false;
    var that=this;
    this.dco.note.linearRampToValueAtTime(103, 10.0, function() { that.isComplete=true; });
  }

  process(inputs, outputs, parameters) {
    // audio processing code here.
    const output=outputs[0];
    const outputChannel=output[0];

    for(let i=0; i<outputChannel.length; i++){
      outputChannel[i]=this.dco.process(0.0, 0.0, 0.0);
    }

    return !this.isComplete;
  }
}

registerProcessor('TestDcoProcessor', TestDcoProcessor);
