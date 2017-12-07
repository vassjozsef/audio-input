var audiocContext = null;
var mediaStreamSource = null;
var volumeMeter = null;

window.onload = function() {
  navigator.mediaDevices.ondevicechange = function(event) {
    status('Device change detected\n');
    enumerateDevices();
  }
  audioContext = new AudioContext();
}

function clearStatus() {
  textarea = document.getElementById("statusArea");
  textarea.innerHTML = "";
}

function status(msg) {
   textarea = document.getElementById("statusArea");
   textarea.innerHTML += msg;
   console.log(msg);
}

function enumerateDevices() {
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

function getAudio() {
  navigator.getUserMedia({audio: true},
  function(localStream) {
    status('getUserMedia success\n');
    mediaStreamSource = audioContext.createMediaStreamSource(localStream);
    volumeMeter = createVolumeMeter(audioContext);
    mediaStreamSource.connect(volumeMeter);

    setInterval(function() {
      document.getElementById('volume');
      volume.innerHTML = volumeMeter.volume;
    }, 1000);
  },
  function(error) {
    if (error.name == 'PermissionDeniedError') {
    status('getUserMedia permission error: ' + error.message + '\n');
    } else {
      status('getUserMedia error: ' + error + '\n');
    }
  });
}
