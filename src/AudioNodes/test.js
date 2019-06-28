import index from "./index"

index.loadWorklet(ac).then(function() {
  const synth=new index.juno60.SynthNode(ac, index.juno60.patches.Organ)
  synth.noteOn(69, 64)
  synth.updateParameterValue(index.juno60.Param.vca, 0.7)
})

/*
//Is the following feasible?

import juno60 from "https://www.github.io/audiotastic/juno60.js"
import sequencer from "https://www.github.io/audiotastic/simpleSequence.js"

var synth, seq, pattern
(async function(ac) {
  synth=await juno60.create(ac, juno60.patches.Organ).connect(ac.destination)

  seq=await sequencer.create(ac)
  seq.setBPM=120
  pattern=seq.createPattern(x =>
    [
      x.note(69, 64).volume(0.5),
      x.note(64, 64).volume(0.4),
      [ x.note(64, 64).volume(0.45), x.note(66, 64).volume(0.45).holdFor(2) ],
      x.pause()
    ])
    .connect(synth)
  await pattern.repeat(2)
  
})(ac)
*/
