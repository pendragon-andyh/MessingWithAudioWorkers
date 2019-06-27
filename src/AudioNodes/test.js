import index from "./index"

index.loadWorklet(ac).then(function() {
  const synth=new index.juno60.SynthNode(ac, index.juno60.patches.Organ)
  synth.noteOn(69, 64)
  synth.controlChange()
})
