function createVolumeMeter(audioContext) {
  var processor = audioContext.createScriptProcessor(512);
  processor.volume = 0;
  processor.history = [];
  

  // this will have no effect, since we don't copy the input to the output,
  // but works around a current Chrome bug.
  processor.connect(audioContext.destination);

  processor.onaudioprocess = function(event) {
    var buf = event.inputBuffer.getChannelData(0);
    var length = buf.length;
    var sum = 0;

    for (var i = 0; i < length; i++) {
      sum += buf[i] * buf[i];
    }

    var rms =  Math.sqrt(sum / length);

    this.volume = Math.max(rms, this.volume * 0.95);
  }

  processor.stop = function() {
    this.disconnect();
    this.audioprocess = null;
  }

  return processor;  
}
