// Diode Ladder Filter based on Will Pirkle's C++ Code.
// Provides close approximation of Roland LPF (TB303, Juno, SH101, etc).

import OnePoleFilter from './onepolefilter.js'
import fastTanh from '../Utils/fastTanh.js'

export default class DiodeLadder {
  constructor({ cutoff, resonance, sampleRate }) {
    this.piOverSampleRate=Math.PI/sampleRate

    this.lpf1=new OnePoleFilter(this.piOverSampleRate)
    this.lpf2=new OnePoleFilter(this.piOverSampleRate)
    this.lpf3=new OnePoleFilter(this.piOverSampleRate)
    this.lpf4=new OnePoleFilter(this.piOverSampleRate)

    this.lpf1.a0=1.0
    this.lpf2.a0=0.5
    this.lpf3.a0=0.5
    this.lpf4.a0=0.5

    // last LPF has no feedback path
    this.lpf4.gamma=1.0
    this.lpf4.delta=0.0
    this.lpf4.epsilon=0.0

    this.setCutoff(cutoff)
    this.setResonance(resonance)
  }

  K=0.0
  gamma=0.0
  SG1=0.0
  SG2=0.0
  SG3=0.0
  SG4=0.0

  /**
   * Set the filter's cutoff frequency.
   * @param {number} cutoff - Cutoff frequency (Hz).
   */
  setCutoff(cutoff) {
    // Calculate alphas.
    const g=Math.tan(cutoff*piOverSampleRate)
    const betaG=1.0+g
    const deltaG=0.5*g
    this.lpf1.alpha=this.lpf2.alpha=this.lpf3.alpha=this.lpf4.alpha=g/betaG

    // Big G's and betas
    const G4=deltaG*(this.lpf4.beta=1.0/betaG)
    const G3=deltaG*(this.lpf3.beta=1.0/(betaG-deltaG*G4))
    const G2=deltaG*(this.lpf2.beta=1.0/(betaG-deltaG*G3))
    const G1=g*(this.lpf1.beta=1.0/(betaG-g*G2))

    this.SG4=1.0
    this.SG3=G4
    this.SG2=G4*G3
    this.SG1=this.SG2*G2
    this.gamma=this.SG1*G1

    // set gammas
    this.lpf1.gamma=1.0+G1*G2
    this.lpf2.gamma=1.0+G2*G3
    this.lpf3.gamma=1.0+G3*G4

    // set deltas
    this.lpf1.delta=g
    this.lpf2.delta=deltaG
    this.lpf3.delta=deltaG

    // set epsilons
    this.lpf1.epsilon=G2
    this.lpf2.epsilon=G3
    this.lpf3.epsilon=G4
  }

  /**
   * Set the amount of resonance.
   * @param {number} resonance - Amount of resonance (range is 0.0 to +1.0).
   */
  setResonance(resonance) {
    this.K=17.0*resonance
  }

  /**
   * Flush storage and clear feedback.
   */
  reset() {
    this.lpf1.reset()
    this.lpf2.reset()
    this.lpf3.reset()
    this.lpf4.reset()
  }

  /**
   * Process.
   * @param {number} xn - Input value.
   * @returns {number}
   */
  render(xn) {
    this.lpf3.setFeedback(this.lpf4.feedbackOutput())
    this.lpf2.setFeedback(this.lpf3.feedbackOutput())
    this.lpf1.setFeedback(this.lpf2.feedbackOutput())

    // Form input
    const sigma=
      this.SG1*this.lpf1.feedbackOutput()+
      this.SG2*this.lpf2.feedbackOutput()+
      this.SG3*this.lpf3.feedbackOutput()+
      this.SG4*this.lpf4.feedbackOutput()

    // Form input
    let U=(xn-this.K*sigma)/(1+this.K*this.gamma)

    // Non-linear processing.
    U=fastTanh(U)

    // Cascade of four filters.
    return this.lpf4.renderLPF(this.lpf3.renderLPF(this.lpf2.renderLPF(this.lpf1.renderLPF(U)))
    )
  }
}
