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
  canvasContext.fillStyle = "green";
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
   console.log(msg);
}

function enumerateDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    status('enumerateDevices() not supported.');
    return;
  }
  navigator.mediaDevices.enumerateDevices().then(devices => {
   const audioInputDevies = document.getElementById("audioInputDevices");
   const index = audioInputDevies.selectedIndex;
   for (let i = audioInputDevies.options.length - 1 ; i >= 0 ; i--) {
      audioInputDevies.remove(i);
    }
    devices.forEach(device => {
     if (device.kind === "audioinput") {
        const option = document.createElement('option');
        option.text = device.label || device.deviceId;
        option.value = device.deviceId;
        audioInputDevices.add(option);
      }
    });
    audioInputDevies.selectedIndex = Math.max(0, Math.min(index, audioInputDevies.options.length - 1));
  }).catch(error => {
    status(`Error getting devices: ${error}\n`);
  });
}

window.start = function() {

  // this is required for Firefox device selection to work!
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  const audioInputDevies = document.getElementById("audioInputDevices");
  const selected = audioInputDevies.value;

  status(`Using device: ${selected}\n`);

  const constraints = {audio: {deviceId: selected}};

  navigator.mediaDevices.getUserMedia(constraints).then(localStream => {
    status('getUserMedia success\n');
    enumerateDevices();

    const audioElement = document.getElementById('audioElement');
    audioElement.srcObject = localStream;

    stream = localStream;
    
    vad = new Vad(localStream);
    vad.onProcess = (currentVolume) => {
      const volume = document.getElementById('volume');
      volume.innerHTML = currentVolume;
      canvasContext.clearRect(0, 0, width, height);
      canvasContext.fillRect(0, 0, vad.currentVolume * width, height);
      canvasContext.stroke();
    };
  }).catch(error => {
    if (error.name == 'PermissionDeniedError') {
    status(`getUserMedia permission error: ${error.message}\n`);
    } else {
      status(`getUserMedia error: ${error}\n`);
    }
  });
}
