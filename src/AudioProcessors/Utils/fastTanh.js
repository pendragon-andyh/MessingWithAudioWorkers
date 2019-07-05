export function fastTanh(x) {
  if(x<-3.0) {
    return -1.0
  } else if(x>3.0) {
    return 1.0
  }
  return (x*(27.0+x*x))/(27.0+9.0*x*x)
}
