import { Noise } from './noise.js';

class TestNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.noise=new Noise(sampleRate);
  }

  process(inputs, outputs, parameters) {
    // audio processing code here.
    const output=outputs[0];
    const outputChannel=output[0];

    for(let i=0; i<outputChannel.length; i++){
      outputChannel[i]=this.noise.process();
    }

    return true;
  }
}

registerProcessor('TestNoiseProcessor', TestNoiseProcessor);
