export default class MidiAdapter {
  _midiAccess
  _sysex = false

  withSysexMode() {
    _sysex=true;
    return this;
  }

  start(onStateChange) {
    if(navigator.requestMIDIAccess) {
      return await navigator.requestMIDIAccess({ sysex: _sysex }).then(
        (midiAccess) => {
          this._midiAccess=midiAccess
          this._midiAccess.onstatechange=onStateChange
        },
        () => {
          console.log("MIDI access failed.")
        })
    } else {
      console.log("MIDI is not available for this browser.")
    }
  }

  stop() {
    if(this._midiAccess) {
      this._midiAccess.inputs.forEach(x => { this.disconnectFromInput(x.id) })
    }
  }

  listInputs() {
    const results=[]
    if(this._midiAccess) {
      this._midiAccess.inputs.forEach(x => { results.push({ id: x.id, name: x.name, port: x }) })
    }
    return results
  }

  connectFromInput(portId, targetSynth) {
    if(this._midiAccess) {
      const port=this._midiAccess.inputs.get(portId)
      if(port) {
        // If port is already connected then send "all notes off" message to tidy-up.
        if(port.onmidimessage) { port.onmidimessage(123, 0) }

        // Bind the new synth to the MIDI port.
        port.onmidimessage=targetSynth.onMidiMessage.bind(targetSynth)

        // If the input is disconnected then disconnect the target synth.
        port.onstatechange=() => {
          if(port.state===MIDIPortDeviceState.disconnected && targetSynth) {
            this.disconnectFromInput(portId)
          }
        }
      } else {
        console.log(`Input port "${portId} not found`)
      }
    }
  }

  disconnectFromInput(portId) {
    this.connectFromInput(portId, null)
  }
}
