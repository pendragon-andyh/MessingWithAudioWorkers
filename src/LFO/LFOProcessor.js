class LFOProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  static get parameterDescriptors() {
    return [{
      name: 'myParam',
      defaultValue: 0.707
    }];
  }

  process(inputs, outputs, parameters) {
    // audio processing code here.
    const output=outputs[0];
    const outputChannel=output[0];

    outputChannel[0]=1;

    return true;
  }
}

registerProcessor('LFO-processor', LFOProcessor);
