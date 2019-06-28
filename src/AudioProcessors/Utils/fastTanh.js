export function fastTanh(x) {
  if(x<-3) {
    return -1
  } else if(x>3) {
    return 1
  }
  return (x*(27+x*x))/(27+9*x*x)
}
