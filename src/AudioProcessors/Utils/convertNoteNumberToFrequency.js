import { interpolatedLookup } from "./interpolatedLookup.js.js";

export const noteTable=new Float64Array(121)
export const centTable=new Float64Array(101)
(function(){
	let noteFactor=Math.power(2, 1/12)
	let noteValue = 1.0
	for (let i = 0; i < noteTable.length; i++){
		noteTable[i]=noteValue
		noteValue*=noteFactor
	}
	
	let centFactor=Math.power(2, 1/1200)
	let centValue = 1.0
	for (let i = 0; i < centTable.length; i++){
		centTable[i]=centValue
		centValue*=centFactor
	}
})();

/**
 * Convert a MIDI note-number into a frequency.
 * @todo Need to test perf. Want something that goes faster than "440*pow(2, (noteNumber-69)/12)"
 *    because that is a very common calculation and the "POW" call is likely to be slow.
 * @param {number} noteNumber - MIDI note number (e.g. 69.0 = 440Hz = Middle A).
 */
export function convertNoteNumberToFrequency(noteNumber) {
	let freq = 8.175798915644 // Frequency of note 0.
  
  // If note-number is outside of our pre-computed factors then change the scale.
	while (noteNumber>=120.0){
		noteNumber-=120.0
		freq *= 1024.0
  }
	while (noteNumber<0.0){
		noteNumber+=120.0
		freq /= 1024.0
	}

  // Calculate the frequency of the integer portion of the note-number.
	const noteNumberInt=noteNumber|0
  freq*=interpolatedLookup(noteNumberInt, noteTable)
  
  // If there is a fractional part that lookup-and-apply the cents-based factor.
  const cents=(noteNumber-noteNumberInt)*100.0
  if(cents!==0) {
    freq*=interpolatedLookup(cents, centTable)
  }
  
  return freq
}
