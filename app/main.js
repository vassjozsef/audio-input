import Vad from './volume-meter-fft.js';

var audiocContext = null;
var vad = null;
var volumeMeter = null;
var canvasContext = null;
var width = 0;
var height = 0;
var stream = null;

window.onload = function() {
  enumerateDevices();
  if (navigator.mediaDevices) {
    navigator.mediaDevices.ondevicechange = function(event) {
      status('Device change detected\n');
      enumerateDevices();
    }
  }

  const meter = document.getElementById('meter');
  width = meter.scrollWidth;
  height = meter.scrollHeight;
  canvasContext = meter.getContext('2d');
  canvasContext.fillStyle = 'green';
  canvasContext.rect(0, 0, width, height);
  canvasContext.stroke();
}

window.clearStatus = function() {
  const textarea = document.getElementById('statusArea');
  textarea.innerHTML = ''
}

function status(msg) {
   const textarea = document.getElementById('statusArea');
   textarea.innerHTML += msg;
   console.info(msg);
}

function enumerateDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    status('enumerateDevices() not supported.');
    return;
  }
  navigator.mediaDevices.enumerateDevices().then(devices => {
    const audioInputDevies = document.getElementById('audioInputDevices');
    const inputIndex = audioInputDevies.selectedIndex;
    audioInputDevies.innerHTML = '';

    const audioOutputDevices = document.getElementById('audioOutputDevices');
    const outputIndex = audioOutputDevices.selectedIndex;  
    audioOutputDevices.innerHTML = '';
    devices.forEach(device => {
      if (device.kind === 'audioinput') {
        const option = document.createElement('option');
        option.text = device.label || device.deviceId;
        option.value = device.deviceId;
        audioInputDevices.add(option);
      } else if (device.kind === 'audiooutput') {
        const option = document.createElement('option');
        option.text = device.label || device.deviceId;
        option.value = device.deviceId;
        audioOutputDevices.add(option);
      }
    });
    audioInputDevies.selectedIndex = Math.max(0, Math.min(inputIndex, audioInputDevies.options.length - 1));
    audioOutputDevices.selectedIndex = Math.max(0, Math.min(outputIndex, audioOutputDevices.options.length - 1));
  }).catch(error => {
    status(`Error getting devices: ${error.toString()}\n`);
  });
}

window.start = function() {

  // this is required for Firefox device selection to work!
  stop();

  const audioOutputDevies = document.getElementById('audioOutputDevices');
  const selectedOutput = audioOutputDevies.value;

  status(`Using output device ${selectedOutput}\n`);

  const audioElement = document.getElementById('audioElement');
  if (typeof audioElement.sinkId !== 'undefined') {
    audioElement.setSinkId(selectedOutput).catch(error =>
      status(`Failed to set output device: ${error.toString()}\n`)
    );
  } else {
    status('Cannot set audio output device\n');
  }

  const audioInputDevies = document.getElementById('audioInputDevices');
  const selectedInput = audioInputDevies.value;

  status(`Using input device: ${selectedInput}\n`);

  const constraints = {audio: {deviceId: selectedInput}};

  navigator.mediaDevices.getUserMedia(constraints).then(localStream => {
    status('getUserMedia success\n');
    enumerateDevices();

    audioElement.srcObject = localStream;

    stream = localStream;
    
    vad = new Vad(localStream);
    vad.onProcess = (currentVolume) => {
      const volume = document.getElementById('volume');
      volume.innerHTML = currentVolume;
      canvasContext.clearRect(0, 0, width, height);
      canvasContext.fillRect(0, 0, currentVolume * width, height);
      canvasContext.stroke();
    };
  }).catch(error => {
    status(`getUserMedia error: ${error.toString()}\n`);
  });
}

window.stop = function() {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
    stream = null;
  }

  if (vad) {
    vad.stop();
    vad = null;
  }
}
