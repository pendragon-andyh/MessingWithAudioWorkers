import { SmoothMoves } from '../../smoothMoves.js'

export class Juno60Chorus {
  constructor(sampleRate) {
    /** Sample rate */
    this._sampleRate=sampleRate

    /** Ring buffer (initialized to maximum required size) */
    this._delayRingBuffer=new Float32Array((sampleRate*0.0054)|0)

    /** Offset of the centre-point of the "read" position (offset from the current "writeIndex" position) */
    this._readOffset=0.003505*sampleRate

    /** Current wet/dry mix. */
    this._wetFactor=new SmoothMoves(0.0, sampleRate)
  }

  /** Left output */
  outputLeft=0.0

  /** Right output */
  outputRight=0.0

  /** Current "write" position of ring-buffer. */
  _writeIndex=0

  /** Set to true if the chorus effect is monophonic (left is identical to right). */
  _isMono=false

  /** Current position of LFO cycle. */
  _lfoCurrentDelayOffset=0.0

  /** Amount of change for each LFO sample. */
  _lfoRateFactor=0.0

  /** Current direction of the LFO triangle wave. */
  _lfoDirection=1

  /**
   * Set one of the Juno60's chorus modes.
   * @param {number} mode - Chorus mode (0, 1, 2, or 3).
   */
  setMode(mode) {
    switch(mode) {
      case 1:
        this.setMode1()
        break
      case 2:
        this.setMode2()
        break
      case 3:
        this.setMode3()
        break
      default:
          this.setOff()
          break
      }
  }

  /** Set the chorus-effect to off. */
  setOff=() => this.initializeMode(0.0, 0.0, false, 0.0)

  /** Set the chorus-effect to sound like the Juno60's "mode I" mode (mild chorus). */
  setMode1=() => this.initializeMode(0.513, 0.001845, false, 0.5)

  /** Set the chorus-effect to sound like the Juno60's "mode II" mode (deeper richer chorus). */
  setMode2=() => this.initializeMode(0.863, 0.001845, false, 0.5)

  /** Set the chorus-effect to sound like the Juno60's "mode I+II" mode (similar to Leslie rotary speaker). */
  setMode3=() => this.initializeMode(15.175, 0.0002, true, 0.5)

  /**
   * Initialize the current configuration for the effect.
   * @param {number} sweepFreq - Frequency of the LFO (Hz).
   * @param {number} maxLfoDelayOffset - Depth of the LFO's modulation of the delay-time (seconds).
   * @param {boolean} isMono - True if the chorus is mono, otherwise its stereo.
   * @param {number} wetFactor - Amount of "wet" to be output (between 0.0 and 1.0).
   */
  initializeMode(sweepFreq, maxLfoDelayOffset, isMono, wetFactor) {
    // Remove any current effect by reducing the wet-factor to zero.
    this._wetFactor.linearRampToValueAtTime(0.0, 0.01, () => {
      // Then change to the new settings.
      this._isMono=isMono
      this._maxLfoDelayOffset=maxLfoDelayOffset*this._sampleRate
      this._lfoRateFactor=4.0*maxLfoDelayOffset*sweepFreq

      // And increase the wet-factor back to the desired level.
      this._wetFactor.linearRampToValueAtTime(wetFactor, 0.01)
    })
  }

  /**
   * Process a single sample.
   * @param {number} inputDryValue - Current input value.
   */
  process(inputDryValue) {
    // Insert the new input value to the delay line.
    this._writeSampleToDelayLine(inputDryValue)

    // Get the current wet/dry mix.
    const wetFactor=this._wetFactor.getNextValue()
    if(wetFactor===0.0) {
      // If no wet then we can return early.
      this.leftOutputValue=this.rightOutputValue=inputDryValue
      return
    }

    // Calculate LFO modulation of the delay-period.
    const lfoDelayOffset=this._calculateLfoDelayOffset()

    // Calculate left/right channel outputs.
    const readcentrePoint=this._writeIndex+this._readOffset
    const leftWetValue=this._readInterpolatedValueFromDelayLine(readcentrePoint-lfoDelayOffset)
    const rightWetValue=this._isMono? leftWetValue:this._readInterpolatedValueFromDelayLine(readcentrePoint+lfoDelayOffset)

    // TODO - Consider applying saturation/LPF to "leftWetValue" and "rightWetValue":
    // * The Juno's DCA is before the chorus. It was possible to "overdrive" the chorus.
    // * Often (but not on the Juno) you put a LPF before a BBD delay-line.

    // Mix wet/dry signals together.
    const dryOutputValue=inputDryValue*(1.0-wetFactor)
    this.leftOutputValue=dryOutputValue+(leftWetValue*wetFactor)
    this.rightOutputValue=dryOutputValue+(rightWetValue*wetFactor)
  }

  /**
   * Calculate how much the LFO is modulating the chorus-depth by.
   * @returns {number} - Number of (fractional) samples that the LFO is currently modulating by.
   */
  _calculateLfoDelayOffset() {
    const lfoRateFactor=this._lfoRateFactor
    let currentOffset=this._lfoCurrentDelayOffset
    if(this._lfoDirection===1) {
      currentOffset+=lfoRateFactor
      if(currentOffset>this._maxLfoDelayOffset) {
        this._lfoDirection=-1
        currentOffset=this._lfoCurrentDelayOffset-lfoRateFactor
      }
    }
    else {
      currentOffset-=lfoRateFactor
      if(currentOffset<-this._maxLfoDelayOffset) {
        this._lfoDirection=1
        currentOffset=this._lfoCurrentDelayOffset+lfoRateFactor
      }
    }

    return this._lfoCurrentDelayOffset=currentOffset
  }

  /**
   * Write a single sample to the delay-line.
   * @param {number} value - Value to be written.
   */
  _writeSampleToDelayLine(value) {
    this._delayRingBuffer[this._writeIndex++]=value
    if(this._writeIndex>=this._delayRingBuffer.length) {
      this._writeIndex=0
    }
  }

  /**
   * Read an interpolated value from the delay-line.
   * @param {number} index - Index (float) of the the sample to be read.
   * @returns {number}
   */
  _readInterpolatedValueFromDelayLine(index) {
    const intIndex=index|0
    const v1=this._readSampleFromDelayLine(intIndex)
    const v2=this._readSampleFromDelayLine(intIndex+1)
    const fractionalIndex=index-intIndex
    return (v1*(1.0-fractionalIndex))+(v2*fractionalIndex)
  }

  /**
   * Read a single value from the delay-line.
   * @param {number} index - Index (int) of the the sample to be read.
   * @returns {number}
   */
  _readSampleFromDelayLine(index) {
    if(index>=this._delayRingBuffer.length) {
      index-=this._delayRingBuffer.length
    }
    return this._delayRingBuffer[index]
  }
}
