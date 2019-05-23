export function applyApproximation(initialInput, initialChange, target, attempts, f){
  let resultMin=f(initialInput);
  if(resultMin==null) {
    throw `Input ${initialInput} is not valid.`
  }

  // Find best starting direction.
  let resultMax=f(initialInput+initialChange);
  if(resultMin==null) {
    throw `Input ${initialInput}+${initialChange} is not valid.`
  }
  let delta=Math.sign(target-resultMin)*Math.sign(resultMax-resultMin)*initialChange;
  
  // If delta is too small then grow.
  for(let i=0; i<100; i++){
    resultMax=f(initialInput+delta);
    if(resultMax!=null&&Math.sign(target-resultMin)==Math.sign(target-resultMax)) {
      delta+=delta;
    } else {
      break;
    }
  }

  // Successively approximate closer to the best input.
  let currentInput=initialInput;
  for(let i=0; i<attempts && Math.abs(delta)>0.0000000001; i++){
    delta*=0.5;
    resultMax=f(currentInput+delta);
    
    if(resultMax!=null&&Math.sign(target-resultMin)==Math.sign(target-resultMax)) {
      currentInput+=delta;
      resultMin=resultMax;
    }
  }

  return currentInput;
}
