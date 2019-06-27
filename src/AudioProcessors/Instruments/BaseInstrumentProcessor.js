export class BaseInstrumentProcessor extends AudioWorkletProcessor{
  constructor(patch, implementationClass) {
    super()
    this.implementation = new implementationClass(patch, sampleRate, this.postMessage)
    this.port.onMessage=this.onMessage
  }

  process(inputs, outputs, parameters) {
    return this.implementation.process(inputs, outputs, parameters, this.messageQueue, currentTime)
  }

  postMessage(messageType, data) {
    this.port.postMessage({ messageType, data })
  }

  onMessage(event) {
    this.messageQueue.push(event.data)
  }

  messageQueue=[]
}
