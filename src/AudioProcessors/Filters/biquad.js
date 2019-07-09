/** Implementation of a single-pole low pass filter (with 6db rolloff). */
export class BiquadFilterAsSinglePoleLowPass extends BiquadFilter {
  /**
   * Create filter.
   * @param {number} fc - Cutoff frequency (Hz).
   * @param {number} fs - Sample rate of audio-context (Hz).
   */
  constructor(fc, fs) {
    super(fs)
    this.setCoefficients(fc)
  }

  /**
   * Calculate the coefficients for the filter.
   * @param {number} fc - Cutoff frequency (Hz).
   */
  setCoefficients(fc) {
    const b1=-Math.exp(-2.0*fc*this.piOverSampleRate)
    super.setCoefficients(1.0+b1, 0.0, 0.0, b1, 0.0)
  }
}

/**
 * Biquad filter.
 */
export default class BiquadFilter {
  constructor(fs) {
    this.piOverSampleRate=Math.PI/fs
  }

  a0=0.0
  a1=0.0
  a2=0.0
  b1=0.0
  b2=0.0

  /**
   * Process a single sample through the filter.
   * @param {number} xin - Input value.
   * @returns {number} - Output value.
   */
  process(xin) {
    // TODO
    return xin
  }
  
  /**
   * Set the coefficients for the filter.
   * @param {number} a0 
   * @param {number} a1 
   * @param {number} a2 
   * @param {number} b1 
   * @param {number} b2 
   */
  setCoefficients(a0, a1, a2, b1, b2) {
    this.a0=a0
    this.a1=a1
    this.a2=a2
    this.b1=b1
    this.b2=b2
  }
}
