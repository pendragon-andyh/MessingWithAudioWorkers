/**
 * One Pole Filter based on Will Pirkle's C++ Code.
 * @license "You may also use the code from the FX and Synth books without licensing or fees. 
 * The code is for you to develop your own plugins for your own use or for commercial use."
 * @see http://www.willpirkle.com/forum/licensing-and-book-code/licensing-and-using-book-code/
 */
export default class OnePoleFilter {
  /**
   * Create new instance of a single-pole filter.
   * @param {number} piOverSampleRate - The value of `PI / sampleRate`.
   */
  constructor(piOverSampleRate) {
    this.piOverSampleRate=piOverSampleRate
    Object.preventExtensions(this)
  }

  /** Feed-forward coefficient (based on the cutoff frequency) */
  alpha=1.0

  beta=0.0
  z1=0.0
  gamma=1.0
  delta=0.0
  epsilon=0.0
  a0=1.0
  feedback=0.0

  /**
   * Set the filter's cutoff frequency.
   * @param {number} cutoff - Cutoff frequency (Hz).
   */
  setCutoff(cutoff) {
    const g=Math.tan(cutoff*this.piOverSampleRate)
    this.alpha=g/(1.0+g)
  }

  /**
   * Set the feedback (used when one-pole-filter is used as part of a larger filter).
   * @param {number} feedback
   */
  setFeedback(feedback) {
    this.feedback=feedback
  }

  /**
   * Calculate the feedback.
   * @returns {number}
   */
  feedbackOutput() {
    return this.beta*(this.z1+this.feedback*this.delta)
  }

  /**
   * Flush storage and clear feedback.
   */
  reset() {
    this.feedback=0.0
    this.z1=0.0
  }

  /**
   * Process the input using a low-pass filter.
   * @param {number} xn - Input value.
   * @returns {number} Output value
   */
  renderLPF(xn) {
    xn=xn*this.gamma+this.feedback+this.epsilon*this.feedbackOutput()
    const vn=(this.a0*xIn-this.z1)*this.alpha
    const out=vn+this.z1
    this.z1=vn+out
    return out
  }

  /**
   * Process the input using a high-pass filter.
   * @param {number} xn - Input value.
   * @returns {number} Output value
   */
  renderHPF(xn) {
    return xn-this.renderLPF(xn)
  }
}
