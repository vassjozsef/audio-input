import Vad from './volume-meter.js';

var audiocContext = null;
var vad = null;
var volumeMeter = null;

window.onload = function() {
  navigator.mediaDevices.ondevicechange = function(event) {
    status('Device change detected\n');
    enumerateDevices();
  }
}

window.clearStatus = function() {
  let textarea = document.getElementById("statusArea");
  textarea.innerHTML = "";
}

function status(msg) {
   let textarea = document.getElementById("statusArea");
   textarea.innerHTML += msg;
   console.log(msg);
}

window.enumerateDevices = function() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    status('enumerateDevices() not supported.');
  }
  navigator.mediaDevices.enumerateDevices().then(function(devices) {
    devices.forEach(function(device) {
      if (device.kind == 'audioinput') {
        status('Label: ' + device.label + ', id = ' + device.deviceId + '\n');
      }
     });
  }).catch(function(err) {
   status(err.name + ': ' + err.message);
  });
}

window.getAudio = function() {
  navigator.getUserMedia({audio: true},
  function(localStream) {
    status('getUserMedia success\n');
    vad = new Vad(localStream);
    vad.onProcess = (currentVolume) => {
      let volume = document.getElementById('volume');
      volume.innerHTML = currentVolume;
    };
  },
  function(error) {
    if (error.name == 'PermissionDeniedError') {
    status('getUserMedia permission error: ' + error.message + '\n');
    } else {
      status('getUserMedia error: ' + error + '\n');
    }
  });
}
