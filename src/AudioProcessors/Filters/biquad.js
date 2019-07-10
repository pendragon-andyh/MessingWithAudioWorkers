/**
 * @module
 * Common biquad filter implementations.
 * Based on original code by Nigel Redmon (https://www.earlevel.com/main/2013/10/13/biquad-calculator-v2/)
 */

/**
 * Biquad filter.
 * Note: Biquad filter is NOT designed for heavy modulation.
 */
export class BiquadFilter {
  constructor(fs) {
    this.piOverSampleRate=Math.PI/fs
  }

  a0=0.0
  a1=0.0
  a2=0.0
  b1=0.0
  b2=0.0
  _z1=0.0
  _z2=0.0

  /**
   * Flush storage and clear feedback.
   */
  reset() {
    this._z1=0.0
    this._z2=0.0
  }

  /**
   * Process a single sample through the filter (using transposed direct form II technique).
   * @param {number} xin - Input value.
   * @returns {number} - Output value.
   */
  process(xin) {
    const out=xin*this.a0+this._z1
    this._z1=xin*this.a1+this._z2-this.b1*out
    this._z2=xin*this.a2-this.b2*out
    return out
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
