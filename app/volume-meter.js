export default class Vad {
  constructor(stream) {
    this.currentVolume = 0;
    const context = (this.context = new AudioContext());
    var processor = context.createScriptProcessor(512);
    processor.volume = 0;

    const source = context.createMediaStreamSource(stream);
    source.connect(processor);

    processor.onaudioprocess = (event) => {
      var buf = event.inputBuffer.getChannelData(0);
      var length = buf.length;
      var sum = 0;

      for (var i = 0; i < length; i++) {
        sum += buf[i] * buf[i];
      }

      var rms =  Math.sqrt(sum / length);

      this.currentVolume = Math.max(rms, this.currentVolume * 0.95);

      if (this.onProcess) {
        this.onProcess(this.currentVolume);
      }
    }

    // this will have no effect, since we don't copy the input to the output,
    // but works around a current Chrome bug.
    processor.connect(context.destination);

    this.processor = processor;
  }

  stop() {
    if (this.onProcess) {
      this.onProcess(0);
    }
    this.source.disconnetc();
    this.processor.disconnect();
    this.context.close();
  }
}
